import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  CheckCircle, AlertCircle, Loader2, ChevronRight, ChevronLeft,
  User, Package, Globe, Target, ShieldCheck, ShieldOff, Save
} from 'lucide-react';

interface Cliente {
  id: string;
  razon_social: string;
  cuit: string;
}

interface Producto {
  id: string;
  nombre: string;
  pais_origen: string;
}

interface Props {
  onComplete: (proyectoId: string) => void;
  onCancel: () => void;
}

const RUBROS = [
  { id: 'Alimentos', nombre: 'Alimentos y Bebidas' },
  { id: 'Envases', nombre: 'Envases (Contacto con Alimentos)' },
  { id: 'Productos Animales', nombre: 'Productos de Origen Animal' },
  { id: 'Cosméticos', nombre: 'Cosméticos y Domisanitarios' },
  { id: 'Productos Médicos', nombre: 'Productos Médicos' },
  { id: 'Productos Veterinarios', nombre: 'Productos Veterinarios' },
  { id: 'Fauna y Flora', nombre: 'Fauna y Flora (CITES)' },
  { id: 'Precursores Químicos', nombre: 'Precursores Químicos (RENPRE)' },
  { id: 'Materiales Controlados', nombre: 'Materiales Controlados (ANMaC)' },
  { id: 'Telecomunicaciones', nombre: 'Telecomunicaciones (ENACOM)' },
  { id: 'Seguridad de Productos', nombre: 'Seguridad Eléctrica / Productos' },
  { id: 'Metrología Legal', nombre: 'Metrología Legal (DNM/INTI)' },
  { id: 'Servicios', nombre: 'Servicios (AML, Marcas, etc.)' }
];

const DESTINOS = [
  { value: 'consumo_final', label: 'Venta al Público / Consumo Final' },
  { value: 'uso_profesional', label: 'Uso Profesional Idóneo (Excepción RT)' },
  { value: 'insumo_industrial', label: 'Insumo para Industria (Excepción RT)' },
  { value: 'aml', label: 'Adaptación a Mercado Local (AML)' }
];

const PAISES_ANEXO_III = [
  'España', 'Italia', 'Alemania', 'Francia', 'Bélgica', 'Holanda', 'Portugal',
  'Chile', 'Brasil', 'Uruguay', 'Canadá', 'Japón', 'Suiza', 'Reino Unido'
];

