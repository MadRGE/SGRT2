import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import CotizacionCalculadora from '../components/CotizacionCalculadora';
import {
  Plus, Search, ArrowLeft, FileText, Calendar, DollarSign,
  TrendingUp, Send, CheckCircle, XCircle, Clock, Share2,
  ExternalLink, Package, Eye, Trash2
} from 'lucide-react';

interface Props {
  onBack: () => void;
  onConvertirProyecto?: (cotizacionId: string) => void;
}

interface Cotizacion {
  id: string;
  numero_cotizacion: string;
  nombre_cliente: string;
  estado: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  precio_total: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  precio_final: number;
  margen_porcentaje: number;
  motivo_descuento: string | null;
  url_publica: string | null;
  proyecto_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  usuarios_created?: { nombre: string; email: string };
  usuarios_updated?: { nombre: string; email: string };
}

const ESTADOS = [
  { value: 'borrador', label: 'Borrador', icon: FileText, iconClass: 'text-slate-600', badgeClass: 'bg-slate-100 text-slate-700' },
  { value: 'enviada', label: 'Enviada', icon: Send, iconClass: 'text-blue-600', badgeClass: 'bg-blue-100 text-blue-700' },
  { value: 'negociacion', label: 'En Negociación', icon: Clock, iconClass: 'text-yellow-600', badgeClass: 'bg-yellow-100 text-yellow-700' },
  { value: 'aceptada', label: 'Aceptada', icon: CheckCircle, iconClass: 'text-green-600', badgeClass: 'bg-green-100 text-green-700' },
  { value: 'rechazada', label: 'Rechazada', icon: XCircle, iconClass: 'text-red-600', badgeClass: 'bg-red-100 text-red-700' },
  { value: 'vencida', label: 'Vencida', icon: Calendar, iconClass: 'text-orange-600', badgeClass: 'bg-orange-100 text-orange-700' },
  { value: 'convertida', label: 'Convertida', icon: Package, iconClass: 'text-purple-600', badgeClass: 'bg-purple-100 text-purple-700' }
];

