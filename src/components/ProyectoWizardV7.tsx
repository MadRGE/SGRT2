import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  ChevronRight,
  ChevronLeft,
  Save,
  AlertTriangle,
  CheckCircle,
  Plus,
  X,
  Package,
  User,
  Target,
  FileText,
  Loader2
} from 'lucide-react';
import { ProductoFormModal } from './Productos/ProductoFormModal';
import { ProyectoService } from '../services/ProyectoService';

interface Props {
  onComplete: (proyectoId: string) => void;
  onCancel: () => void;
}

interface Cliente {
  id: string;
  razon_social: string;
  cuit: string;
  email: string | null;
  telefono: string | null;
}

interface Producto {
  id: string;
  nombre: string;
  marca: string | null;
  rubro: string;
  pais_origen: string;
}

interface TramiteTipo {
  id: string;
  nombre: string;
  rubro: string;
  es_habilitacion_previa: boolean;
  permite_familia_productos: boolean;
  costo_honorarios_base?: number;
  costo_tasas_base?: number;
}

const DESTINOS = [
  { value: 'consumo_final', label: 'Venta al Público / Consumo Final' },
  { value: 'uso_profesional', label: 'Uso Profesional Idóneo (Excepción RT)' },
  { value: 'insumo_industrial', label: 'Insumo para Industria (Excepción RT)' },
  { value: 'aml', label: 'Adaptación a Mercado Local (AML)' }
];

const PAISES_ANEXO_III = [
  'España',
  'Italia',
  'Alemania',
  'Francia',
  'Bélgica',
  'Holanda',
  'Portugal',
  'Chile',
  'Brasil',
  'Uruguay',
  'Canadá',
  'Japón',
  'Suiza',
  'Reino Unido'
];

