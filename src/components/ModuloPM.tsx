import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  HeartPulse, FileText, CheckCircle, Globe, FlaskConical, Languages
} from 'lucide-react';

interface Props {
  expedienteId: string;
}

interface PMData {
  clase_riesgo: 'I' | 'II' | 'III' | 'IV' | null;
  requisitos: {
    ficha_tecnica: boolean;
    iso_13485: boolean;
    cfs: boolean;
    ensayos: boolean;
    traduccion: boolean;
  };
}

export function ModuloPM({ expedienteId }: Props) {
  const [data, setData] = useState<PMData>({
    clase_riesgo: null,
    requisitos: {
      ficha_tecnica: false,
      iso_13485: false,
      cfs: false,
      ensayos: false,
      traduccion: false
    }
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

    if (expediente?.metadata?.anmat_pm) {
      setData(expediente.metadata.anmat_pm);
    }

    setLoading(false);
  };

  const saveData = async (newData: PMData) => {
    setSaving(true);

    const { data: expediente } = await supabase
      .from('expedientes')
      .select('metadata')
      .eq('id', expedienteId)
      .single();

    const updatedMetadata = {
      ...(expediente?.metadata || {}),
      anmat_pm: newData
    };

    await supabase
      .from('expedientes')
      .update({ metadata: updatedMetadata })
      .eq('id', expedienteId);

    setSaving(false);
  };

  const handleClaseChange = (value: string) => {
    const nuevaClase = value as PMData['clase_riesgo'];
    const newData = { ...data, clase_riesgo: nuevaClase };
    setData(newData);
    saveData(newData);
  };

  const handleRequisitoToggle = (requisito: keyof PMData['requisitos']) => {
    const newData = {
      ...data,
      requisitos: {
        ...data.requisitos,
        [requisito]: !data.requisitos[requisito]
      }
    };
    setData(newData);
    saveData(newData);
  };

  const getTiempoEstimado = (clase: PMData['clase_riesgo']) => {
    if (clase === 'I' || clase === 'II') {
      return '30-45 días hábiles';
    }
    if (clase === 'III' || clase === 'IV') {
      return '60-120 días hábiles';
    }
    return 'N/A';
  };

  const checklistTecnico = [
    { id: 'ficha_tecnica', label: 'Ficha técnica y manual de uso', icon: FileText },
    { id: 'iso_13485', label: 'Certificado ISO 13485 del fabricante', icon: CheckCircle },
    { id: 'cfs', label: 'CFS (Autoridad Sanitaria Origen)', icon: Globe },
    {
      id: 'ensayos',
      label: 'Informe de Ensayos (Biocompatibilidad, Eléctricos, etc.)',
      icon: FlaskConical
    },
    { id: 'traduccion', label: 'Traducción legalizada al español', icon: Languages }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-3">
            Clasificación de Riesgo (Disp. 2318/02)
          </h4>
          <select
            value={data.clase_riesgo || ''}
            onChange={(e) => handleClaseChange(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-md bg-white"
            disabled={saving}
          >
            <option value="" disabled>
              Seleccionar Clase...
            </option>
            <option value="I">Clase I (Bajo Riesgo)</option>
            <option value="II">Clase II (Riesgo Moderado)</option>
            <option value="III">Clase III (Alto Riesgo)</option>
            <option value="IV">Clase IV (Riesgo Crítico)</option>
          </select>
          {saving && <p className="text-xs text-slate-500 mt-2">Guardando...</p>}
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-lg shadow-sm border border-teal-200">
          <h4 className="font-semibold text-teal-900 mb-3">Tiempos de Evaluación Estimados</h4>
          {data.clase_riesgo ? (
            <div className="text-center">
              <p className="text-3xl font-bold text-teal-700">
                {getTiempoEstimado(data.clase_riesgo)}
              </p>
              <p className="text-sm text-teal-700 mt-2">
                Según Clase de Riesgo {data.clase_riesgo}
              </p>
            </div>
          ) : (
            <p className="text-sm text-teal-700">
              Seleccione una clase de riesgo para ver el tiempo estimado.
            </p>
          )}
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <p className="text-xs text-teal-800">
            <strong>Normativa:</strong> Disposición ANMAT 2318/02 establece los requisitos para
            registro de productos médicos según su clase de riesgo.
          </p>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            <HeartPulse className="inline w-5 h-5 mr-2 text-teal-600" />
            Checklist Técnico ANMAT-PM
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Seguimiento de requisitos técnicos obligatorios para el registro según la Disp. 2318/02.
          </p>
          <div className="space-y-3">
            {checklistTecnico.map((req) => {
              const isChecked = data.requisitos[req.id as keyof typeof data.requisitos];
              const Icon = req.icon;
              return (
                <label
                  key={req.id}
                  htmlFor={req.id}
                  className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-green-50 border-green-300'
                      : 'hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    id={req.id}
                    checked={isChecked}
                    onChange={() => handleRequisitoToggle(req.id as keyof typeof data.requisitos)}
                    disabled={saving}
                    className="h-5 w-5 text-teal-600 border-slate-300 rounded"
                  />
                  <Icon
                    className={`w-5 h-5 mx-3 ${isChecked ? 'text-green-700' : 'text-slate-500'}`}
                  />
                  <span
                    className={`flex-1 text-sm ${
                      isChecked ? 'text-green-900 font-medium' : 'text-slate-700'
                    }`}
                  >
                    {req.label}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-700">
              <strong>Progreso:</strong>{' '}
              {Object.values(data.requisitos).filter(Boolean).length} de {checklistTecnico.length}{' '}
              requisitos completados
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    (Object.values(data.requisitos).filter(Boolean).length /
                      checklistTecnico.length) *
                    100
                  }%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModuloPM;
