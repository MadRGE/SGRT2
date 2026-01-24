import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Percent, Save, TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface ConfigMargen {
  id: number;
  categoria: string;
  margen_minimo: number;
  margen_objetivo: number;
  activo: boolean;
  notas: string | null;
}

const CATEGORIAS_LABELS: Record<string, string> = {
  honorarios: 'Honorarios Profesionales',
  tasas: 'Tasas y Aranceles Oficiales',
  analisis: 'Análisis y Certificaciones',
  otros: 'Otros Servicios'
};

export default function ConfiguracionMargenes({ onBack }: Props) {
  const [configs, setConfigs] = useState<ConfigMargen[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadConfiguraciones();
  }, []);

  const loadConfiguraciones = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('configuracion_margenes')
      .select('*')
      .order('id');

    if (data) {
      setConfigs(data);
    }

    setLoading(false);
  };

  const handleActualizarConfig = async (id: number, campo: keyof ConfigMargen, valor: any) => {
    const newConfigs = configs.map(c =>
      c.id === id ? { ...c, [campo]: valor } : c
    );
    setConfigs(newConfigs);
  };

  const handleGuardar = async (id: number) => {
    setSaving(true);

    const config = configs.find(c => c.id === id);
    if (!config) return;

    const { error } = await supabase
      .from('configuracion_margenes')
      .update({
        margen_minimo: config.margen_minimo,
        margen_objetivo: config.margen_objetivo,
        notas: config.notas,
        activo: config.activo
      })
      .eq('id', id);

    if (error) {
      alert('Error al guardar configuración: ' + error.message);
    } else {
      setEditando({ ...editando, [id]: false });
    }

    setSaving(false);
  };

  const getCategoriaLabel = (categoria: string) => {
    return CATEGORIAS_LABELS[categoria] || categoria;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Configuración de Márgenes</h1>
          <p className="text-slate-600">
            Define los márgenes mínimos y objetivo para cada categoría de servicio
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">¿Cómo funcionan los márgenes?</p>
            <ul className="list-disc ml-4 space-y-1">
              <li><strong>Margen Mínimo:</strong> Porcentaje por debajo del cual se mostrará alerta roja en las cotizaciones</li>
              <li><strong>Margen Objetivo:</strong> Porcentaje recomendado que se aplicará por defecto al calcular precios</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          {configs.map((config) => (
            <div
              key={config.id}
              className="border border-slate-200 rounded-lg p-6 bg-slate-50"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">
                    {getCategoriaLabel(config.categoria)}
                  </h3>
                  <p className="text-sm text-slate-600 capitalize">{config.categoria}</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={config.activo}
                      onChange={(e) => handleActualizarConfig(config.id, 'activo', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Activo
                  </label>
                  {editando[config.id] ? (
                    <button
                      onClick={() => handleGuardar(config.id)}
                      disabled={saving}
                      className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditando({ ...editando, [config.id]: true })}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-red-600" />
                    Margen Mínimo Aceptable
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={config.margen_minimo}
                      onChange={(e) => handleActualizarConfig(config.id, 'margen_minimo', Number(e.target.value))}
                      disabled={!editando[config.id]}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 text-lg font-semibold"
                    />
                    <span className="text-2xl font-bold text-slate-700">%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Se mostrará alerta roja si el margen está por debajo de este valor
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Margen Objetivo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="200"
                      step="0.1"
                      value={config.margen_objetivo}
                      onChange={(e) => handleActualizarConfig(config.id, 'margen_objetivo', Number(e.target.value))}
                      disabled={!editando[config.id]}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 text-lg font-semibold"
                    />
                    <span className="text-2xl font-bold text-slate-700">%</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Este porcentaje se aplicará por defecto al calcular precios
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notas / Observaciones
                </label>
                <textarea
                  value={config.notas || ''}
                  onChange={(e) => handleActualizarConfig(config.id, 'notas', e.target.value)}
                  disabled={!editando[config.id]}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  placeholder="Notas adicionales sobre esta configuración..."
                />
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  <strong>Ejemplo:</strong> Si el costo es $100 y el margen objetivo es {config.margen_objetivo}%,
                  el precio sugerido será: ${(100 * (1 + config.margen_objetivo / 100)).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Recomendaciones para Márgenes Saludables
          </h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span>Honorarios profesionales: 30-50% permite cubrir costos operativos y generar rentabilidad</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span>Tasas oficiales: 15-30% compensa gestión administrativa y riesgo de variaciones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span>Análisis y certificaciones: 20-40% cubre coordinación y seguimiento especializado</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">•</span>
              <span>Considera tus costos fijos mensuales al definir los márgenes mínimos</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
