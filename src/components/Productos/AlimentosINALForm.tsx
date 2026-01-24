import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle, Apple } from 'lucide-react';
import { EspecificacionService, AlimentosINALData, ProductoEspecificacion } from '../../services/EspecificacionService';

interface AlimentosINALFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productoId: string;
  productoNombre: string;
}

const ALERGENOS_COMUNES = [
  'Gluten (trigo, avena, cebada, centeno)',
  'Crustáceos y derivados',
  'Huevos y derivados',
  'Pescado y derivados',
  'Maní (cacahuate)',
  'Soja y derivados',
  'Leche y derivados (lactosa)',
  'Frutos secos (almendras, avellanas, nueces, etc.)',
  'Apio y derivados',
  'Mostaza y derivados',
  'Sésamo y derivados',
  'Sulfitos',
  'Altramuces y derivados',
  'Moluscos y derivados'
];

export function AlimentosINALForm({
  isOpen,
  onClose,
  onSuccess,
  productoId,
  productoNombre
}: AlimentosINALFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSpec, setExistingSpec] = useState<ProductoEspecificacion | null>(null);

  const [fabricante, setFabricante] = useState('');
  const [paisFabricacion, setPaisFabricacion] = useState('');
  const [especData, setEspecData] = useState<AlimentosINALData>(EspecificacionService.getEmptyAlimentosTemplate());

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
      setEspecData(spec.datos_tecnicos as AlimentosINALData);
    }
    setLoading(false);
  };

  const handleAlergenoToggle = (alergeno: string) => {
    const alergenos = especData.ingredientes.alergenos || [];
    setEspecData(prev => ({
      ...prev,
      ingredientes: {
        ...prev.ingredientes,
        alergenos: alergenos.includes(alergeno)
          ? alergenos.filter(a => a !== alergeno)
          : [...alergenos, alergeno]
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

    if (!especData.tipo_alimento || !especData.categoria_caa) {
      setError('Tipo de alimento y categoría CAA son obligatorios');
      return;
    }

    setSaving(true);

    try {
      const specData = {
        producto_id: productoId,
        tipo_especificacion: 'alimentos_inal' as const,
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
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Apple className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Especificaciones Técnicas - Producto Alimenticio INAL</h2>
              <p className="text-sm text-orange-100">{productoNombre}</p>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Fabricante/Elaborador *</label>
              <input
                type="text"
                value={fabricante}
                onChange={(e) => setFabricante(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Razón social del elaborador"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">País de Origen *</label>
              <input
                type="text"
                value={paisFabricacion}
                onChange={(e) => setPaisFabricacion(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="País de fabricación"
                required
              />
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-3">1. Clasificación del Alimento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Alimento *</label>
                <input
                  type="text"
                  value={especData.tipo_alimento}
                  onChange={(e) => setEspecData(prev => ({ ...prev, tipo_alimento: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: Bebida, Snack, Conserva, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoría CAA *</label>
                <input
                  type="text"
                  value={especData.categoria_caa}
                  onChange={(e) => setEspecData(prev => ({ ...prev, categoria_caa: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: Art. 1072, Capítulo V"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">2. Información Nutricional (por 100g/100ml)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Energía (kcal)</label>
                <input
                  type="number"
                  step="0.1"
                  value={especData.informacion_nutricional.energia_kcal}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    informacion_nutricional: { ...prev.informacion_nutricional, energia_kcal: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Proteínas (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={especData.informacion_nutricional.proteinas_g}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    informacion_nutricional: { ...prev.informacion_nutricional, proteinas_g: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Carbohidratos (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={especData.informacion_nutricional.carbohidratos_g}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    informacion_nutricional: { ...prev.informacion_nutricional, carbohidratos_g: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Azúcares (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={especData.informacion_nutricional.azucares_g}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    informacion_nutricional: { ...prev.informacion_nutricional, azucares_g: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Grasas Totales (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={especData.informacion_nutricional.grasas_totales_g}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    informacion_nutricional: { ...prev.informacion_nutricional, grasas_totales_g: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sodio (mg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={especData.informacion_nutricional.sodio_mg}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    informacion_nutricional: { ...prev.informacion_nutricional, sodio_mg: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-3">3. Ingredientes y Alérgenos</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lista de Ingredientes</label>
                <textarea
                  value={especData.ingredientes.lista_ingredientes}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    ingredientes: { ...prev.ingredientes, lista_ingredientes: e.target.value }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  placeholder="Lista completa de ingredientes en orden decreciente"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={especData.ingredientes.contiene_alergenos}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    ingredientes: { ...prev.ingredientes, contiene_alergenos: e.target.checked }
                  }))}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <span className="text-sm font-medium">Contiene alérgenos</span>
              </label>

              {especData.ingredientes.contiene_alergenos && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">Seleccionar alérgenos presentes:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {ALERGENOS_COMUNES.map(alergeno => (
                      <label key={alergeno} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-amber-100 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={(especData.ingredientes.alergenos || []).includes(alergeno)}
                          onChange={() => handleAlergenoToggle(alergeno)}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                        <span className="text-slate-700">{alergeno}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">4. Proceso de Elaboración</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Descripción del Proceso</label>
                <textarea
                  value={especData.proceso_elaboracion.descripcion}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    proceso_elaboracion: { ...prev.proceso_elaboracion, descripcion: e.target.value }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción del proceso de elaboración"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Condiciones de Conservación</label>
                  <input
                    type="text"
                    value={especData.proceso_elaboracion.conservacion}
                    onChange={(e) => setEspecData(prev => ({
                      ...prev,
                      proceso_elaboracion: { ...prev.proceso_elaboracion, conservacion: e.target.value }
                    }))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Refrigerado 2-8°C, Ambiente, Congelado"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Vida Útil (meses)</label>
                  <input
                    type="number"
                    value={especData.proceso_elaboracion.vida_util_meses}
                    onChange={(e) => setEspecData(prev => ({
                      ...prev,
                      proceso_elaboracion: { ...prev.proceso_elaboracion, vida_util_meses: parseInt(e.target.value) || 12 }
                    }))}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-3">5. Establecimiento Elaborador</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">RNE (si ya cuenta)</label>
                <input
                  type="text"
                  value={especData.establecimiento_elaborador.rne || ''}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    establecimiento_elaborador: { ...prev.establecimiento_elaborador, rne: e.target.value }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Número de RNE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dirección del Establecimiento</label>
                <input
                  type="text"
                  value={especData.establecimiento_elaborador.direccion}
                  onChange={(e) => setEspecData(prev => ({
                    ...prev,
                    establecimiento_elaborador: { ...prev.establecimiento_elaborador, direccion: e.target.value }
                  }))}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Dirección completa"
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
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 font-medium"
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
