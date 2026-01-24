import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, FileWarning, CheckSquare, Fingerprint } from 'lucide-react';

interface Props {
  expedienteId: string;
}

interface ANMACData {
  luc_numero: string;
  luc_vigente: boolean;
  autorizacion_importacion_nro: string;
  codigos_sigimac: string;
}

export function ModuloANMAC({ expedienteId }: Props) {
  const [data, setData] = useState<ANMACData>({
    luc_numero: '',
    luc_vigente: false,
    autorizacion_importacion_nro: '',
    codigos_sigimac: ''
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

    if (expediente?.metadata?.anmac) {
      setData(expediente.metadata.anmac);
    }

    setLoading(false);
  };

  const saveData = async (newData: ANMACData) => {
    setSaving(true);

    const { data: expediente } = await supabase
      .from('expedientes')
      .select('metadata')
      .eq('id', expedienteId)
      .single();

    const updatedMetadata = {
      ...(expediente?.metadata || {}),
      anmac: newData
    };

    await supabase
      .from('expedientes')
      .update({ metadata: updatedMetadata })
      .eq('id', expedienteId);

    setSaving(false);
  };

  const handleUpdate = (field: keyof ANMACData, value: any) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    saveData(newData);
  };

  const handleGenerarSigimac = () => {
    const cantidad = 50;
    const codigos = Array(cantidad)
      .fill(0)
      .map(
        (_, i) =>
          `SIGIMAC-2025-${expedienteId.substring(0, 4).toUpperCase()}-${String(i + 1).padStart(
            4,
            '0'
          )}`
      )
      .join('\n');
    handleUpdate('codigos_sigimac', codigos);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            <FileWarning className="inline w-5 h-5 mr-2 text-gray-700" />
            Habilitaciones Previas (Blockers)
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Requisitos obligatorios previos al trámite de importación/exportación.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2" htmlFor="luc_numero">
                N° Legítimo Usuario Comercial (LUC)
              </label>
              <input
                id="luc_numero"
                type="text"
                value={data.luc_numero}
                onChange={(e) => handleUpdate('luc_numero', e.target.value)}
                placeholder="Ej: LUC-COM-2024-789"
                className="w-full p-2 border border-slate-300 rounded-md"
                disabled={saving}
              />
            </div>
            <label
              htmlFor="luc_vigente"
              className={`flex items-center p-4 border rounded-md cursor-pointer transition-colors ${
                data.luc_vigente
                  ? 'bg-green-50 border-green-300'
                  : 'hover:bg-slate-50 border-slate-200'
              }`}
            >
              <input
                type="checkbox"
                id="luc_vigente"
                checked={data.luc_vigente}
                onChange={(e) => handleUpdate('luc_vigente', e.target.checked)}
                disabled={saving}
                className="h-5 w-5 text-blue-600 border-slate-300 rounded"
              />
              <span className="ml-3 font-medium text-slate-800">
                LUC Comercial Vigente (Blocker OK)
              </span>
            </label>
            {data.luc_vigente ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✓ Habilitación previa verificada. Se puede continuar con el trámite.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠ Atención: El LUC debe estar vigente antes de iniciar la importación.
                </p>
              </div>
            )}
          </div>
          {saving && <p className="text-xs text-slate-500 mt-2">Guardando...</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            <CheckSquare className="inline w-5 h-5 mr-2 text-blue-600" />
            Autorización de Importación
          </h3>
          <div>
            <label
              className="text-sm font-medium text-slate-700 block mb-2"
              htmlFor="aut_importacion"
            >
              N° Autorización Previa de Importación
            </label>
            <input
              id="aut_importacion"
              type="text"
              value={data.autorizacion_importacion_nro}
              onChange={(e) => handleUpdate('autorizacion_importacion_nro', e.target.value)}
              placeholder="Ej: AUT-2025-789"
              className="w-full p-2 border border-slate-300 rounded-md"
              disabled={saving}
            />
            <p className="text-xs text-slate-500 mt-2">
              Número de autorización emitido por ANMaC para esta operación específica.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-700 to-gray-900 text-white rounded-lg p-6">
          <h4 className="font-semibold mb-2">Información Normativa</h4>
          <p className="text-sm text-gray-200">
            <strong>Requisito:</strong> La empresa debe contar con LUC vigente y estar inscripta
            como importador/exportador en ANMaC.
          </p>
          <p className="text-xs text-gray-300 mt-2">
            Base Legal: Ley 12.709, Decreto 395/75, Res. ANMaC 28/21
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          <Fingerprint className="inline w-5 h-5 mr-2 text-gray-700" />
          Trazabilidad SIGIMAC
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Gestión de códigos de trazabilidad unitaria según Res. ANMaC 28/21. Cada unidad de
          material controlado debe tener un código único.
        </p>
        <button
          onClick={handleGenerarSigimac}
          disabled={saving}
          className="w-full bg-gray-700 text-white p-3 rounded-md mb-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          Simular Generación de Códigos SIGIMAC
        </button>
        <div>
          <label
            className="text-sm font-medium text-slate-700 block mb-2"
            htmlFor="codigos_sigimac"
          >
            Códigos SIGIMAC Generados
          </label>
          <textarea
            id="codigos_sigimac"
            rows={15}
            value={data.codigos_sigimac}
            readOnly
            className="w-full p-3 border border-slate-300 rounded-md bg-slate-50 font-mono text-xs"
            placeholder="Los códigos SIGIMAC generados aparecerán aquí..."
          />
          {data.codigos_sigimac && (
            <p className="text-xs text-slate-600 mt-2">
              {data.codigos_sigimac.split('\n').length} códigos generados
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModuloANMAC;
