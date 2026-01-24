import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Feather, AlertTriangle, CheckCircle, Tag } from 'lucide-react';

interface Props {
  expedienteId: string;
}

interface CITESData {
  apendice_cites: 'I' | 'II' | 'III' | null;
  especie_nombre_cientifico: string;
  permiso_cites_origen_nro: string;
  permiso_cites_argentina_nro: string;
  etiquetas_en_custodia: boolean;
}

export function ModuloCITES({ expedienteId }: Props) {
  const [data, setData] = useState<CITESData>({
    apendice_cites: null,
    especie_nombre_cientifico: '',
    permiso_cites_origen_nro: '',
    permiso_cites_argentina_nro: '',
    etiquetas_en_custodia: false
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

    if (expediente?.metadata?.cites) {
      setData(expediente.metadata.cites);
    }

    setLoading(false);
  };

  const saveData = async (newData: CITESData) => {
    setSaving(true);

    const { data: expediente } = await supabase
      .from('expedientes')
      .select('metadata')
      .eq('id', expedienteId)
      .single();

    const updatedMetadata = {
      ...(expediente?.metadata || {}),
      cites: newData
    };

    await supabase
      .from('expedientes')
      .update({ metadata: updatedMetadata })
      .eq('id', expedienteId);

    setSaving(false);
  };

  const handleUpdate = (field: keyof CITESData, value: any) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    saveData(newData);
  };

  const apendiceInfo = useMemo(() => {
    switch (data.apendice_cites) {
      case 'I':
        return {
          icono: <AlertTriangle className="w-5 h-5 text-red-600" />,
          titulo: 'Apéndice I - Máxima Protección',
          texto:
            'Requiere permisos de exportación E importación. El comercio comercial está generalmente prohibido.',
          color: 'border-red-300 bg-red-50'
        };
      case 'II':
        return {
          icono: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
          titulo: 'Apéndice II - Protección Media',
          texto:
            'Requiere permiso de exportación del país de origen. Es el más común para trofeos de caza.',
          color: 'border-yellow-300 bg-yellow-50'
        };
      case 'III':
        return {
          icono: <CheckCircle className="w-5 h-5 text-blue-600" />,
          titulo: 'Apéndice III - Protección Nacional',
          texto:
            'Requiere certificado de origen legal o permiso de exportación del país que la listó.',
          color: 'border-blue-300 bg-blue-50'
        };
      default:
        return null;
    }
  }, [data.apendice_cites]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            <Feather className="inline w-5 h-5 mr-2 text-yellow-700" />
            Clasificación CITES
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Especie (Nombre Científico)
              </label>
              <input
                type="text"
                value={data.especie_nombre_cientifico}
                onChange={(e) => handleUpdate('especie_nombre_cientifico', e.target.value)}
                placeholder="Ej: Panthera leo"
                className="w-full p-2 border border-slate-300 rounded-md"
                disabled={saving}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Apéndice CITES
              </label>
              <select
                value={data.apendice_cites || ''}
                onChange={(e) => handleUpdate('apendice_cites', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md bg-white"
                disabled={saving}
              >
                <option value="" disabled>
                  Seleccionar Apéndice...
                </option>
                <option value="I">Apéndice I</option>
                <option value="II">Apéndice II</option>
                <option value="III">Apéndice III</option>
              </select>
            </div>
            {apendiceInfo && (
              <div
                className={`flex items-start space-x-3 p-4 rounded-md border ${apendiceInfo.color}`}
              >
                <div className="flex-shrink-0 mt-0.5">{apendiceInfo.icono}</div>
                <div>
                  <h5 className="font-semibold text-slate-900">{apendiceInfo.titulo}</h5>
                  <p className="text-sm text-slate-700 mt-1">{apendiceInfo.texto}</p>
                </div>
              </div>
            )}
          </div>
          {saving && <p className="text-xs text-slate-500 mt-2">Guardando...</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Gestión de Permisos</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                N° Permiso CITES (Origen)
              </label>
              <input
                type="text"
                value={data.permiso_cites_origen_nro}
                onChange={(e) => handleUpdate('permiso_cites_origen_nro', e.target.value)}
                placeholder="Ej: ZA-2024-1234"
                className="w-full p-2 border border-slate-300 rounded-md"
                disabled={saving}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                N° Permiso CITES (Argentina)
              </label>
              <input
                type="text"
                value={data.permiso_cites_argentina_nro}
                onChange={(e) => handleUpdate('permiso_cites_argentina_nro', e.target.value)}
                placeholder="Ej: AR-2025-CITES-789"
                className="w-full p-2 border border-slate-300 rounded-md"
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            <Tag className="inline w-5 h-5 mr-2 text-blue-600" />
            Cierre y Custodia de Etiquetas
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Confirma la recepción y archivo físico de las etiquetas CITES originales, que es un
            paso final obligatorio.
          </p>
          <label
            htmlFor="etiquetas_custodia"
            className={`flex items-center p-4 border rounded-md cursor-pointer transition-colors ${
              data.etiquetas_en_custodia
                ? 'bg-green-50 border-green-300'
                : 'hover:bg-slate-50 border-slate-200'
            }`}
          >
            <input
              type="checkbox"
              id="etiquetas_custodia"
              checked={data.etiquetas_en_custodia}
              onChange={(e) => handleUpdate('etiquetas_en_custodia', e.target.checked)}
              disabled={saving}
              className="h-5 w-5 text-blue-600 border-slate-300 rounded"
            />
            <span className="ml-3 font-medium text-slate-800">
              Etiquetas CITES físicas recibidas y en custodia
            </span>
          </label>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="font-semibold text-yellow-900 mb-2">Información Normativa</h4>
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Los permisos CITES requieren evaluación caso por caso según el
            Apéndice de protección de la especie y el país de origen/destino.
          </p>
          <p className="text-xs text-yellow-700 mt-2">
            Base Legal: Convención CITES (Ley 22.421, Res. 299/2021)
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-600">
            <strong>Estado del Módulo:</strong> Los datos se guardan automáticamente en el campo
            metadata del expediente.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ModuloCITES;
