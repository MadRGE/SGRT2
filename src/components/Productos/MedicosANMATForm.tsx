import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { EspecificacionService, MedicosANMATData, ProductoEspecificacion } from '../../services/EspecificacionService';

interface MedicosANMATFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productoId: string;
  productoNombre: string;
}

const CLASE_RIESGO_OPTIONS = [
  { value: 'I', label: 'Clase I - Bajo Riesgo', description: 'No invasivos o contacto breve' },
  { value: 'IIa', label: 'Clase IIa - Riesgo Medio-Bajo', description: 'Invasivos de corta duración' },
  { value: 'IIb', label: 'Clase IIb - Riesgo Medio-Alto', description: 'Invasivos de larga duración' },
  { value: 'III', label: 'Clase III - Alto Riesgo', description: 'Invasivos prolongados o implantables' },
  { value: 'IV', label: 'Clase IV - Riesgo Crítico', description: 'Soporte vital o críticos' }
];

const TIPO_DISPOSITIVO_OPTIONS = [
  'Activo',
  'Pasivo',
  'Implantable',
  'Diagnóstico in vitro',
  'Quirúrgico',
  'Otro'
];

const CONTACTO_CORPORAL_OPTIONS = [
  { value: 'ninguno', label: 'Sin contacto corporal' },
  { value: 'superficie', label: 'Superficie (piel intacta)' },
  { value: 'invasivo_corto', label: 'Invasivo de corta duración (< 60 min)' },
  { value: 'invasivo_prolongado', label: 'Invasivo prolongado (> 30 días)' },
  { value: 'implantable', label: 'Implantable permanente' }
];

const NORMAS_COMUNES = [
  'ISO 13485 - Sistema de Gestión de Calidad',
  'ISO 14971 - Gestión de Riesgos',
  'ISO 10993 - Evaluación Biológica',
  'IEC 60601 - Seguridad Eléctrica',
  'ISO 11135 - Esterilización por Óxido de Etileno',
  'ISO 11137 - Esterilización por Radiación',
  'ISO 17665 - Esterilización por Vapor'
];

