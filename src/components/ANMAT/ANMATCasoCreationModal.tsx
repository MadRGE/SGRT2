import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  X,
  FileText,
  Search,
  Building2,
  Package,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronRight,
  Upload,
  MessageSquare
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: (casoId: string) => void;
}

interface Empresa {
  id: string;
  razon_social: string;
  nombre_fantasia: string | null;
  cuit: string;
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
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [divisiones, setDivisiones] = useState<Division[]>([]);
  const [searchEmpresa, setSearchEmpresa] = useState('');
  const [filteredEmpresas, setFilteredEmpresas] = useState<Empresa[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    empresa_id: '',
    empresa_nombre: '',
    division_id: '',
    division_nombre: '',
    referencia_cliente: '',
    descripcion_cliente: '',
    fuente_contacto: 'EMAIL',
    es_urgente: false,
    fecha_ingreso_puerto: '',
    cantidad_skus_estimada: ''
  });

  useEffect(() => {
    loadEmpresas();
    loadDivisiones();
  }, []);

  useEffect(() => {
    if (searchEmpresa.length >= 2) {
      const filtered = empresas.filter(
        e =>
          e.razon_social.toLowerCase().includes(searchEmpresa.toLowerCase()) ||
          e.nombre_fantasia?.toLowerCase().includes(searchEmpresa.toLowerCase()) ||
          e.cuit.includes(searchEmpresa)
      );
      setFilteredEmpresas(filtered.slice(0, 10));
    } else {
      setFilteredEmpresas([]);
    }
  }, [searchEmpresa, empresas]);

  const loadEmpresas = async () => {
    const { data } = await supabase
      .from('empresas')
      .select('id, razon_social, nombre_fantasia, cuit')
      .order('razon_social');

    if (data) setEmpresas(data);
  };

  const loadDivisiones = async () => {
    const { data } = await supabase
      .from('anmat_divisiones')
      .select('*')
      .eq('activo', true)
      .order('nombre');

    if (data) setDivisiones(data);
  };

  const handleSelectEmpresa = (empresa: Empresa) => {
    setFormData({
      ...formData,
      empresa_id: empresa.id,
      empresa_nombre: empresa.nombre_fantasia || empresa.razon_social
    });
    setSearchEmpresa('');
    setFilteredEmpresas([]);
  };

  const handleSelectDivision = (division: Division) => {
    setFormData({
      ...formData,
      division_id: division.id,
      division_nombre: division.nombre
    });
    setStep(2);
  };

  const validateStep1 = () => {
    if (!formData.empresa_id) {
      setError('Selecciona una empresa');
      return false;
    }
    if (!formData.division_id) {
      setError('Selecciona una división ANMAT');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formData.descripcion_cliente.trim()) {
      setError('Describe brevemente qué necesita el cliente');
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      // Get user id from usuarios table
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
            empresa_id: formData.empresa_id,
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
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Empresa y División</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-teal-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Detalles</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-teal-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step >= 3 ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'
              }`}>
                3
              </div>
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

          {/* Step 1: Empresa y División */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Empresa Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Empresa / Cliente *
                </label>
                {formData.empresa_id ? (
                  <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-teal-600" />
                      <span className="font-medium text-teal-900">{formData.empresa_nombre}</span>
                    </div>
                    <button
                      onClick={() => setFormData({ ...formData, empresa_id: '', empresa_nombre: '' })}
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
                      placeholder="Buscar por razón social, nombre o CUIT..."
                      value={searchEmpresa}
                      onChange={(e) => setSearchEmpresa(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {filteredEmpresas.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {filteredEmpresas.map(empresa => (
                          <button
                            key={empresa.id}
                            onClick={() => handleSelectEmpresa(empresa)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                          >
                            <p className="font-medium text-slate-900">
                              {empresa.nombre_fantasia || empresa.razon_social}
                            </p>
                            <p className="text-sm text-slate-500">
                              {empresa.razon_social} • CUIT: {empresa.cuit}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* División Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  División ANMAT *
                </label>
                <p className="text-sm text-slate-500 mb-3">
                  Selecciona el área de ANMAT que corresponde a este caso
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {divisiones.map(division => (
                    <button
                      key={division.id}
                      onClick={() => handleSelectDivision(division)}
                      className={`text-left p-4 border rounded-lg transition-all ${
                        formData.division_id === division.id
                          ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500'
                          : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-medium text-slate-900">{division.nombre}</p>
                      {division.descripcion && (
                        <p className="text-xs text-slate-500 mt-1">{division.descripcion}</p>
                      )}
                    </button>
                  ))}
                </div>
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
                    <p className="font-medium text-teal-900">{formData.empresa_nombre}</p>
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
                  rows={4}
                  placeholder="¿Qué productos necesita registrar? ¿Hay alguna urgencia? Describe la situación..."
                />
              </div>

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
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
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
                  <p className="text-sm text-green-700 mt-1">
                    Revisa la información antes de confirmar
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-slate-800">Resumen del Caso</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Empresa:</p>
                    <p className="font-medium text-slate-800">{formData.empresa_nombre}</p>
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
