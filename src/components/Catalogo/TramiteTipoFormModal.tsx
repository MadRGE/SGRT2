import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, FileText, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  organismos: Array<{ id: string; sigla: string; nombre: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TramiteTipoFormModal({ organismos, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseLegalInput, setBaseLegalInput] = useState('');

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    organismo_id: '',
    rubro: '',
    base_legal: [] as string[],
    renovacion: 'no_aplica',
    sla_total_dias: 30,
    admite_equivalencia: false,
    es_habilitacion_previa: false,
    logica_especial: ''
  });

  const rubrosComunes = [
    'Alimentos',
    'Medicamentos',
    'Cosméticos',
    'Productos Médicos',
    'Suplementos Dietarios',
    'Productos de Limpieza',
    'Agroquímicos',
    'Otro'
  ];

  const handleAddBaseLegal = () => {
    if (baseLegalInput.trim()) {
      setFormData({
        ...formData,
        base_legal: [...formData.base_legal, baseLegalInput.trim()]
      });
      setBaseLegalInput('');
    }
  };

  const handleRemoveBaseLegal = (index: number) => {
    setFormData({
      ...formData,
      base_legal: formData.base_legal.filter((_, i) => i !== index)
    });
  };

  const validateForm = () => {
    if (!formData.codigo.trim()) {
      setError('El código es requerido');
      return false;
    }
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!formData.organismo_id) {
      setError('Debe seleccionar un organismo');
      return false;
    }
    if (!formData.rubro.trim()) {
      setError('El rubro es requerido');
      return false;
    }
    if (formData.sla_total_dias < 1) {
      setError('El SLA debe ser al menos 1 día');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const { data: existing } = await supabase
        .from('tramite_tipos')
        .select('id')
        .eq('codigo', formData.codigo)
        .maybeSingle();

      if (existing) {
        setError('Ya existe un trámite con este código');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from('tramite_tipos').insert([
        {
          codigo: formData.codigo.toUpperCase(),
          nombre: formData.nombre,
          organismo_id: formData.organismo_id,
          rubro: formData.rubro,
          base_legal: formData.base_legal.length > 0 ? formData.base_legal : ['N/A'],
          renovacion: formData.renovacion,
          sla_total_dias: formData.sla_total_dias,
          admite_equivalencia: formData.admite_equivalencia,
          es_habilitacion_previa: formData.es_habilitacion_previa,
          logica_especial: formData.logica_especial || null
        }
      ]);

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al crear el tipo de trámite');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nuevo Tipo de Trámite</h2>
              <p className="text-sm text-blue-100">Agregar al catálogo del sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.codigo}
                    onChange={(e) =>
                      setFormData({ ...formData, codigo: e.target.value.toUpperCase() })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ANMAT-RNE-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Organismo *
                  </label>
                  <select
                    required
                    value={formData.organismo_id}
                    onChange={(e) => setFormData({ ...formData, organismo_id: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar organismo</option>
                    {organismos.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.sigla} - {org.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre del Trámite *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Registro Nacional de Establecimientos"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-2">Clasificación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rubro *
                  </label>
                  <input
                    type="text"
                    required
                    list="rubros-list"
                    value={formData.rubro}
                    onChange={(e) => setFormData({ ...formData, rubro: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Seleccionar o escribir"
                  />
                  <datalist id="rubros-list">
                    {rubrosComunes.map((rubro) => (
                      <option key={rubro} value={rubro} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SLA (días) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.sla_total_dias}
                    onChange={(e) =>
                      setFormData({ ...formData, sla_total_dias: parseInt(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Renovación
                  </label>
                  <select
                    value={formData.renovacion}
                    onChange={(e) => setFormData({ ...formData, renovacion: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="no_aplica">No Aplica</option>
                    <option value="anual">Anual</option>
                    <option value="bianual">Bianual</option>
                    <option value="trianual">Trianual</option>
                    <option value="cada_5_años">Cada 5 años</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">Base Legal</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={baseLegalInput}
                    onChange={(e) => setBaseLegalInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBaseLegal())}
                    className="flex-1 p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Disposición 2318/2002"
                  />
                  <button
                    type="button"
                    onClick={handleAddBaseLegal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
                {formData.base_legal.length > 0 && (
                  <div className="space-y-2">
                    {formData.base_legal.map((base, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-2 rounded border border-slate-200"
                      >
                        <span className="text-sm text-slate-700">{base}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBaseLegal(index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-3">Opciones Adicionales</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.es_habilitacion_previa}
                    onChange={(e) =>
                      setFormData({ ...formData, es_habilitacion_previa: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      Es Habilitación Previa
                    </span>
                    <p className="text-xs text-slate-500">
                      Este trámite es requisito para otros trámites
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.admite_equivalencia}
                    onChange={(e) =>
                      setFormData({ ...formData, admite_equivalencia: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Admite Equivalencia</span>
                    <p className="text-xs text-slate-500">
                      Se pueden usar certificados equivalentes
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Lógica Especial (Opcional)
              </label>
              <textarea
                value={formData.logica_especial}
                onChange={(e) => setFormData({ ...formData, logica_especial: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Notas o lógica especial para este tipo de trámite..."
              />
            </div>
          </div>
        </form>

        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-white transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
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
                Crear Tipo de Trámite
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