export default function ProyectoWizardV7({ onComplete, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tramiteTipos, setTramiteTipos] = useState<TramiteTipo[]>([]);

  const [nombreProyecto, setNombreProyecto] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [destino, setDestino] = useState('consumo_final');

  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isProductoModalOpen, setIsProductoModalOpen] = useState(false);
  const [checkingBlockers, setCheckingBlockers] = useState(false);

  useEffect(() => {
    loadClientes();
    loadTramiteTipos();
  }, []);

  const loadClientes = async () => {
    const { data } = await supabase.from('clientes').select('*').order('razon_social');
    if (data) setClientes(data);
  };

  const loadTramiteTipos = async () => {
    const { data } = await supabase.from('tramite_tipos').select('*');
    if (data) setTramiteTipos(data);
  };

  const handleCreateCliente = async (nuevoCliente: Cliente) => {
    await loadClientes();
    setClienteSeleccionado(nuevoCliente);
  };

  const handleAgregarProducto = (nuevoProducto: Producto) => {
    setProductos((prev) => [...prev, nuevoProducto]);
  };

  const handleRemoverProducto = (productoId: string) => {
    setProductos((prev) => prev.filter((p) => p.id !== productoId));
  };

  const { blockers, sugerencias } = useMemo(() => {
    if (!clienteSeleccionado || productos.length === 0) {
      return { blockers: [], sugerencias: [] };
    }

    const rubrosDelProyecto = Array.from(new Set(productos.map((p) => p.rubro)));
    const paisesDelProyecto = Array.from(new Set(productos.map((p) => p.pais_origen)));

    const blockerMap: { [key: string]: string } = {
      'Alimentos': 'TT-INAL-001',
      'Envases': 'TT-INAL-001',
      'Productos Animales': 'TT-SENASA-003',
      'Cosméticos': 'TT-COSM-002',
      'Productos Médicos': 'TT-PM-005',
      'Precursores Químicos': 'TT-RENPRE-001',
      'Materiales Controlados': 'TT-ANMAC-001'
    };

    const blockerIds = Array.from(
      new Set(rubrosDelProyecto.map((r) => blockerMap[r]).filter(Boolean))
    );

    const blockersFaltantes = tramiteTipos.filter(
      (t) => blockerIds.includes(t.id) && t.es_habilitacion_previa
    );

    const expedientesSugeridos: TramiteTipo[] = [];

    if (rubrosDelProyecto.includes('Alimentos')) {
      const hayAnexoIII = paisesDelProyecto.some((p) => PAISES_ANEXO_III.includes(p));
      if (hayAnexoIII) {
        const equiv = tramiteTipos.find((t) => t.id === 'TT-INAL-003');
        if (equiv) expedientesSugeridos.push(equiv);
      } else {
        const rnpa = tramiteTipos.find((t) => t.id === 'TT-INAL-002');
        if (rnpa) expedientesSugeridos.push(rnpa);
      }
    }

    if (rubrosDelProyecto.includes('Envases')) {
      const envases = tramiteTipos.find((t) => t.id === 'TT-INAL-005');
      if (envases) expedientesSugeridos.push(envases);
    }

    if (rubrosDelProyecto.includes('Productos Animales')) {
      const animal = tramiteTipos.find((t) => t.id === 'TT-SENASA-004');
      if (animal) expedientesSugeridos.push(animal);
    }

    if (rubrosDelProyecto.includes('Seguridad de Productos')) {
      if (destino === 'uso_profesional' || destino === 'insumo_industrial') {
        const ddjj = tramiteTipos.find((t) => t.id === 'TT-SIC-004');
        if (ddjj) expedientesSugeridos.push(ddjj);
      } else {
        const segElec = tramiteTipos.find((t) => t.id === 'TT-SIC-001');
        if (segElec) expedientesSugeridos.push(segElec);
      }
    }

    if (destino === 'aml') {
      const aml = tramiteTipos.find((t) => t.id === 'TT-SIC-005');
      if (aml) expedientesSugeridos.push(aml);
    }

    if (rubrosDelProyecto.includes('Cosméticos')) {
      const cosmetico = tramiteTipos.find((t) => t.id === 'TT-COSM-001');
      if (cosmetico) expedientesSugeridos.push(cosmetico);
    }

    if (rubrosDelProyecto.includes('Productos Médicos')) {
      const pm = tramiteTipos.find((t) => t.id === 'TT-PM-001');
      if (pm) expedientesSugeridos.push(pm);
    }

    if (rubrosDelProyecto.includes('Telecomunicaciones')) {
      const enacom = tramiteTipos.find((t) => t.id === 'TT-ENACOM-001');
      if (enacom) expedientesSugeridos.push(enacom);
    }

    if (rubrosDelProyecto.includes('Fauna y Flora')) {
      const cites = tramiteTipos.find((t) => t.id === 'TT-FAUNA-001');
      if (cites) expedientesSugeridos.push(cites);
    }

    if (rubrosDelProyecto.includes('Metrología Legal')) {
      const dnm = tramiteTipos.find((t) => t.id === 'TT-DNM-001');
      if (dnm) expedientesSugeridos.push(dnm);
    }

    if (rubrosDelProyecto.includes('Materiales Controlados')) {
      const anmac = tramiteTipos.find((t) => t.id === 'TT-ANMAC-002');
      if (anmac) expedientesSugeridos.push(anmac);
    }

    if (rubrosDelProyecto.includes('Precursores Químicos')) {
      const renpre = tramiteTipos.find((t) => t.id === 'TT-RENPRE-002');
      if (renpre) expedientesSugeridos.push(renpre);
    }

    return { blockers: blockersFaltantes, sugerencias: expedientesSugeridos };
  }, [clienteSeleccionado, productos, destino, tramiteTipos]);

  const handleSubmit = async () => {
    if (!nombreProyecto || !clienteSeleccionado || productos.length === 0) {
      setError('Debe completar todos los campos obligatorios');
      return;
    }

    setLoading(true);
    setError(null);

    const expedientesACrear = [
      ...blockers.map((b) => ({
        tramite_tipo_id: b.id,
        permite_familia: b.permite_familia_productos || false,
        costo_honorarios_base: b.costo_honorarios_base || 0,
        costo_tasas_base: b.costo_tasas_base || 0,
        nombre: b.nombre
      })),
      ...sugerencias.map((s) => ({
        tramite_tipo_id: s.id,
        permite_familia: s.permite_familia_productos || false,
        costo_honorarios_base: s.costo_honorarios_base || 0,
        costo_tasas_base: s.costo_tasas_base || 0,
        nombre: s.nombre
      }))
    ];

    const resultado = await ProyectoService.crearProyectoConFamilia({
      nombre_proyecto: nombreProyecto,
      cliente_id: clienteSeleccionado.id,
      productos_ids: productos.map((p) => p.id),
      destino,
      expedientes_sugeridos: expedientesACrear
    });

    if (resultado.success) {
      onComplete(resultado.proyecto_id!);
    } else {
      setError(resultado.error || 'Error al crear el proyecto');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Asistente de Proyecto v7</h1>
              <p className="text-blue-100 mt-1">Familia de Productos - Arquitectura N-a-N</p>
            </div>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-white hover:bg-white hover:text-blue-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-800">Cliente y Proyecto</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  value={nombreProyecto}
                  onChange={(e) => setNombreProyecto(e.target.value)}
                  placeholder="Ej: Importación Taladros 2025"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cliente *
                  </label>
                  <select
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={clienteSeleccionado?.id || ''}
                    onChange={(e) => {
                      const cliente = clientes.find((c) => c.id === e.target.value);
                      setClienteSeleccionado(cliente || null);
                    }}
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.razon_social}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setIsClienteModalOpen(true)}
                    className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Crear nuevo cliente"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {clienteSeleccionado && (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-slate-800">
                    Productos del Proyecto (Familia)
                  </h2>
                </div>
                <button
                  onClick={() => setIsProductoModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Producto
                </button>
              </div>

              {productos.length > 0 ? (
                <div className="space-y-2">
                  {productos.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{p.nombre}</p>
                        <p className="text-sm text-slate-600">
                          {p.marca && `${p.marca} | `}
                          <span className="text-blue-600">{p.rubro}</span> | Origen:{' '}
                          {p.pais_origen}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoverProducto(p.id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No hay productos agregados</p>
                </div>
              )}
            </div>
          )}

          {productos.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-800">Destino del Producto</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DESTINOS.map((d) => (
                  <label
                    key={d.value}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                      destino === d.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                        : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destino"
                      value={d.value}
                      checked={destino === d.value}
                      onChange={(e) => setDestino(e.target.value)}
                      className="mr-3 w-4 h-4"
                    />
                    <span className="text-sm font-medium">{d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {productos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-800">Relevamiento de Trámites</h2>
              </div>

              {blockers.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-6">
                  <div className="flex">
                    <AlertTriangle className="w-6 h-6 text-amber-700 mr-3 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-800 mb-2">
                        Advertencia: Faltan Habilitaciones Previas (Blockers)
                      </h3>
                      <p className="text-amber-700 mb-3">
                        El cliente carece de las siguientes habilitaciones. Se crearán expedientes
                        para gestionarlas:
                      </p>
                      <ul className="list-disc list-inside text-amber-700 space-y-1">
                        {blockers.map((b) => (
                          <li key={b.id} className="font-medium">
                            {b.nombre} [{b.id}]
                          </li>
                        ))}
                      </ul>
                      <p className="text-amber-700 text-sm mt-3">
                        Nota: Puede crear el proyecto. Los expedientes de blocker se marcarán
                        automáticamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-green-50 border border-green-300 rounded-lg p-6">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Expedientes de Producto a Crear
                </h3>
                {sugerencias.length > 0 ? (
                  <ul className="space-y-2">
                    {sugerencias.map((s) => (
                      <li
                        key={s.id}
                        className="flex justify-between items-center text-green-700"
                      >
                        <span className="font-medium">{s.nombre}</span>
                        {s.permite_familia_productos && (
                          <span className="text-xs bg-green-200 px-2 py-1 rounded-md">
                            Cubre Familia ({productos.length} productos)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-700">
                    No se generarán expedientes automáticamente basados en la selección.
                  </p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || productos.length === 0}
                className="w-full py-3.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creando Proyecto...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Confirmar y Crear Proyecto ({blockers.length + sugerencias.length}{' '}
                    expedientes)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {isProductoModalOpen && clienteSeleccionado && (
        <ProductoFormModal
          isOpen={isProductoModalOpen}
          onClose={() => setIsProductoModalOpen(false)}
          onSuccess={handleAgregarProducto}
          clienteId={clienteSeleccionado.id}
        />
      )}
    </div>
  );
}