export default function Cotizaciones({ onBack, onConvertirProyecto }: Props) {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [filteredCotizaciones, setFilteredCotizaciones] = useState<Cotizacion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState<'lista' | 'nueva' | 'editar'>('lista');
  const [cotizacionEditando, setCotizacionEditando] = useState<string | undefined>();
  const [mostrarDetalles, setMostrarDetalles] = useState<string | null>(null);

  useEffect(() => {
    loadCotizaciones();
  }, []);

  useEffect(() => {
    let filtered = cotizaciones;

    if (filtroEstado !== 'todos') {
      filtered = filtered.filter(c => c.estado === filtroEstado);
    }

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(c =>
        c.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.numero_cotizacion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCotizaciones(filtered);
  }, [searchTerm, filtroEstado, cotizaciones]);

  const loadCotizaciones = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        usuarios_created:created_by(nombre, email),
        usuarios_updated:updated_by(nombre, email)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (data) {
      setCotizaciones(data);
      setFilteredCotizaciones(data);
    }

    setLoading(false);
  };

  const handleGuardarCotizacion = async (_cotizacionId: string) => {
    setVistaActual('lista');
    setCotizacionEditando(undefined);
    await loadCotizaciones();
  };

  const handleGenerarUrlPublica = async (cotizacionId: string) => {
    const urlPublica = crypto.randomUUID();

    const { error } = await supabase
      .from('cotizaciones')
      .update({ url_publica: urlPublica })
      .eq('id', cotizacionId);

    if (!error) {
      await loadCotizaciones();
      toast.success('URL pública generada exitosamente');
    }
  };

  const handleCambiarEstado = async (cotizacionId: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('cotizaciones')
      .update({ estado: nuevoEstado })
      .eq('id', cotizacionId);

    if (!error) {
      await loadCotizaciones();
    }
  };

  const handleEliminar = async (cotizacion: Cotizacion) => {
    if (!confirm(`¿Eliminar la cotización ${cotizacion.numero_cotizacion} de "${cotizacion.nombre_cliente}"?`)) return;
    const { data, error } = await supabase.functions.invoke('cotizacion-actions', {
      body: { action: 'soft-delete', cotizacionId: cotizacion.id },
    });
    if (error || (data && !data.success)) {
      toast.error('Error al eliminar: ' + (error?.message || data?.error));
      return;
    }
    toast.success('Cotización eliminada');
    await loadCotizaciones();
  };

  const copiarUrlPublica = (urlPublica: string) => {
    const url = `${window.location.origin}/cotizacion/${urlPublica}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiada al portapapeles');
  };

  const getEstadoInfo = (estado: string) => {
    return ESTADOS.find(e => e.value === estado) || ESTADOS[0];
  };

  const calcularStats = () => {
    const total = cotizaciones.length;
    const aceptadas = cotizaciones.filter(c => c.estado === 'aceptada').length;
    const enProceso = cotizaciones.filter(c => ['enviada', 'negociacion'].includes(c.estado)).length;
    const montoTotal = cotizaciones
      .filter(c => c.estado === 'aceptada')
      .reduce((sum, c) => sum + c.precio_total, 0);

    return { total, aceptadas, enProceso, montoTotal };
  };

  const stats = calcularStats();

  if (vistaActual === 'nueva') {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <button
          onClick={() => setVistaActual('lista')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Cotizaciones
        </button>

        <CotizacionCalculadora
          onSave={handleGuardarCotizacion}
          onCancel={() => setVistaActual('lista')}
        />
      </div>
    );
  }

  if (vistaActual === 'editar' && cotizacionEditando) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <button
          onClick={() => {
            setVistaActual('lista');
            setCotizacionEditando(undefined);
          }}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Cotizaciones
        </button>

        <CotizacionCalculadora
          cotizacionId={cotizacionEditando}
          onSave={handleGuardarCotizacion}
          onCancel={() => {
            setVistaActual('lista');
            setCotizacionEditando(undefined);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver al Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gestión de Cotizaciones</h1>
            <p className="text-slate-600 mt-1">Sistema inteligente con cálculo de márgenes</p>
          </div>
          <button
            onClick={() => setVistaActual('nueva')}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Cotización
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-slate-600" />
              <span className="text-sm text-slate-600">Total Cotizaciones</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">Aceptadas</span>
            </div>
            <p className="text-2xl font-bold text-green-800">{stats.aceptadas}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700">En Proceso</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">{stats.enProceso}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-700">Monto Aceptado</span>
            </div>
            <p className="text-xl font-bold text-purple-800">
              ${stats.montoTotal.toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por cliente o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los estados</option>
            {ESTADOS.map(estado => (
              <option key={estado.value} value={estado.value}>{estado.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCotizaciones.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>{searchTerm || filtroEstado !== 'todos' ? 'No se encontraron cotizaciones' : 'No hay cotizaciones registradas'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCotizaciones.map((cotizacion) => {
              const estadoInfo = getEstadoInfo(cotizacion.estado);
              const IconEstado = estadoInfo.icon;

              return (
                <div
                  key={cotizacion.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <IconEstado className={`w-5 h-5 ${estadoInfo.iconClass}`} />
                        <h3 className="font-semibold text-lg text-slate-800">
                          {cotizacion.nombre_cliente}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoInfo.badgeClass}`}>
                          {estadoInfo.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="font-mono">{cotizacion.numero_cotizacion}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(cotizacion.fecha_emision).toLocaleDateString('es-AR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          Margen: {cotizacion.margen_porcentaje.toFixed(1)}%
                        </span>
                        {cotizacion.descuento_porcentaje > 0 && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            -{cotizacion.descuento_porcentaje}% desc.
                          </span>
                        )}
                      </div>
                      {cotizacion.usuarios_created && (
                        <p className="text-xs text-slate-500 mt-1">
                          Por: {cotizacion.usuarios_created.nombre}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col md:items-end gap-2">
                      {cotizacion.descuento_porcentaje > 0 ? (
                        <div className="text-right">
                          <p className="text-sm text-slate-500 line-through">
                            ${cotizacion.precio_total.toLocaleString('es-AR')}
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            ${cotizacion.precio_final.toLocaleString('es-AR')}
                          </p>
                          <p className="text-xs text-orange-600">
                            Ahorro: ${cotizacion.descuento_monto.toLocaleString('es-AR')}
                          </p>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-blue-600">
                          ${cotizacion.precio_total.toLocaleString('es-AR')}
                        </p>
                      )}

                      <div className="flex gap-2">
                        {cotizacion.estado === 'borrador' && (
                          <button
                            onClick={() => {
                              setCotizacionEditando(cotizacion.id);
                              setVistaActual('editar');
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-sm transition-colors"
                          >
                            Editar
                          </button>
                        )}

                        {cotizacion.estado === 'borrador' && (
                          <button
                            onClick={() => handleCambiarEstado(cotizacion.id, 'enviada')}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Enviar
                          </button>
                        )}

                        {!cotizacion.url_publica && cotizacion.estado !== 'borrador' && (
                          <button
                            onClick={() => handleGenerarUrlPublica(cotizacion.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors flex items-center gap-1"
                          >
                            <Share2 className="w-3 h-3" />
                            Generar Link
                          </button>
                        )}

                        {cotizacion.url_publica && (
                          <button
                            onClick={() => copiarUrlPublica(cotizacion.url_publica!)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Copiar Link
                          </button>
                        )}

                        {cotizacion.estado === 'aceptada' && !cotizacion.proyecto_id && onConvertirProyecto && (
                          <button
                            onClick={() => onConvertirProyecto(cotizacion.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors flex items-center gap-1"
                          >
                            <Package className="w-3 h-3" />
                            Crear Proyecto
                          </button>
                        )}

                        <button
                          onClick={() => setMostrarDetalles(cotizacion.id === mostrarDetalles ? null : cotizacion.id)}
                          className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Ver
                        </button>

                        <button
                          onClick={() => handleEliminar(cotizacion)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors flex items-center gap-1"
                          title="Eliminar cotización"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {mostrarDetalles === cotizacion.id && (
                    <DetallesCotizacion cotizacionId={cotizacion.id} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DetallesCotizacion({ cotizacionId }: { cotizacionId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [cotizacionId]);

  const loadItems = async () => {
    const { data } = await supabase
      .from('cotizacion_items')
      .select('*')
      .eq('cotizacion_id', cotizacionId);

    if (data) setItems(data);
    setLoading(false);
  };

  if (loading) {
    return <div className="mt-4 text-center text-slate-500">Cargando...</div>;
  }

  const itemsConTramite = items.filter(i => i.tramite_tipo_id);

  return (
    <div className="mt-4 pt-4 border-t border-slate-200">
      <h4 className="font-semibold text-slate-700 mb-3">Detalle de Ítems</h4>
      <div className="space-y-2 mb-4">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between items-center bg-slate-50 p-3 rounded">
            <div>
              <p className="font-medium text-slate-800">{item.concepto}</p>
              <p className="text-sm text-slate-600">Cantidad: {item.cantidad}</p>
              {item.tramite_tipo_id && (
                <p className="text-xs text-blue-600 mt-1">✓ Generará expediente de trámite</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800">${item.subtotal_precio.toLocaleString('es-AR')}</p>
              <p className="text-sm text-green-600">+{item.margen_porcentaje.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
      {itemsConTramite.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>📋 Expedientes:</strong> Al convertir esta cotización a proyecto se crearán automáticamente{' '}
            <strong>{itemsConTramite.length}</strong> expediente(s) de trámites.
          </p>
        </div>
      )}
    </div>
  );
}
