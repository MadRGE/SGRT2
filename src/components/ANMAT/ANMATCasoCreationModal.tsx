import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  X,
  FileText,
  Search,
  Building2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronRight,
  UserPlus
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: (casoId: string) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
  cuit: string;
  email: string | null;
  telefono: string | null;
}

interface Division {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export function ANMATCasoCreationModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [divisiones, setDivisiones] = useState<Division[]>([]);
  const [loadingDivisiones, setLoadingDivisiones] = useState(true);
  const [searchCliente, setSearchCliente] = useState('');
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Crear cliente nuevo inline
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ razon_social: '', cuit: '', email: '', telefono: '' });
  const [creandoCliente, setCreandoCliente] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    cliente_id: '',
    cliente_nombre: '',
    division_id: '',
    division_codigo: '',
    division_nombre: '',
    referencia_cliente: '',
    descripcion_cliente: '',
    fuente_contacto: 'EMAIL',
    es_urgente: false,
    fecha_ingreso_puerto: '',
    cantidad_skus_estimada: '',
    // Campos específicos por división - ENVASES
    tipo_envase: '',
    material_envase: '',
    capacidad_envase: '',
    // ALIMENTOS
    tipo_producto: '',
    tiene_rnpa: false,
    numero_rnpa: '',
    // MEDICAMENTOS
    tipo_medicamento: '',
    requiere_receta: false,
    principio_activo: '',
    laboratorio_origen: '',
    // PROD_MEDICOS
    clase_riesgo: '',
    uso_previsto: '',
    tiene_certificado_origen: false,
    // COSMETICOS
    tipo_cosmetico: '',
    tiene_notificacion: false,
    // USO_DOMESTICO
    tipo_domisanitario: '',
    // SUPLEMENTOS
    tipo_suplemento: '',
    ingrediente_principal: ''
  });

  useEffect(() => {
    loadClientes();
    loadDivisiones();
  }, []);

  useEffect(() => {
    if (!showDropdown) {
      setFilteredClientes([]);
      return;
    }
    if (searchCliente.trim() === '') {
      // Sin texto: mostrar todos
      setFilteredClientes(clientes.slice(0, 20));
    } else {
      // Con texto: filtrar
      const term = searchCliente.toLowerCase();
      const filtered = clientes.filter(
        c =>
          c.razon_social.toLowerCase().includes(term) ||
          c.cuit.includes(searchCliente)
      );
      setFilteredClientes(filtered.slice(0, 20));
    }
  }, [searchCliente, clientes, showDropdown]);

  const loadClientes = async () => {
    const { data } = await supabase
      .from('clientes')
      .select('id, razon_social, cuit, email, telefono')
      .order('razon_social');

    if (data) setClientes(data);
  };

  const loadDivisiones = async () => {
    setLoadingDivisiones(true);
    const { data, error: fetchError } = await supabase
      .from('anmat_divisiones')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    setLoadingDivisiones(false);

    if (fetchError) {
      console.error('Error cargando divisiones:', fetchError);
      return;
    }

    if (data) setDivisiones(data);
  };

  const handleSelectCliente = (cliente: Cliente) => {
    setFormData({
      ...formData,
      cliente_id: cliente.id,
      cliente_nombre: cliente.razon_social
    });
    setSearchCliente('');
    setShowDropdown(false);
    setShowNuevoCliente(false);
  };

  const handleCrearCliente = async () => {
    if (!nuevoCliente.razon_social.trim() || !nuevoCliente.cuit.trim()) {
      setError('Razón social y CUIT son obligatorios');
      return;
    }
    setCreandoCliente(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from('clientes')
      .insert([{
        razon_social: nuevoCliente.razon_social.trim(),
        cuit: nuevoCliente.cuit.trim(),
        email: nuevoCliente.email.trim() || null,
        telefono: nuevoCliente.telefono.trim() || null
      }])
      .select()
      .single();

    setCreandoCliente(false);

    if (insertError) {
      setError('Error al crear cliente: ' + insertError.message);
      return;
    }

    if (data) {
      setClientes([...clientes, data]);
      handleSelectCliente(data);
      setShowNuevoCliente(false);
      setNuevoCliente({ razon_social: '', cuit: '', email: '', telefono: '' });
    }
  };

  const handleSelectDivision = (division: Division) => {
    setFormData({
      ...formData,
      division_id: division.id,
      division_codigo: division.codigo,
      division_nombre: division.nombre
    });
    setStep(2);
  };

  const validateStep1 = () => {
    if (!formData.cliente_id) {
      setError('Seleccioná un cliente');
      return false;
    }
    if (!formData.division_id) {
      setError('Seleccioná una división ANMAT');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formData.descripcion_cliente.trim()) {
      setError('Describí brevemente qué necesita el cliente');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      console.log('Auth user ID:', user.id);

      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      console.log('Usuario query result:', { userData, userError });

      if (userError) {
        console.error('Error buscando usuario:', userError);
        throw new Error('Error buscando usuario: ' + userError.message);
      }

      if (!userData) {
        console.error('Usuario no encontrado para auth_id:', user.id);
        throw new Error(`Usuario no encontrado. Tu auth_id es: ${user.id}. Verificá que exista en la tabla usuarios.`);
      }

      // Construir datos específicos según la división
      const datosEspecificos: Record<string, any> = {};

      if (formData.division_codigo === 'ENVASES') {
        if (formData.tipo_envase) datosEspecificos.tipo_envase = formData.tipo_envase;
        if (formData.material_envase) datosEspecificos.material_envase = formData.material_envase;
        if (formData.capacidad_envase) datosEspecificos.capacidad_envase = formData.capacidad_envase;
      } else if (formData.division_codigo === 'ALIMENTOS') {
        if (formData.tipo_producto) datosEspecificos.tipo_producto = formData.tipo_producto;
        datosEspecificos.tiene_rnpa = formData.tiene_rnpa;
        if (formData.numero_rnpa) datosEspecificos.numero_rnpa = formData.numero_rnpa;
      } else if (formData.division_codigo === 'MEDICAMENTOS') {
        if (formData.tipo_medicamento) datosEspecificos.tipo_medicamento = formData.tipo_medicamento;
        if (formData.laboratorio_origen) datosEspecificos.laboratorio_origen = formData.laboratorio_origen;
        if (formData.principio_activo) datosEspecificos.principio_activo = formData.principio_activo;
        datosEspecificos.requiere_receta = formData.requiere_receta;
      } else if (formData.division_codigo === 'PROD_MEDICOS') {
        if (formData.clase_riesgo) datosEspecificos.clase_riesgo = formData.clase_riesgo;
        if (formData.uso_previsto) datosEspecificos.uso_previsto = formData.uso_previsto;
        datosEspecificos.tiene_certificado_origen = formData.tiene_certificado_origen;
      } else if (formData.division_codigo === 'COSMETICOS') {
        if (formData.tipo_cosmetico) datosEspecificos.tipo_cosmetico = formData.tipo_cosmetico;
        datosEspecificos.tiene_notificacion = formData.tiene_notificacion;
      } else if (formData.division_codigo === 'USO_DOMESTICO') {
        if (formData.tipo_domisanitario) datosEspecificos.tipo_domisanitario = formData.tipo_domisanitario;
      } else if (formData.division_codigo === 'SUPLEMENTOS') {
        if (formData.tipo_suplemento) datosEspecificos.tipo_suplemento = formData.tipo_suplemento;
        if (formData.ingrediente_principal) datosEspecificos.ingrediente_principal = formData.ingrediente_principal;
      }

      const { data, error: insertError } = await supabase
        .from('anmat_casos')
        .insert([
          {
            cliente_id: formData.cliente_id,
            division_id: formData.division_id,
            referencia_cliente: formData.referencia_cliente || null,
            descripcion_cliente: formData.descripcion_cliente,
            fuente_contacto: formData.fuente_contacto,
            es_urgente: formData.es_urgente,
            fecha_ingreso_puerto: formData.fecha_ingreso_puerto || null,
            cantidad_skus: formData.cantidad_skus_estimada ? parseInt(formData.cantidad_skus_estimada) : null,
            estado: 'INTAKE',
            created_by: userData.id,
            asignado_a: userData.id,
            datos_especificos: datosEspecificos
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error insertando caso:', insertError);
        throw insertError;
      }

      if (data) {
        onSuccess(data.id);
        onClose(); // Cerrar el modal después de crear exitosamente
      }
    } catch (err: any) {
      console.error('Error en handleSubmit:', err);
      setError(err.message || 'Error al crear el caso');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nuevo Caso ANMAT</h2>
              <p className="text-sm text-teal-100">Intake de consulta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-teal-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'
              }`}>1</div>
              <span className="text-sm font-medium">Cliente y División</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-teal-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'
              }`}>2</div>
              <span className="text-sm font-medium">Detalles</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-teal-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 3 ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'
              }`}>3</div>
              <span className="text-sm font-medium">Confirmar</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Cliente y División */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Cliente Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cliente *
                </label>
                {formData.cliente_id ? (
                  <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-teal-600" />
                      <span className="font-medium text-teal-900">{formData.cliente_nombre}</span>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, cliente_id: '', cliente_nombre: '' })}
                      className="text-teal-600 hover:text-teal-800 text-sm"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscá por razón social o CUIT, o hacé click para ver todos..."
                      value={searchCliente}
                      onFocus={() => setShowDropdown(true)}
                      onChange={(e) => { setSearchCliente(e.target.value); setShowDropdown(true); setShowNuevoCliente(false); }}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {showDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {filteredClientes.length > 0 ? (
                          <>
                            {filteredClientes.map(cliente => (
                              <button
                                key={cliente.id}
                                onClick={() => handleSelectCliente(cliente)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                              >
                                <p className="font-medium text-slate-900">{cliente.razon_social}</p>
                                <p className="text-sm text-slate-500">CUIT: {cliente.cuit}{cliente.email ? ` • ${cliente.email}` : ''}</p>
                              </button>
                            ))}
                            {/* Opción crear nuevo siempre al final */}
                            <button
                              onClick={() => {
                                setShowNuevoCliente(true);
                                setShowDropdown(false);
                                setNuevoCliente({ ...nuevoCliente, razon_social: searchCliente });
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-teal-50 border-t border-slate-200 flex items-center gap-2 text-teal-600 font-medium"
                            >
                              <UserPlus className="w-4 h-4" />
                              Crear cliente nuevo
                            </button>
                          </>
                        ) : (
                          <div className="p-4">
                            <p className="text-sm text-slate-500 mb-3">
                              {searchCliente ? `No se encontró "${searchCliente}"` : 'No hay clientes cargados'}
                            </p>
                            <button
                              onClick={() => {
                                setShowNuevoCliente(true);
                                setShowDropdown(false);
                                setNuevoCliente({ ...nuevoCliente, razon_social: searchCliente });
                              }}
                              className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-800"
                            >
                              <UserPlus className="w-4 h-4" />
                              Crear cliente nuevo
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Overlay para cerrar dropdown */}
                    {showDropdown && (
                      <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)} />
                    )}
                  </div>
                )}

                {/* Formulario crear cliente nuevo */}
                {showNuevoCliente && !formData.cliente_id && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Nuevo Cliente
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Razón Social *</label>
                        <input
                          type="text"
                          value={nuevoCliente.razon_social}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, razon_social: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          placeholder="Ej: LOCHEMAR S.A."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">CUIT *</label>
                        <input
                          type="text"
                          value={nuevoCliente.cuit}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, cuit: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          placeholder="Ej: 30-12345678-9"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                        <input
                          type="email"
                          value={nuevoCliente.email}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          placeholder="contacto@empresa.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
                        <input
                          type="text"
                          value={nuevoCliente.telefono}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                          placeholder="011-1234567"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleCrearCliente}
                        disabled={creandoCliente}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50"
                      >
                        {creandoCliente ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {creandoCliente ? 'Creando...' : 'Crear y seleccionar'}
                      </button>
                      <button
                        onClick={() => setShowNuevoCliente(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* División Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  División ANMAT *
                </label>
                <p className="text-sm text-slate-500 mb-3">
                  Seleccioná el área de ANMAT que corresponde a este caso
                </p>
                {loadingDivisiones ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                    <span className="ml-2 text-slate-600">Cargando divisiones...</span>
                  </div>
                ) : divisiones.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">No hay divisiones disponibles</span>
                    </div>
                    <p className="text-sm text-amber-600 mt-1">
                      Contactá al administrador para cargar las divisiones ANMAT en el sistema.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {divisiones.map(division => (
                      <button
                        key={division.id}
                        onClick={() => handleSelectDivision(division)}
                        title={division.descripcion || division.nombre}
                        className={`px-4 py-2 border rounded-lg transition-all text-sm font-medium ${
                          formData.division_id === division.id
                            ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-500'
                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {division.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Detalles */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="font-medium text-teal-900">{formData.cliente_nombre}</p>
                    <p className="text-sm text-teal-700">{formData.division_nombre}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción de la Consulta *
                </label>
                <textarea
                  value={formData.descripcion_cliente}
                  onChange={(e) => setFormData({ ...formData, descripcion_cliente: e.target.value })}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  placeholder="¿Qué necesita el cliente? Describí brevemente la situación..."
                />
              </div>

              {/* Campos específicos para ENVASES */}
              {formData.division_codigo === 'ENVASES' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                  <h4 className="font-medium text-blue-900 text-sm">Información del Envase</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Envase</label>
                      <select
                        value={formData.tipo_envase}
                        onChange={(e) => setFormData({ ...formData, tipo_envase: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="BOTELLA">Botella</option>
                        <option value="FRASCO">Frasco</option>
                        <option value="LATA">Lata</option>
                        <option value="BOLSA">Bolsa/Pouch</option>
                        <option value="BANDEJA">Bandeja</option>
                        <option value="FILM">Film</option>
                        <option value="CAJA">Caja/Cartón</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Material</label>
                      <select
                        value={formData.material_envase}
                        onChange={(e) => setFormData({ ...formData, material_envase: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="PET">PET</option>
                        <option value="PEAD">PEAD</option>
                        <option value="PEBD">PEBD</option>
                        <option value="PP">Polipropileno (PP)</option>
                        <option value="PS">Poliestireno (PS)</option>
                        <option value="VIDRIO">Vidrio</option>
                        <option value="ALUMINIO">Aluminio</option>
                        <option value="HOJALATA">Hojalata</option>
                        <option value="CARTON">Cartón</option>
                        <option value="MULTICAPA">Multicapa</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Capacidad</label>
                      <input
                        type="text"
                        value={formData.capacidad_envase}
                        onChange={(e) => setFormData({ ...formData, capacidad_envase: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="Ej: 500ml, 1L, 250g"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Campos específicos para ALIMENTOS */}
              {formData.division_codigo === 'ALIMENTOS' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
                  <h4 className="font-medium text-green-900 text-sm">Información del Producto Alimenticio</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Producto</label>
                      <select
                        value={formData.tipo_producto}
                        onChange={(e) => setFormData({ ...formData, tipo_producto: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="LACTEO">Lácteos</option>
                        <option value="CARNICO">Cárnicos</option>
                        <option value="BEBIDA">Bebidas</option>
                        <option value="SNACK">Snacks/Golosinas</option>
                        <option value="CONSERVA">Conservas</option>
                        <option value="CONGELADO">Congelados</option>
                        <option value="PANADERIA">Panadería</option>
                        <option value="CONDIMENTO">Condimentos/Salsas</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-5">
                      <input
                        type="checkbox"
                        id="tiene_rnpa"
                        checked={formData.tiene_rnpa}
                        onChange={(e) => setFormData({ ...formData, tiene_rnpa: e.target.checked })}
                        className="w-4 h-4 text-teal-600 border-slate-300 rounded"
                      />
                      <label htmlFor="tiene_rnpa" className="text-sm text-slate-700">
                        Ya tiene RNPA
                      </label>
                    </div>
                    {formData.tiene_rnpa && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Número de RNPA</label>
                        <input
                          type="text"
                          value={formData.numero_rnpa}
                          onChange={(e) => setFormData({ ...formData, numero_rnpa: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                          placeholder="Ej: 02-123456"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Campos específicos para MEDICAMENTOS */}
              {formData.division_codigo === 'MEDICAMENTOS' && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
                  <h4 className="font-medium text-purple-900 text-sm">Información del Medicamento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Medicamento</label>
                      <select
                        value={formData.tipo_medicamento}
                        onChange={(e) => setFormData({ ...formData, tipo_medicamento: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="ESPECIALIDAD">Especialidad Medicinal</option>
                        <option value="GENERICO">Genérico</option>
                        <option value="BIOLOGICO">Biológico</option>
                        <option value="FITOTERAPICO">Fitoterápico</option>
                        <option value="HOMEOPATICO">Homeopático</option>
                        <option value="RADIOFARMACO">Radiofármaco</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Laboratorio de Origen</label>
                      <input
                        type="text"
                        value={formData.laboratorio_origen}
                        onChange={(e) => setFormData({ ...formData, laboratorio_origen: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="Nombre del laboratorio"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Principio Activo</label>
                      <input
                        type="text"
                        value={formData.principio_activo}
                        onChange={(e) => setFormData({ ...formData, principio_activo: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="Ej: Paracetamol, Ibuprofeno"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-5">
                      <input
                        type="checkbox"
                        id="requiere_receta"
                        checked={formData.requiere_receta}
                        onChange={(e) => setFormData({ ...formData, requiere_receta: e.target.checked })}
                        className="w-4 h-4 text-teal-600 border-slate-300 rounded"
                      />
                      <label htmlFor="requiere_receta" className="text-sm text-slate-700">
                        Requiere receta
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Campos específicos para PRODUCTOS MÉDICOS */}
              {formData.division_codigo === 'PROD_MEDICOS' && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-4">
                  <h4 className="font-medium text-indigo-900 text-sm">Información del Producto Médico</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Clase de Riesgo</label>
                      <select
                        value={formData.clase_riesgo}
                        onChange={(e) => setFormData({ ...formData, clase_riesgo: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="I">Clase I - Bajo riesgo</option>
                        <option value="II">Clase II - Riesgo moderado</option>
                        <option value="III">Clase III - Riesgo alto</option>
                        <option value="IV">Clase IV - Riesgo crítico</option>
                        <option value="DESCONOCIDO">No sé / A determinar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Uso Previsto</label>
                      <input
                        type="text"
                        value={formData.uso_previsto}
                        onChange={(e) => setFormData({ ...formData, uso_previsto: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="Ej: Diagnóstico, Tratamiento, Monitoreo"
                      />
                    </div>
                    <div className="flex items-center gap-3 md:col-span-2">
                      <input
                        type="checkbox"
                        id="tiene_certificado_origen"
                        checked={formData.tiene_certificado_origen}
                        onChange={(e) => setFormData({ ...formData, tiene_certificado_origen: e.target.checked })}
                        className="w-4 h-4 text-teal-600 border-slate-300 rounded"
                      />
                      <label htmlFor="tiene_certificado_origen" className="text-sm text-slate-700">
                        Tiene certificado de libre venta del país de origen
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Campos específicos para COSMÉTICOS */}
              {formData.division_codigo === 'COSMETICOS' && (
                <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg space-y-4">
                  <h4 className="font-medium text-pink-900 text-sm">Información del Cosmético</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Cosmético</label>
                      <select
                        value={formData.tipo_cosmetico}
                        onChange={(e) => setFormData({ ...formData, tipo_cosmetico: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="GRADO1">Grado 1 - Higiene/Perfumes</option>
                        <option value="GRADO2">Grado 2 - Con activos</option>
                        <option value="CAPILAR">Capilar</option>
                        <option value="FACIAL">Facial</option>
                        <option value="CORPORAL">Corporal</option>
                        <option value="MAQUILLAJE">Maquillaje</option>
                        <option value="INFANTIL">Infantil</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-5">
                      <input
                        type="checkbox"
                        id="tiene_notificacion"
                        checked={formData.tiene_notificacion}
                        onChange={(e) => setFormData({ ...formData, tiene_notificacion: e.target.checked })}
                        className="w-4 h-4 text-teal-600 border-slate-300 rounded"
                      />
                      <label htmlFor="tiene_notificacion" className="text-sm text-slate-700">
                        Ya tiene notificación en otro país
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Campos específicos para USO DOMÉSTICO */}
              {formData.division_codigo === 'USO_DOMESTICO' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-4">
                  <h4 className="font-medium text-orange-900 text-sm">Información del Producto Domisanitario</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Producto</label>
                      <select
                        value={formData.tipo_domisanitario}
                        onChange={(e) => setFormData({ ...formData, tipo_domisanitario: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="LIMPIEZA">Limpieza general</option>
                        <option value="DESINFECTANTE">Desinfectante</option>
                        <option value="INSECTICIDA">Insecticida/Plaguicida</option>
                        <option value="LAVANDINA">Lavandina/Cloro</option>
                        <option value="DETERGENTE">Detergente</option>
                        <option value="AMBIENTADOR">Ambientador</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Campos específicos para SUPLEMENTOS DIETARIOS */}
              {formData.division_codigo === 'SUPLEMENTOS' && (
                <div className="p-4 bg-lime-50 border border-lime-200 rounded-lg space-y-4">
                  <h4 className="font-medium text-lime-900 text-sm">Información del Suplemento Dietario</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Suplemento</label>
                      <select
                        value={formData.tipo_suplemento}
                        onChange={(e) => setFormData({ ...formData, tipo_suplemento: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="VITAMINAS">Vitaminas/Minerales</option>
                        <option value="PROTEINAS">Proteínas/Aminoácidos</option>
                        <option value="HERBAL">Herbal/Botánico</option>
                        <option value="OMEGA">Omega 3/Aceites</option>
                        <option value="PROBIOTICO">Probiótico</option>
                        <option value="DEPORTIVO">Deportivo</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Ingrediente Principal</label>
                      <input
                        type="text"
                        value={formData.ingrediente_principal}
                        onChange={(e) => setFormData({ ...formData, ingrediente_principal: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="Ej: Vitamina C, Colágeno, Whey"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Campos comunes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Referencia del Cliente
                  </label>
                  <input
                    type="text"
                    value={formData.referencia_cliente}
                    onChange={(e) => setFormData({ ...formData, referencia_cliente: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Ej: Proyecto 2026-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fuente del Contacto
                  </label>
                  <select
                    value={formData.fuente_contacto}
                    onChange={(e) => setFormData({ ...formData, fuente_contacto: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="TELEFONO">Teléfono</option>
                    <option value="PRESENCIAL">Presencial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cantidad de SKUs (estimada)
                  </label>
                  <input
                    type="number"
                    value={formData.cantidad_skus_estimada}
                    onChange={(e) => setFormData({ ...formData, cantidad_skus_estimada: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Ej: 15"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha Ingreso Puerto
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_ingreso_puerto}
                    onChange={(e) => setFormData({ ...formData, fecha_ingreso_puerto: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Si hay mercadería en tránsito</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="es_urgente"
                  checked={formData.es_urgente}
                  onChange={(e) => setFormData({ ...formData, es_urgente: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="es_urgente" className="text-sm text-slate-700">
                  <span className="font-medium">Marcar como urgente</span>
                  <span className="text-slate-500"> — Mercadería en puerto o deadline cercano</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={() => { if (validateStep2()) setStep(3); }}
                  className="px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmar */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900">Listo para crear</h3>
                  <p className="text-sm text-green-700 mt-1">Revisá la información antes de confirmar</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-slate-800">Resumen del Caso</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Cliente:</p>
                    <p className="font-medium text-slate-800">{formData.cliente_nombre}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">División:</p>
                    <p className="font-medium text-slate-800">{formData.division_nombre}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Fuente:</p>
                    <p className="font-medium text-slate-800">{formData.fuente_contacto}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">SKUs Estimados:</p>
                    <p className="font-medium text-slate-800">{formData.cantidad_skus_estimada || '—'}</p>
                  </div>
                  {formData.referencia_cliente && (
                    <div>
                      <p className="text-slate-600">Referencia:</p>
                      <p className="font-medium text-slate-800">{formData.referencia_cliente}</p>
                    </div>
                  )}
                  {formData.es_urgente && (
                    <div className="col-span-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        URGENTE
                      </span>
                    </div>
                  )}
                </div>
                {formData.descripcion_cliente && (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-slate-600 text-sm">Descripción:</p>
                    <p className="text-sm text-slate-800 mt-1">{formData.descripcion_cliente}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Atrás
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-between">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          {step === 3 && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Crear Caso
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
