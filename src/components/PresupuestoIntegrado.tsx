import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, CheckCircle, AlertCircle, Plus, Trash2, Edit2, Link2, Target } from 'lucide-react';
import { DireccionadorPresupuesto } from './Presupuesto/DireccionadorPresupuesto';

interface Props {
  proyectoId: string;
  esCliente?: boolean;
}

interface ItemPresupuesto {
  id: string;
  concepto: string;
  categoria: string;
  monto: number;
  estado: string;
  notas: string | null;
  expediente_id: string | null;
  direccionado: boolean;
  expediente?: {
    codigo: string;
    tramite_tipos: {
      nombre: string;
    };
  };
}

interface ResumenPresupuesto {
  total: number;
  aprobado: number;
  pendiente: number;
  estado_general: string;
}

export function PresupuestoIntegrado({ proyectoId, esCliente = false }: Props) {
  const [items, setItems] = useState<ItemPresupuesto[]>([]);
  const [resumen, setResumen] = useState<ResumenPresupuesto>({
    total: 0,
    aprobado: 0,
    pendiente: 0,
    estado_general: 'borrador'
  });
  const [loading, setLoading] = useState(true);
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [showDireccionador, setShowDireccionador] = useState(false);
  const [presupuestoId, setPresupuestoId] = useState<string | null>(null);
  const [nuevoItem, setNuevoItem] = useState({
    concepto: '',
    categoria: 'gestion',
    monto: 0,
    notas: ''
  });

  useEffect(() => {
    loadPresupuesto();
  }, [proyectoId]);

  const loadPresupuesto = async () => {
    setLoading(true);

    const { data: presupuestoData } = await supabase
      .from('presupuestos')
      .select('id')
      .eq('proyecto_id', proyectoId)
      .maybeSingle();

    if (!presupuestoData) {
      setLoading(false);
      return;
    }

    setPresupuestoId(presupuestoData.id);

    const { data } = await supabase
      .from('presupuesto_items')
      .select(`
        *,
        expedientes:expediente_id (
          codigo,
          tramite_tipos (nombre)
        )
      `)
      .eq('presupuesto_id', presupuestoData.id)
      .order('id');

    if (data) {
      const formattedItems = data.map((item: any) => ({
        id: item.id.toString(),
        concepto: item.concepto,
        categoria: item.tipo || 'otros',
        monto: Number(item.monto),
        estado: 'pendiente',
        notas: null,
        expediente_id: item.expediente_id,
        direccionado: item.direccionado || false,
        expediente: item.expedientes
      }));
      setItems(formattedItems);
      calcularResumen(formattedItems);
    }

    setLoading(false);
  };

  const calcularResumen = (itemsData: ItemPresupuesto[]) => {
    const total = itemsData.reduce((sum, item) => sum + item.monto, 0);
    const aprobado = itemsData
      .filter((item) => item.estado === 'aprobado')
      .reduce((sum, item) => sum + item.monto, 0);
    const pendiente = itemsData
      .filter((item) => item.estado === 'pendiente')
      .reduce((sum, item) => sum + item.monto, 0);

    setResumen({
      total,
      aprobado,
      pendiente,
      estado_general: itemsData.every((i) => i.estado === 'aprobado')
        ? 'aprobado'
        : 'pendiente'
    });
  };

  const handleAgregarItem = async () => {
    if (!nuevoItem.concepto || nuevoItem.monto <= 0) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const { data: presupuestoData } = await supabase
      .from('presupuestos')
      .select('id')
      .eq('proyecto_id', proyectoId)
      .maybeSingle();

    if (!presupuestoData) {
      alert('Primero debe crear un presupuesto para el proyecto');
      return;
    }

    const { error } = await supabase.from('presupuesto_items').insert([
      {
        presupuesto_id: presupuestoData.id,
        concepto: nuevoItem.concepto,
        tipo: nuevoItem.categoria,
        monto: nuevoItem.monto
      }
    ]);

    if (error) {
      alert('Error al agregar ítem: ' + error.message);
      return;
    }

    setNuevoItem({ concepto: '', categoria: 'gestion', monto: 0, notas: '' });
    setMostrarFormNuevo(false);
    loadPresupuesto();
  };

  const handleEliminarItem = async (itemId: string) => {
    if (!confirm('¿Está seguro de eliminar este ítem?')) return;

    const { error } = await supabase.from('presupuesto_items').delete().eq('id', Number(itemId));

    if (error) {
      alert('Error al eliminar ítem: ' + error.message);
      return;
    }

    loadPresupuesto();
  };

  const handleAprobarPresupuesto = async () => {
    if (!confirm('¿Está seguro de aprobar este presupuesto?')) return;

    const { data: presupuestoData } = await supabase
      .from('presupuestos')
      .select('id')
      .eq('proyecto_id', proyectoId)
      .maybeSingle();

    if (!presupuestoData) {
      alert('Error: No se encontró el presupuesto');
      return;
    }

    const { error } = await supabase
      .from('presupuestos')
      .update({ estado: 'aprobado' })
      .eq('id', presupuestoData.id);

    if (error) {
      alert('Error al aprobar presupuesto: ' + error.message);
      return;
    }

    const { error: proyectoError } = await supabase
      .from('proyectos')
      .update({ estado: 'presupuesto_aprobado' })
      .eq('id', proyectoId);

    if (proyectoError) {
      alert('Error al actualizar estado del proyecto: ' + proyectoError.message);
      return;
    }

    alert('Presupuesto aprobado exitosamente');
    loadPresupuesto();
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(monto);
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      gestion: 'Gestión Administrativa',
      tasas: 'Tasas y Aranceles',
      analisis: 'Análisis y Certificaciones',
      honorarios: 'Honorarios Profesionales',
      otros: 'Otros Gastos'
    };
    return labels[categoria] || categoria;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!esCliente && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-800 mb-1">Presupuesto Integrado</h3>
              <p className="text-sm text-blue-700">
                Gestión de costos y presupuesto del proyecto
              </p>
            </div>
            <button
              onClick={() => setShowDireccionador(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Target className="w-4 h-4" />
              Direccionar Items
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">Resumen Financiero</h3>
            <p className="text-sm text-slate-600 mt-1">
              Estado:{' '}
              <span
                className={`font-medium ${
                  resumen.estado_general === 'aprobado' ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {resumen.estado_general === 'aprobado' ? 'Aprobado' : 'Pendiente de Aprobación'}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Total del Presupuesto</p>
            <p className="text-3xl font-bold text-blue-600">{formatearMonto(resumen.total)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Total</p>
            <p className="text-xl font-bold text-slate-800">{formatearMonto(resumen.total)}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700 mb-1">Aprobado</p>
            <p className="text-xl font-bold text-green-800">{formatearMonto(resumen.aprobado)}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-700 mb-1">Pendiente</p>
            <p className="text-xl font-bold text-yellow-800">{formatearMonto(resumen.pendiente)}</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No hay ítems de presupuesto registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.estado === 'aprobado' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="font-medium text-slate-900">{item.concepto}</span>
                    {item.direccionado && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                        Direccionado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 ml-7">
                    <span className="capitalize">{getCategoriaLabel(item.categoria)}</span>
                    {item.expediente && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Link2 className="w-3 h-3" />
                        <span>{item.expediente.codigo} - {item.expediente.tramite_tipos.nombre}</span>
                      </div>
                    )}
                    {item.notas && <span className="text-slate-500">• {item.notas}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-blue-600">
                    {formatearMonto(item.monto)}
                  </span>
                  {!esCliente && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert('Funcionalidad de edición por implementar')}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600" />
                      </button>
                      <button
                        onClick={() => handleEliminarItem(item.id)}
                        className="p-2 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!esCliente && !mostrarFormNuevo && (
          <button
            onClick={() => setMostrarFormNuevo(true)}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Agregar Ítem
          </button>
        )}

        {!esCliente && mostrarFormNuevo && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-slate-800 mb-4">Nuevo Ítem de Presupuesto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Concepto</label>
                <input
                  type="text"
                  value={nuevoItem.concepto}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, concepto: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Tasa ANMAT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
                <select
                  value={nuevoItem.categoria}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gestion">Gestión Administrativa</option>
                  <option value="tasas">Tasas y Aranceles</option>
                  <option value="analisis">Análisis y Certificaciones</option>
                  <option value="honorarios">Honorarios Profesionales</option>
                  <option value="otros">Otros Gastos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Monto</label>
                <input
                  type="number"
                  value={nuevoItem.monto}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, monto: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notas</label>
                <input
                  type="text"
                  value={nuevoItem.notas}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, notas: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAgregarItem}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Agregar
              </button>
              <button
                onClick={() => {
                  setMostrarFormNuevo(false);
                  setNuevoItem({ concepto: '', categoria: 'gestion', monto: 0, notas: '' });
                }}
                className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {esCliente && resumen.estado_general !== 'aprobado' && items.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={handleAprobarPresupuesto}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
            >
              <CheckCircle className="inline w-5 h-5 mr-2" />
              Aprobar Presupuesto
            </button>
            <p className="text-sm text-slate-600 text-center mt-3">
              Al aprobar el presupuesto, el equipo será notificado para continuar con el proyecto
            </p>
          </div>
        )}
      </div>

      {showDireccionador && presupuestoId && (
        <DireccionadorPresupuesto
          presupuestoId={presupuestoId}
          onClose={() => setShowDireccionador(false)}
          onSuccess={() => {
            setShowDireccionador(false);
            loadPresupuesto();
          }}
        />
      )}
    </div>
  );
}