export default function ProyectoWizard({ onComplete, onCancel }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [nombreProyecto, setNombreProyecto] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [productoId, setProductoId] = useState('');
  const [rubrosSeleccionados, setRubrosSeleccionados] = useState<string[]>([]);
  const [destino, setDestino] = useState('consumo_final');

  const [newClienteRS, setNewClienteRS] = useState('');
  const [newClienteCuit, setNewClienteCuit] = useState('');
  const [newClienteEmail, setNewClienteEmail] = useState('');

  const [newProductoNombre, setNewProductoNombre] = useState('');
  const [newProductoMarca, setNewProductoMarca] = useState('');
  const [newProductoPais, setNewProductoPais] = useState('');

  const loadClientes = async () => {
    const { data } = await supabase.from('clientes').select('*').order('razon_social');
    if (data) setClientes(data);
  };

  const loadProductos = async (clienteId: string) => {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('nombre');
    if (data) setProductos(data);
  };

  const handleCreateCliente = async () => {
    if (!newClienteRS || !newClienteCuit) {
      setError('Razón social y CUIT son obligatorios');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('clientes')
      .insert({ razon_social: newClienteRS, cuit: newClienteCuit, email: newClienteEmail })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data) {
      setClienteId(data.id);
      await loadClientes();
      setNewClienteRS('');
      setNewClienteCuit('');
      setNewClienteEmail('');
    }
    setLoading(false);
  };

  const handleCreateProducto = async () => {
    if (!newProductoNombre || !clienteId) {
      setError('Nombre de producto y cliente son obligatorios');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('productos')
      .insert({
        cliente_id: clienteId,
        nombre: newProductoNombre,
        marca: newProductoMarca,
        pais_origen: newProductoPais
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data) {
      setProductoId(data.id);
      await loadProductos(clienteId);
      setNewProductoNombre('');
      setNewProductoMarca('');
      setNewProductoPais('');
    }
    setLoading(false);
  };

  const toggleRubro = (rubroId: string) => {
    if (rubrosSeleccionados.includes(rubroId)) {
      setRubrosSeleccionados(rubrosSeleccionados.filter(r => r !== rubroId));
    } else {
      setRubrosSeleccionados([...rubrosSeleccionados, rubroId]);
    }
  };

  const nextStep = () => {
    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const steps = [
    { num: 1, label: 'Cliente/Producto', icon: User },
    { num: 2, label: 'Rubros', icon: Package },
    { num: 3, label: 'Origen', icon: Globe },
    { num: 4, label: 'Destino', icon: Target },
    { num: 5, label: 'Confirmar', icon: CheckCircle }
  ];

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800">Paso 1: Cliente y Producto</h2>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Proyecto</label>
        <input
          type="text"
          value={nombreProyecto}
          onChange={(e) => setNombreProyecto(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ej: Importación Lata de Atún 'Marca X' Lote 123"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Seleccionar Cliente</label>
        <button
          onClick={loadClientes}
          className="mb-2 text-sm text-blue-600 hover:text-blue-700"
        >
          Cargar clientes
        </button>
        <select
          value={clienteId}
          onChange={(e) => {
            setClienteId(e.target.value);
            setProductoId('');
            if (e.target.value) loadProductos(e.target.value);
          }}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Seleccione un cliente --</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.razon_social} ({c.cuit})
            </option>
          ))}
        </select>
      </div>

      <div className="p-4 bg-slate-50 rounded-lg">
        <h3 className="font-medium text-slate-700 mb-3">Crear Nuevo Cliente</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={newClienteRS}
            onChange={(e) => setNewClienteRS(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded"
            placeholder="Razón Social"
          />
          <input
            type="text"
            value={newClienteCuit}
            onChange={(e) => setNewClienteCuit(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded"
            placeholder="CUIT"
          />
          <input
            type="email"
            value={newClienteEmail}
            onChange={(e) => setNewClienteEmail(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded"
            placeholder="Email"
          />
          <button
            onClick={handleCreateCliente}
            disabled={loading}
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 disabled:opacity-50"
          >
            Crear Cliente
          </button>
        </div>
      </div>

      {clienteId && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Seleccionar Producto</label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Seleccione un producto --</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.pais_origen})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-medium text-slate-700 mb-3">Crear Nuevo Producto</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newProductoNombre}
                onChange={(e) => setNewProductoNombre(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded"
                placeholder="Nombre del Producto"
              />
              <input
                type="text"
                value={newProductoMarca}
                onChange={(e) => setNewProductoMarca(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded"
                placeholder="Marca"
              />
              <input
                type="text"
                value={newProductoPais}
                onChange={(e) => setNewProductoPais(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded"
                placeholder="País de Origen"
              />
              <button
                onClick={handleCreateProducto}
                disabled={loading}
                className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 disabled:opacity-50"
              >
                Crear Producto
              </button>
            </div>
          </div>
        </>
      )}

      <button
        onClick={nextStep}
        disabled={!nombreProyecto || !clienteId || !productoId}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        Siguiente <ChevronRight className="w-5 h-5 ml-2" />
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800">Paso 2: Rubros Involucrados</h2>
      <p className="text-slate-600">Selecciona todos los rubros que aplican a este proyecto</p>

      <div className="grid grid-cols-2 gap-3">
        {RUBROS.map((rubro) => (
          <label
            key={rubro.id}
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
              rubrosSeleccionados.includes(rubro.id)
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300'
                : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={rubrosSeleccionados.includes(rubro.id)}
              onChange={() => toggleRubro(rubro.id)}
              className="mr-3 w-4 h-4"
            />
            <span className="text-sm font-medium">{rubro.nombre}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={prevStep}
          className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Volver
        </button>
        <button
          onClick={nextStep}
          disabled={rubrosSeleccionados.length === 0}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          Siguiente <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const selectedProducto = productos.find(p => p.id === productoId);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-slate-800">Paso 3: Verificar País de Origen</h2>
        <p className="text-slate-600">
          El país de origen es clave para determinar si aplican equivalencias sanitarias (Decreto 35/2025)
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-700 mb-2">País de Origen Actual</h3>
          <p className="text-2xl font-bold text-blue-600">{selectedProducto?.pais_origen || 'No especificado'}</p>

          {selectedProducto?.pais_origen && PAISES_ANEXO_III.includes(selectedProducto.pais_origen) && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-800">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Este país está en el Anexo III (Decreto 35/2025). Se aplicará equivalencia sanitaria.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={prevStep}
            className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 mr-2" /> Volver
          </button>
          <button
            onClick={nextStep}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
          >
            Siguiente <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800">Paso 4: Destino del Producto</h2>
      <p className="text-slate-600">
        El destino determina si aplican excepciones de certificación (Uso Profesional, Insumo Industrial)
      </p>

      <div className="space-y-3">
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

      <div className="flex gap-3">
        <button
          onClick={prevStep}
          className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Volver
        </button>
        <button
          onClick={nextStep}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
        >
          Siguiente <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => {
    const selectedProducto = productos.find(p => p.id === productoId);

    return (
      <Step5Confirmacion
        clienteId={clienteId}
        productoId={productoId}
        nombreProyecto={nombreProyecto}
        rubrosSeleccionados={rubrosSeleccionados}
        destino={destino}
        paisOrigen={selectedProducto?.pais_origen || ''}
        onBack={prevStep}
        onComplete={onComplete}
      />
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Asistente de Relevamiento</h1>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:text-slate-800"
          >
            Cancelar
          </button>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center w-full max-w-3xl">
            {steps.map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      currentStep >= step.num
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {currentStep > step.num ? <CheckCircle size={20} /> : step.num}
                  </div>
                  <span className="text-xs text-slate-600 mt-1 text-center">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 transition-colors ${
                      currentStep > step.num ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>
    </div>
  );
}

interface Step5Props {
  clienteId: string;
  productoId: string;
  nombreProyecto: string;
  rubrosSeleccionados: string[];
  destino: string;
  paisOrigen: string;
  onBack: () => void;
  onComplete: (proyectoId: string) => void;
}

function Step5Confirmacion({
  clienteId,
  productoId,
  nombreProyecto,
  rubrosSeleccionados,
  destino,
  paisOrigen,
  onBack,
  onComplete
}: Step5Props) {
  const [loading, setLoading] = useState(false);
  const [blockerCheck, setBlockerCheck] = useState<{ faltantes: string[]; listos: boolean }>({
    faltantes: [],
    listos: false
  });
  const [expedientesSugeridos, setExpedientesSugeridos] = useState<Array<{
    id: string;
    nombre: string;
  }>>([]);
  const [checkingBlockers, setCheckingBlockers] = useState(true);

  useEffect(() => {
    checkHabilitacionesPrevias();
  }, [clienteId, rubrosSeleccionados]);

  const checkHabilitacionesPrevias = async () => {
    setCheckingBlockers(true);
    const blockersNeeded: { [key: string]: string } = {};

    if (rubrosSeleccionados.includes('Alimentos') || rubrosSeleccionados.includes('Envases')) {
      blockersNeeded['TT-INAL-001'] = 'Habilitación RNE (Registro Nacional de Establecimiento - INAL)';
    }
    if (rubrosSeleccionados.includes('Cosméticos')) {
      blockersNeeded['TT-COSM-002'] = 'Habilitación de Establecimiento ANMAT (Legajo Cosmético)';
    }
    if (rubrosSeleccionados.includes('Productos Médicos')) {
      blockersNeeded['TT-PM-005'] = 'Habilitación Empresa Productos Médicos (Legajo ANMAT)';
    }
    if (rubrosSeleccionados.includes('Productos Animales')) {
      blockersNeeded['TT-SENASA-003'] = 'Habilitación REES - Establecimiento Origen Animal (SENASA)';
    }
    if (rubrosSeleccionados.includes('Precursores Químicos')) {
      blockersNeeded['TT-RENPRE-001'] = 'Inscripción RENPRE (SEDRONAR)';
    }
    if (rubrosSeleccionados.includes('Materiales Controlados')) {
      blockersNeeded['TT-ANMAC-001'] = 'LUC Comercial (Legítimo Usuario Comercial - ANMaC)';
    }

    const tramiteIds = Object.keys(blockersNeeded);
    let faltantes: string[] = [];

    if (tramiteIds.length > 0) {
      const { data: expedientesExistentes } = await supabase
        .from('expedientes')
        .select('tramite_tipo_id, estado, proyectos!inner(cliente_id)')
        .eq('proyectos.cliente_id', clienteId)
        .in('tramite_tipo_id', tramiteIds);

      for (const tramiteId of tramiteIds) {
        const expediente = expedientesExistentes?.find(
          (e: any) => e.tramite_tipo_id === tramiteId && e.estado === 'aprobado'
        );

        if (!expediente) {
          faltantes.push(`${blockersNeeded[tramiteId]} [${tramiteId}]`);
        }
      }
    }

    setBlockerCheck({ faltantes, listos: faltantes.length === 0 });

    if (faltantes.length === 0) {
      calcularExpedientes();
    } else {
      setExpedientesSugeridos([]);
    }

    setCheckingBlockers(false);
  };

  const calcularExpedientes = async () => {
    const { data: tramiteTipos } = await supabase
      .from('tramite_tipos')
      .select('id, codigo, nombre, rubro');

    if (!tramiteTipos) return;

    const expedientes: Array<{ id: string; nombre: string }> = [];
    const isAnexoIII = PAISES_ANEXO_III.includes(paisOrigen);

    if (rubrosSeleccionados.includes('Alimentos')) {
      if (isAnexoIII) {
        const equiv = tramiteTipos.find(t => t.id === 'TT-INAL-003');
        if (equiv) expedientes.push({ id: equiv.id, nombre: equiv.nombre });
      } else {
        const rnpa = tramiteTipos.find(t => t.id === 'TT-INAL-002');
        if (rnpa) expedientes.push({ id: rnpa.id, nombre: rnpa.nombre });
      }
    }

    if (rubrosSeleccionados.includes('Envases')) {
      const envases = tramiteTipos.find(t => t.id === 'TT-INAL-005');
      if (envases) expedientes.push({ id: envases.id, nombre: envases.nombre });
    }

    if (rubrosSeleccionados.includes('Productos Animales')) {
      const animal = tramiteTipos.find(t => t.id === 'TT-SENASA-004');
      if (animal) expedientes.push({ id: animal.id, nombre: animal.nombre });
    }

    if (rubrosSeleccionados.includes('Seguridad de Productos')) {
      if (destino === 'uso_profesional' || destino === 'insumo_industrial') {
        const ddjj = tramiteTipos.find(t => t.id === 'TT-SIC-004');
        if (ddjj) expedientes.push({ id: ddjj.id, nombre: ddjj.nombre });
      } else {
        const segElec = tramiteTipos.find(t => t.id === 'TT-SIC-001');
        if (segElec) expedientes.push({ id: segElec.id, nombre: segElec.nombre });
      }
    }

    if (destino === 'aml') {
      const aml = tramiteTipos.find(t => t.id === 'TT-SIC-005');
      if (aml) expedientes.push({ id: aml.id, nombre: aml.nombre });
    }

    if (rubrosSeleccionados.includes('Cosméticos')) {
      const cosmetico = tramiteTipos.find(t => t.id === 'TT-COSM-001');
      if (cosmetico) expedientes.push({ id: cosmetico.id, nombre: cosmetico.nombre });
    }

    if (rubrosSeleccionados.includes('Productos Médicos')) {
      const pm = tramiteTipos.find(t => t.id === 'TT-PM-001');
      if (pm) expedientes.push({ id: pm.id, nombre: pm.nombre });
    }

    if (rubrosSeleccionados.includes('Telecomunicaciones')) {
      const enacom = tramiteTipos.find(t => t.id === 'TT-ENACOM-001');
      if (enacom) expedientes.push({ id: enacom.id, nombre: enacom.nombre });
    }

    if (rubrosSeleccionados.includes('Fauna y Flora')) {
      const cites = tramiteTipos.find(t => t.id === 'TT-FAUNA-001');
      if (cites) expedientes.push({ id: cites.id, nombre: cites.nombre });
    }

    if (rubrosSeleccionados.includes('Metrología Legal')) {
      const dnm = tramiteTipos.find(t => t.id === 'TT-DNM-001');
      if (dnm) expedientes.push({ id: dnm.id, nombre: dnm.nombre });
    }

    setExpedientesSugeridos(expedientes);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: proyecto, error: proyectoError } = await supabase
        .from('proyectos')
        .insert({
          nombre_proyecto: nombreProyecto,
          cliente_id: clienteId,
          producto_id: productoId,
          estado: 'relevamiento'
        })
        .select()
        .single();

      if (proyectoError) throw proyectoError;

      const expedientesACrear = expedientesSugeridos.map((exp, index) => ({
        codigo: `EXP-${Date.now()}-${index}`,
        proyecto_id: proyecto.id,
        tramite_tipo_id: exp.id,
        estado: 'iniciado',
        fecha_limite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        semaforo: 'verde'
      }));

      if (expedientesACrear.length > 0) {
        const { error: expError } = await supabase
          .from('expedientes')
          .insert(expedientesACrear);

        if (expError) throw expError;
      }

      const { error: presupuestoError } = await supabase
        .from('presupuestos')
        .insert({
          proyecto_id: proyecto.id,
          estado: 'borrador',
          total_final: 0
        });

      if (presupuestoError) throw presupuestoError;

      onComplete(proyecto.id);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (checkingBlockers) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Verificando habilitaciones previas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800">Paso 5: Confirmación y Relevamiento</h2>

      {!blockerCheck.listos && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-6 mb-6">
          <div className="flex">
            <AlertCircle className="w-6 h-6 text-amber-700 mr-3 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-2">Advertencia: Faltan Habilitaciones Previas</h3>
              <p className="text-amber-700 mb-3">
                Este cliente carece de las siguientes habilitaciones. Puede crear el proyecto, pero deberá completar estos requisitos antes de avanzar con los trámites:
              </p>
              <ul className="list-disc list-inside text-amber-700 space-y-1 mb-4">
                {blockerCheck.faltantes.map((b) => (
                  <li key={b} className="font-medium">{b}</li>
                ))}
              </ul>
              <p className="text-amber-700 text-sm">
                Se recomienda gestionar estas habilitaciones lo antes posible para evitar demoras en el proceso.
              </p>
            </div>
          </div>
        </div>
      )}

      {blockerCheck.listos && (
        <>
          <div className="bg-green-50 border border-green-300 rounded-lg p-6">
            <div className="flex">
              <ShieldCheck className="w-6 h-6 text-green-700 mr-3 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-1">Habilitaciones Previas Verificadas</h3>
                <p className="text-green-700">
                  El cliente posee todas las habilitaciones necesarias para los rubros seleccionados.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Expedientes a Generar:</h3>
            {expedientesSugeridos.length > 0 ? (
              <ul className="space-y-2">
                {expedientesSugeridos.map((exp, index) => (
                  <li key={exp.id} className="flex items-start">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mr-3 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800">{exp.nombre}</p>
                      <p className="text-xs text-slate-500">ID: {exp.id}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">No se generarán expedientes automáticamente</p>
            )}
          </div>
        </>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 mr-2" /> Volver
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || expedientesSugeridos.length === 0}
          className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Confirmar y Crear Proyecto ({expedientesSugeridos.length} expedientes)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
