import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, FileText, Search, Calendar, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface Props {
  proyectoId: string;
  proyectoNombre: string;
  onClose: () => void;
  onSuccess: (expedienteId: string) => void;
}

interface TramiteTipo {
  id: string;
  codigo: string;
  nombre: string;
  organismo_id: string;
  rubro: string;
  sla_total_dias: number;
  es_habilitacion_previa: boolean;
  organismos?: {
    sigla: string;
    nombre: string;
  };
}

interface ChecklistItem {
  id: number;
  item: string;
  obligatorio: boolean;
  responsable: string;
  grupo: string | null;
}

export default function ExpedienteCreationModal({
  proyectoId,
  proyectoNombre,
  onClose,
  onSuccess
}: Props) {
  const [step, setStep] = useState(1);
  const [tramiteTipos, setTramiteTipos] = useState<TramiteTipo[]>([]);
  const [filteredTramites, setFilteredTramites] = useState<TramiteTipo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tramite_tipo_id: '',
    codigo: '',
    fecha_limite: '',
    prioridad: 'normal',
    observaciones: ''
  });

  const [selectedTramite, setSelectedTramite] = useState<TramiteTipo | null>(null);

  useEffect(() => {
    loadTramiteTipos();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = tramiteTipos.filter(
        (t) =>
          t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.organismos?.sigla.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTramites(filtered);
    } else {
      setFilteredTramites(tramiteTipos);
    }
  }, [searchTerm, tramiteTipos]);

  useEffect(() => {
    if (selectedTramite) {
      loadChecklist(selectedTramite.id);
      const defaultFechaLimite = new Date();
      defaultFechaLimite.setDate(defaultFechaLimite.getDate() + selectedTramite.sla_total_dias);
      setFormData((prev) => ({
        ...prev,
        fecha_limite: defaultFechaLimite.toISOString().split('T')[0]
      }));
    }
  }, [selectedTramite]);

  const loadTramiteTipos = async () => {
    const { data } = await supabase
      .from('tramite_tipos')
      .select('*, organismos(sigla, nombre)')
      .order('nombre');

    if (data) {
      setTramiteTipos(data as any);
      setFilteredTramites(data as any);
    }
  };

  const loadChecklist = async (tramiteTipoId: string) => {
    const { data } = await supabase
      .from('tramite_checklists')
      .select('*')
      .eq('tramite_tipo_id', tramiteTipoId)
      .order('grupo');

    if (data) {
      setChecklist(data);
    }
  };

  const generateCodigo = async () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const { count } = await supabase
      .from('expedientes')
      .select('*', { count: 'exact', head: true })
      .like('codigo', `EXP-${year}-${month}-%`);

    const nextNumber = String((count || 0) + 1).padStart(3, '0');
    return `EXP-${year}-${month}-${nextNumber}`;
  };

  const handleSelectTramite = (tramite: TramiteTipo) => {
    setSelectedTramite(tramite);
    setFormData((prev) => ({
      ...prev,
      tramite_tipo_id: tramite.id
    }));
    setStep(2);
  };

  const validateStep2 = () => {
    if (!formData.codigo) {
      setError('El código del expediente es requerido');
      return false;
    }
    if (!formData.fecha_limite) {
      setError('La fecha límite es requerida');
      return false;
    }
    const today = new Date().toISOString().split('T')[0];
    if (formData.fecha_limite < today) {
      setError('La fecha límite no puede ser anterior a hoy');
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
      const { data: existing } = await supabase
        .from('expedientes')
        .select('id')
        .eq('codigo', formData.codigo)
        .maybeSingle();

      if (existing) {
        setError('Ya existe un expediente con este código');
        setLoading(false);
        return;
      }

      const { data, error: insertError } = await supabase
        .from('expedientes')
        .insert([
          {
            codigo: formData.codigo,
            proyecto_id: proyectoId,
            tramite_tipo_id: formData.tramite_tipo_id,
            estado: 'iniciado',
            fecha_limite: formData.fecha_limite,
            paso_actual: 1,
            progreso: 0,
            semaforo: 'verde',
            observaciones: formData.observaciones || null
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        await supabase.from('historial').insert([
          {
            expediente_id: data.id,
            proyecto_id: proyectoId,
            accion: 'Expediente creado',
            descripcion: `Expediente ${formData.codigo} creado para trámite ${selectedTramite?.nombre}`
          }
        ]);

        onSuccess(data.id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear el expediente');
      setLoading(false);
    }
  };

  const handleAutoGenerateCodigo = async () => {
    const codigo = await generateCodigo();
    setFormData((prev) => ({ ...prev, codigo }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nuevo Trámite</h2>
              <p className="text-sm text-blue-100">{proyectoNombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step >= 1 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">Tipo de Trámite</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-2"></div>
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step >= 2 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Detalles</span>
            </div>
            <div className="flex-1 h-0.5 bg-slate-200 mx-2"></div>
            <div
              className={`flex items-center gap-2 ${
                step >= 3 ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                  step >= 3 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium">Revisión</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código o organismo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {filteredTramites.map((tramite) => (
                  <button
                    key={tramite.id}
                    onClick={() => handleSelectTramite(tramite)}
                    className="text-left p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 group-hover:text-blue-600">
                          {tramite.nombre}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                          <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">
                            {tramite.codigo}
                          </span>
                          <span className="flex items-center gap-1">
                            {tramite.organismos?.sigla}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {tramite.sla_total_dias} días
                          </span>
                        </div>
                        {tramite.es_habilitacion_previa && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            Habilitación Previa
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedTramite && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Trámite Seleccionado</h3>
                <p className="text-sm text-blue-800">{selectedTramite.nombre}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {selectedTramite.organismos?.sigla} - {selectedTramite.codigo}
                </p>
              </div>

              {selectedTramite.es_habilitacion_previa && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium mb-1">Habilitación Previa Requerida</p>
                    <p>
                      Este trámite puede requerir otras habilitaciones previas. Asegúrate de que
                      estén completadas antes de iniciar.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Código del Expediente *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.codigo}
                      onChange={(e) =>
                        setFormData({ ...formData, codigo: e.target.value.toUpperCase() })
                      }
                      className="flex-1 p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="EXP-2024-01-001"
                    />
                    <button
                      type="button"
                      onClick={handleAutoGenerateCodigo}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                      Generar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha Límite *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_limite}
                    onChange={(e) => setFormData({ ...formData, fecha_limite: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Sugerido: {selectedTramite.sla_total_dias} días desde hoy
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Prioridad
                  </label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Observaciones adicionales sobre este expediente..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 3 && selectedTramite && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900">Listo para crear</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Revisa la información antes de confirmar la creación del expediente.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-slate-800">Información del Expediente</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-600">Código:</p>
                      <p className="font-medium text-slate-800">{formData.codigo}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Tipo de Trámite:</p>
                      <p className="font-medium text-slate-800">{selectedTramite.nombre}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Organismo:</p>
                      <p className="font-medium text-slate-800">{selectedTramite.organismos?.sigla}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Fecha Límite:</p>
                      <p className="font-medium text-slate-800">
                        {new Date(formData.fecha_limite).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600">Prioridad:</p>
                      <p className="font-medium text-slate-800 capitalize">{formData.prioridad}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Estado Inicial:</p>
                      <p className="font-medium text-slate-800">Iniciado</p>
                    </div>
                  </div>
                  {formData.observaciones && (
                    <div>
                      <p className="text-slate-600 text-sm">Observaciones:</p>
                      <p className="text-sm text-slate-800 mt-1">{formData.observaciones}</p>
                    </div>
                  )}
                </div>

                {checklist.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-3">
                      Documentos Requeridos ({checklist.length})
                    </h4>
                    <p className="text-sm text-slate-600 mb-3">
                      Estos documentos deberán ser cargados después de crear el expediente.
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {checklist.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="text-sm text-slate-700 flex items-center gap-2"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          {item.item}
                          {item.obligatorio && (
                            <span className="text-red-500 text-xs">*</span>
                          )}
                        </div>
                      ))}
                      {checklist.length > 5 && (
                        <p className="text-xs text-slate-500 mt-2">
                          ... y {checklist.length - 5} documentos más
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-between">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-white transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          {step === 3 && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Crear Expediente
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
