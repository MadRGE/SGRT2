import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Fire, FileWarning, FlaskConical, Plus, Trash2 } from 'lucide-react';

interface Props {
  expedienteId: string;
}

interface SustanciaCupo {
  id: string;
  nombre: string;
  lista: 'I' | 'II' | 'III';
  cupo_autorizado_kg: number;
  cupo_consumido_kg: number;
}

interface RENPREData {
  formularios: {
    f01_inscripcion: boolean;
    f02_sustancias: boolean;
    f05_autorizacion: boolean;
  };
  sustancias: SustanciaCupo[];
}

export function ModuloRENPRE({ expedienteId }: Props) {
  const [data, setData] = useState<RENPREData>({
    formularios: {
      f01_inscripcion: false,
      f02_sustancias: false,
      f05_autorizacion: false
    },
    sustancias: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [expedienteId]);

  const loadData = async () => {
    setLoading(true);

    const { data: expediente } = await supabase
      .from('expedientes')
      .select('metadata')
      .eq('id', expedienteId)
      .single();

    if (expediente?.metadata?.renpre) {
      setData(expediente.metadata.renpre);
    }

    setLoading(false);
  };

  const saveData = async (newData: RENPREData) => {
    setSaving(true);

    const { data: expediente } = await supabase
      .from('expedientes')
      .select('metadata')
      .eq('id', expedienteId)
      .single();

    const updatedMetadata = {
      ...(expediente?.metadata || {}),
      renpre: newData
    };

    await supabase
      .from('expedientes')
      .update({ metadata: updatedMetadata })
      .eq('id', expedienteId);

    setSaving(false);
  };

  const handleFormToggle = (form: keyof RENPREData['formularios']) => {
    const newData = {
      ...data,
      formularios: {
        ...data.formularios,
        [form]: !data.formularios[form]
      }
    };
    setData(newData);
    saveData(newData);
  };

  const handleUpdateSustancia = (id: string, field: keyof SustanciaCupo, value: any) => {
    const newData = {
      ...data,
      sustancias: data.sustancias.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    };
    setData(newData);
    saveData(newData);
  };

  const handleAddSustancia = () => {
    const nueva: SustanciaCupo = {
      id: `s-${Date.now()}`,
      nombre: 'Nueva Sustancia',
      lista: 'III',
      cupo_autorizado_kg: 0,
      cupo_consumido_kg: 0
    };
    const newData = {
      ...data,
      sustancias: [...data.sustancias, nueva]
    };
    setData(newData);
    saveData(newData);
  };

  const handleDeleteSustancia = (id: string) => {
    const newData = {
      ...data,
      sustancias: data.sustancias.filter((s) => s.id !== id)
    };
    setData(newData);
    saveData(newData);
  };

  const getListaColor = (lista: string) => {
    if (lista === 'I') return 'bg-red-100 text-red-800 border-red-300';
    if (lista === 'II') return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            <FileWarning className="inline w-5 h-5 mr-2 text-red-700" />
            Formularios RENPRE
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Gestión de formularios clave según Ley 26.045 y normativa SEDRONAR.
          </p>
          <div className="space-y-3">
            <label
              htmlFor="f01_inscripcion"
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                data.formularios.f01_inscripcion
                  ? 'bg-green-50 border-green-300'
                  : 'hover:bg-slate-50 border-slate-200'
              }`}
            >
              <input
                type="checkbox"
                id="f01_inscripcion"
                checked={data.formularios.f01_inscripcion}
                onChange={() => handleFormToggle('f01_inscripcion')}
                disabled={saving}
                className="h-5 w-5 text-blue-600 border-slate-300 rounded"
              />
              <span
                className={`ml-3 font-medium ${
                  data.formularios.f01_inscripcion ? 'text-green-900' : 'text-slate-800'
                }`}
              >
                Formulario 01 (Inscripción)
              </span>
            </label>
            <label
              htmlFor="f02_sustancias"
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                data.formularios.f02_sustancias
                  ? 'bg-green-50 border-green-300'
                  : 'hover:bg-slate-50 border-slate-200'
              }`}
            >
              <input
                type="checkbox"
                id="f02_sustancias"
                checked={data.formularios.f02_sustancias}
                onChange={() => handleFormToggle('f02_sustancias')}
                disabled={saving}
                className="h-5 w-5 text-blue-600 border-slate-300 rounded"
              />
              <span
                className={`ml-3 font-medium ${
                  data.formularios.f02_sustancias ? 'text-green-900' : 'text-slate-800'
                }`}
              >
                Formulario 02 (Sustancias)
              </span>
            </label>
            <label
              htmlFor="f05_autorizacion"
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                data.formularios.f05_autorizacion
                  ? 'bg-green-50 border-green-300'
                  : 'hover:bg-slate-50 border-slate-200'
              }`}
            >
              <input
                type="checkbox"
                id="f05_autorizacion"
                checked={data.formularios.f05_autorizacion}
                onChange={() => handleFormToggle('f05_autorizacion')}
                disabled={saving}
                className="h-5 w-5 text-blue-600 border-slate-300 rounded"
              />
              <span
                className={`ml-3 font-medium ${
                  data.formularios.f05_autorizacion ? 'text-green-900' : 'text-slate-800'
                }`}
              >
                Formulario F05 (Autorización I/E)
              </span>
            </label>
          </div>
          {saving && <p className="text-xs text-slate-500 mt-3">Guardando...</p>}

          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-700">
              <strong>Progreso:</strong>{' '}
              {Object.values(data.formularios).filter(Boolean).length} de 3 formularios completados
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 mt-6">
          <h4 className="font-semibold text-red-900 mb-2">Información Normativa</h4>
          <p className="text-sm text-red-800">
            <strong>Importante:</strong> La inscripción RENPRE debe renovarse anualmente. Los cupos
            se asignan por operación.
          </p>
          <p className="text-xs text-red-700 mt-2">
            Base Legal: Ley 26.045, Res. SEDRONAR 1095/21
          </p>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              <FlaskConical className="inline w-5 h-5 mr-2 text-red-700" />
              Gestión de Cupos y Sustancias
            </h3>
            <button
              onClick={handleAddSustancia}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              <Plus className="w-4 h-4" />
              Añadir Sustancia
            </button>
          </div>

          {data.sustancias.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FlaskConical className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>No hay sustancias registradas</p>
              <p className="text-sm mt-2">Haz clic en "Añadir Sustancia" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.sustancias.map((s) => {
                const porcentajeConsumo =
                  s.cupo_autorizado_kg > 0
                    ? (s.cupo_consumido_kg / s.cupo_autorizado_kg) * 100
                    : 0;
                const cupoDisponible = s.cupo_autorizado_kg - s.cupo_consumido_kg;

                return (
                  <div key={s.id} className="border border-slate-200 p-4 rounded-lg bg-slate-50">
                    <div className="flex justify-between items-start mb-3">
                      <input
                        type="text"
                        value={s.nombre}
                        onChange={(e) => handleUpdateSustancia(s.id, 'nombre', e.target.value)}
                        disabled={saving}
                        className="text-lg font-semibold p-2 border border-slate-300 rounded flex-1 mr-3"
                      />
                      <button
                        onClick={() => handleDeleteSustancia(s.id)}
                        disabled={saving}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Lista RENPRE
                        </label>
                        <select
                          value={s.lista}
                          onChange={(e) =>
                            handleUpdateSustancia(s.id, 'lista', e.target.value as 'I' | 'II' | 'III')
                          }
                          disabled={saving}
                          className={`w-full p-2 border rounded-md ${getListaColor(s.lista)}`}
                        >
                          <option value="I">Lista I (Máximo Control)</option>
                          <option value="II">Lista II</option>
                          <option value="III">Lista III (Bajo Control)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Cupo Autorizado (Kg)
                        </label>
                        <input
                          type="number"
                          value={s.cupo_autorizado_kg}
                          onChange={(e) =>
                            handleUpdateSustancia(
                              s.id,
                              'cupo_autorizado_kg',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={saving}
                          className="w-full p-2 border border-slate-300 rounded-md"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Cupo Consumido (Kg)
                        </label>
                        <input
                          type="number"
                          value={s.cupo_consumido_kg}
                          onChange={(e) =>
                            handleUpdateSustancia(
                              s.id,
                              'cupo_consumido_kg',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={saving}
                          className="w-full p-2 border border-slate-300 rounded-md"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Progreso del Cupo</span>
                          <span className="font-medium">
                            {cupoDisponible.toFixed(2)} kg disponibles
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden">
                          <div
                            className={`h-6 rounded-full text-xs text-white flex items-center justify-center font-medium transition-all ${
                              porcentajeConsumo >= 90
                                ? 'bg-red-600'
                                : porcentajeConsumo >= 70
                                ? 'bg-orange-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(porcentajeConsumo, 100)}%` }}
                          >
                            {porcentajeConsumo.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModuloRENPRE;
