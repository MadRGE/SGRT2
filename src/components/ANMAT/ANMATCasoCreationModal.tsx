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
    // Campos específicos por división
    tipo_envase: '',
    material_envase: '',
    capacidad_envase: '',
    tipo_producto: '',
    tiene_rnpa: false,
    numero_rnpa: ''
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

      const { data: userData } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!userData) throw new Error('Usuario no encontrado');

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
            asignado_a: userData.id
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        onSuccess(data.id);
      }
    } catch (err: any) {
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