export function MedicosANMATForm({
  isOpen,
  onClose,
  onSuccess,
  productoId,
  productoNombre
}: MedicosANMATFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSpec, setExistingSpec] = useState<ProductoEspecificacion | null>(null);

  const [fabricante, setFabricante] = useState('');
  const [paisFabricacion, setPaisFabricacion] = useState('');
  const [especData, setEspecData] = useState<MedicosANMATData>(EspecificacionService.getEmptyMedicosTemplate());

  useEffect(() => {
    if (isOpen && productoId) {
      loadExistingSpec();
    }
  }, [isOpen, productoId]);

  const loadExistingSpec = async () => {
    setLoading(true);
    const spec = await EspecificacionService.getEspecificacionByProducto(productoId);
    if (spec) {
      setExistingSpec(spec);
      setFabricante(spec.fabricante || '');
      setPaisFabricacion(spec.pais_fabricacion || '');
      setEspecData(spec.datos_tecnicos as MedicosANMATData);
    }
    setLoading(false);
  };

  const handleNormaToggle = (norma: string) => {
    setEspecData(prev => ({
      ...prev,
      normas_aplicables: prev.normas_aplicables.includes(norma)
        ? prev.normas_aplicables.filter(n => n !== norma)
        : [...prev.normas_aplicables, norma]
    }));
  };

  const handleMaterialAdd = (material: string) => {
    if (material.trim() && !especData.caracteristicas_tecnicas.materiales_construccion.includes(material.trim())) {
      setEspecData(prev => ({
        ...prev,
        caracteristicas_tecnicas: {
          ...prev.caracteristicas_tecnicas,
          materiales_construccion: [...prev.caracteristicas_tecnicas.materiales_construccion, material.trim()]
        }
      }));
    }
  };

  const handleMaterialRemove = (material: string) => {
    setEspecData(prev => ({
      ...prev,
      caracteristicas_tecnicas: {
        ...prev.caracteristicas_tecnicas,
        materiales_construccion: prev.caracteristicas_tecnicas.materiales_construccion.filter(m => m !== material)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fabricante || !paisFabricacion) {
      setError('Fabricante y País de Fabricación son obligatorios');
      return;
    }

    if (!especData.uso_previsto || !especData.indicacion_clinica) {
      setError('Uso previsto e indicación clínica son obligatorios');
      return;
    }

    setSaving(true);

    try {
      const specData = {
        producto_id: productoId,
        tipo_especificacion: 'medicos_anmat' as const,
        datos_tecnicos: especData,
        fabricante,
        pais_fabricacion: paisFabricacion,
        estado: 'completo' as const,
        version: existingSpec ? existingSpec.version + 1 : 1
      };

      let result;
      if (existingSpec) {
        result = await EspecificacionService.updateEspecificacion(existingSpec.id, specData);
      } else {
        result = await EspecificacionService.createEspecificacion(specData);
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Error al guardar especificaciones');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando especificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl my-8">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Especificaciones Técnicas - Producto Médico ANMAT</h2>
              <p className="text-sm text-green-100">{productoNombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {existingSpec && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Especificación existente encontrada (v{existingSpec.version})</p>
                <p>Al guardar se creará la versión {existingSpec.version + 1}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fabricante *</label>
              <input
                type="text"
                value={fabricante}
                onChange={(e) => setFabricante(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nombre del fabricante"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">País de Fabricación *</label>
              <input
                type="text"
                value={paisFabricacion}
                onChange={(e) => setPaisFabricacion(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="País de origen"
                required
              />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">1. Clasificación de Riesgo ANMAT</h3>
            <p className="text-sm text-slate-600 mb-3">Según Disposición 2318/02</p>
            <div className="space-y-2">
              {CLASE_RIESGO_OPTIONS.map(({ value, label, description }) => (
                <label key={value} className="flex items-start gap-3 p-3 hover:bg-green-100 rounded-lg cursor-pointer border border-transparent hover:border-green-300 transition-all">
                  <input
                    type="radio"
                    name="clase_riesgo"
                    value={value}
                    checked={especData.clase_riesgo === value}
                    onChange={(e) => setEspecData(prev => ({
                      ...prev,
                      clase_riesgo: e.target.value as MedicosANMATData['clase_riesgo']
                    }))}
                    className="w-4 h-4 text-green-600 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-slate-700">{label}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">2. Uso Previsto e Indicación Clínica</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Uso Previsto *</label>
                <textarea
                  value={especData.uso_previsto}
                  onChange={(e) => setEspecData(prev => ({ ...prev, uso_previsto: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describir el uso previsto del dispositivo médico"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Indicación Clínica *</label>
                <textarea
                  value={especData.indicacion_clinica}
                  onChange={(e) => setEspecData(prev => ({ ...prev, indicacion_clinica: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Indicación clínica específica"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Dispositivo</label>
                <select
                  value={especData.tipo_dispositivo}
                  onChange={(e) => setEspecData(prev => ({ ...prev, tipo_dispositivo: e.target.value as MedicosANMATData['tipo_dispositivo'] }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="activo">Activo</option>
                  <option value="pasivo">Pasivo</option>
                  <option value="implantable">Implantable</option>
                  <option value="diagnostico">Diagnóstico</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-3">3. Esterilidad y Biocompatibilidad</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={especData.esterilidad.es_esteril}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    esterilidad: { ...prev.esterilidad, es_esteril: e.target.checked }
                  }))}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="text-sm font-medium">Dispositivo estéril</span>
              </label>

              {especData.esterilidad.es_esteril && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Método de Esterilización</label>
                  <input
                    type="text"
                    value={especData.esterilidad.metodo_esterilizacion || ''}
                    onChange={(e) => setEspecData(prev => ({
                      ...prev,
                      esterilidad: { ...prev.esterilidad, metodo_esterilizacion: e.target.value }
                    }))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Ej: Óxido de etileno, Radiación gamma, Vapor"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Contacto Corporal</label>
                <select
                  value={especData.biocompatibilidad.contacto_corporal}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    biocompatibilidad: { ...prev.biocompatibilidad, contacto_corporal: e.target.value as MedicosANMATData['biocompatibilidad']['contacto_corporal'] }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CONTACTO_CORPORAL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-3">4. Normas Técnicas Aplicables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {NORMAS_COMUNES.map(norma => (
                <label key={norma} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-purple-100 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={especData.normas_aplicables.includes(norma)}
                    onChange={() => handleNormaToggle(norma)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-slate-700">{norma}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-3">5. Características Técnicas</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Descripción Técnica</label>
                <textarea
                  value={especData.caracteristicas_tecnicas.descripcion_tecnica}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    caracteristicas_tecnicas: { ...prev.caracteristicas_tecnicas, descripcion_tecnica: e.target.value }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  rows={3}
                  placeholder="Descripción técnica detallada del dispositivo"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-between rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 border border-slate-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Especificaciones
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
