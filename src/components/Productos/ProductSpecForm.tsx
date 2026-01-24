import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { EspecificacionService, EnvasesANMATData, ProductoEspecificacion } from '../../services/EspecificacionService';

interface ProductSpecFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productoId: string;
  productoNombre: string;
  tipoEspecificacion: 'envases_anmat' | 'alimentos_inal' | 'medicos_anmat';
}

const MATERIALES_PLASTICOS = [
  'Polietileno (PE)',
  'Polipropileno (PP)',
  'Poliestireno (PS)',
  'PET (Tereftalato de Polietileno)',
  'PVC (Policloruro de Vinilo)',
  'Policarbonato (PC)',
  'Poliamida (PA)',
  'EVOH (Etileno Vinil Alcohol)'
];

const MATERIALES_CELULOSAS = [
  'Papel',
  'Cartón',
  'Cartón corrugado',
  'Papel parafinado',
  'Papel siliconado'
];

const MATERIALES_ELASTOMEROS = [
  'Caucho natural',
  'Caucho sintético',
  'Silicona alimentaria',
  'NBR (Nitrilo)',
  'EPDM'
];

const MATERIALES_METALES = [
  'Acero inoxidable',
  'Aluminio',
  'Hojalata',
  'Aleaciones aprobadas'
];

export function ProductSpecForm({
  isOpen,
  onClose,
  onSuccess,
  productoId,
  productoNombre,
  tipoEspecificacion
}: ProductSpecFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSpec, setExistingSpec] = useState<ProductoEspecificacion | null>(null);

  const [fabricante, setFabricante] = useState('');
  const [paisFabricacion, setPaisFabricacion] = useState('');
  const [especData, setEspecData] = useState<EnvasesANMATData>(EspecificacionService.getEmptyEnvasesTemplate());

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
      setEspecData(spec.datos_tecnicos as EnvasesANMATData);
    }
    setLoading(false);
  };

  const handleMaterialToggle = (category: 'plasticos' | 'celulosas' | 'elastomeros' | 'metales', material: string) => {
    setEspecData(prev => ({
      ...prev,
      materiales: {
        ...prev.materiales,
        [category]: prev.materiales[category].includes(material)
          ? prev.materiales[category].filter((m: string) => m !== material)
          : [...prev.materiales[category], material]
      }
    }));
  };

  const handleCondicionUsoToggle = (condicion: keyof EnvasesANMATData['condiciones_uso']) => {
    setEspecData(prev => ({
      ...prev,
      condiciones_uso: {
        ...prev.condiciones_uso,
        [condicion]: !prev.condiciones_uso[condicion]
      }
    }));
  };

  const handleTipoAlimentoToggle = (tipo: keyof EnvasesANMATData['tipos_alimentos']) => {
    setEspecData(prev => ({
      ...prev,
      tipos_alimentos: {
        ...prev.tipos_alimentos,
        [tipo]: !prev.tipos_alimentos[tipo]
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

    const hasMaterials =
      especData.materiales.plasticos.length > 0 ||
      especData.materiales.celulosas.length > 0 ||
      especData.materiales.elastomeros.length > 0 ||
      especData.materiales.metales.length > 0 ||
      especData.materiales.vidrio;

    if (!hasMaterials) {
      setError('Debe seleccionar al menos un material');
      return;
    }

    setSaving(true);

    try {
      const specData = {
        producto_id: productoId,
        tipo_especificacion: tipoEspecificacion,
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Especificaciones Técnicas - Envases ANMAT</h2>
              <p className="text-sm text-blue-100">{productoNombre}</p>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fabricante *
              </label>
              <input
                type="text"
                value={fabricante}
                onChange={(e) => setFabricante(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del fabricante"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                País de Fabricación *
              </label>
              <input
                type="text"
                value={paisFabricacion}
                onChange={(e) => setPaisFabricacion(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="País de origen"
                required
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-3">1. Materiales Constitutivos</h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Plásticos</h4>
                <div className="grid grid-cols-2 gap-2">
                  {MATERIALES_PLASTICOS.map(material => (
                    <label key={material} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-amber-100 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={especData.materiales.plasticos.includes(material)}
                        onChange={() => handleMaterialToggle('plasticos', material)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-slate-700">{material}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Celulosas</h4>
                <div className="grid grid-cols-2 gap-2">
                  {MATERIALES_CELULOSAS.map(material => (
                    <label key={material} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-amber-100 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={especData.materiales.celulosas.includes(material)}
                        onChange={() => handleMaterialToggle('celulosas', material)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-slate-700">{material}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Elastómeros</h4>
                <div className="grid grid-cols-2 gap-2">
                  {MATERIALES_ELASTOMEROS.map(material => (
                    <label key={material} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-amber-100 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={especData.materiales.elastomeros.includes(material)}
                        onChange={() => handleMaterialToggle('elastomeros', material)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-slate-700">{material}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">Metales</h4>
                <div className="grid grid-cols-2 gap-2">
                  {MATERIALES_METALES.map(material => (
                    <label key={material} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-amber-100 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={especData.materiales.metales.includes(material)}
                        onChange={() => handleMaterialToggle('metales', material)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-slate-700">{material}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-amber-100 p-2 rounded font-medium">
                <input
                  type="checkbox"
                  checked={especData.materiales.vidrio}
                  onChange={() => setEspecData(prev => ({
                    ...prev,
                    materiales: { ...prev.materiales, vidrio: !prev.materiales.vidrio }
                  }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-slate-700">Vidrio</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Otros materiales</label>
                <input
                  type="text"
                  value={especData.materiales.otros}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    materiales: { ...prev.materiales, otros: e.target.value }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Especificar otros materiales"
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">2. Clasificación de Riesgo</h3>
            <div className="flex gap-4">
              {['bajo', 'medio', 'alto'].map(nivel => (
                <label key={nivel} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="riesgo"
                    value={nivel}
                    checked={especData.clasificacion_riesgo === nivel}
                    onChange={(e) => setEspecData(prev => ({
                      ...prev,
                      clasificacion_riesgo: e.target.value as 'bajo' | 'medio' | 'alto'
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-slate-700 capitalize">{nivel}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">3. Condiciones de Uso</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'heladera', label: 'Heladera (0-8°C)' },
                { key: 'freezer', label: 'Freezer (-18°C)' },
                { key: 'microondas', label: 'Microondas' },
                { key: 'hornalla', label: 'Hornalla/Horno' },
                { key: 'llenado_caliente', label: 'Llenado en Caliente' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-blue-100 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={especData.condiciones_uso[key as keyof EnvasesANMATData['condiciones_uso']] as boolean}
                    onChange={() => handleCondicionUsoToggle(key as keyof EnvasesANMATData['condiciones_uso'])}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-3">4. Tipos de Alimentos</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'acuosos', label: 'Alimentos Acuosos' },
                { key: 'acidos', label: 'Alimentos Ácidos' },
                { key: 'alcoholicos', label: 'Bebidas Alcohólicas' },
                { key: 'grasos', label: 'Alimentos Grasos' },
                { key: 'secos', label: 'Alimentos Secos' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-purple-100 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={especData.tipos_alimentos[key as keyof EnvasesANMATData['tipos_alimentos']]}
                    onChange={() => handleTipoAlimentoToggle(key as keyof EnvasesANMATData['tipos_alimentos'])}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-slate-700">{label}</span>
                </label>
              ))}
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
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
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
