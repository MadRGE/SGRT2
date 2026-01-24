import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  FileText, CheckCircle, AlertCircle, XCircle, Upload, Paperclip, Eye, Trash2, Wand2
} from 'lucide-react';
import { formularioService } from '../services/FormularioService';

interface Props {
  expedienteId: string;
  tramiteTipoId: string;
  esCliente?: boolean;
}

interface ChecklistItem {
  id: number;
  item: string;
  obligatorio: boolean;
  responsable: string;
  grupo: string | null;
}

interface Documento {
  id: string;
  checklist_item_id: number | null;
  nombre: string;
  estado: string;
  url_archivo: string | null;
}

export function ChecklistMaestro({ expedienteId, tramiteTipoId, esCliente = false }: Props) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [expedienteId, tramiteTipoId]);

  const loadData = async () => {
    setLoading(true);

    const { data: checklistData } = await supabase
      .from('tramite_checklists')
      .select('*')
      .eq('tramite_tipo_id', tramiteTipoId)
      .order('id');

    if (checklistData) setChecklist(checklistData);

    const { data: documentosData } = await supabase
      .from('documentos')
      .select('*')
      .eq('expediente_id', expedienteId);

    if (documentosData) setDocumentos(documentosData);

    setLoading(false);
  };

  const grupos = useMemo(() => {
    return checklist.reduce((acc, item) => {
      const grupo = item.grupo || 'General';
      if (!acc[grupo]) {
        acc[grupo] = [];
      }
      acc[grupo].push(item);
      return acc;
    }, {} as Record<string, ChecklistItem[]>);
  }, [checklist]);

  const getDocumentoParaItem = (itemId: number) => {
    return documentos.find((d) => d.checklist_item_id === itemId);
  };

  const handleSubirArchivo = (checklistItemId: number) => {
    alert(`Funcionalidad de subida de archivo para item ${checklistItemId} (por implementar)`);
  };

  const handleGenerarFormulario = async (checklistItemId: number) => {
    setGenerando(checklistItemId);
    try {
      const resultado = await formularioService.generarYVincularFormulario(
        expedienteId,
        checklistItemId,
        tramiteTipoId
      );

      alert(
        `Formulario generado exitosamente:\n\n` +
        `Plantilla: ${resultado.plantillaUsada}\n` +
        `Archivo: ${resultado.nombre}\n` +
        `Estado: En Revisión\n\n` +
        `El documento ha sido vinculado al checklist y está listo para su validación.`
      );

      await loadData();
    } catch (error: any) {
      alert(`Error al generar formulario: ${error.message}`);
    } finally {
      setGenerando(null);
    }
  };

  const puedeGenerarFormulario = async (checklistItemId: number): Promise<boolean> => {
    const config = await formularioService.obtenerConfiguracionFormulario(
      tramiteTipoId,
      checklistItemId
    );
    return config !== null;
  };

  const getIconoEstado = (estado: string) => {
    if (estado === 'aprobado') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (estado === 'revision') return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    if (estado === 'rechazado') return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertCircle className="w-5 h-5 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (checklist.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p>No hay checklist configurado para este tipo de trámite</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!esCliente && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-1">Checklist Maestro (Optimización #3)</h3>
          <p className="text-sm text-blue-700">
            Esta lista se genera automáticamente desde el catálogo de trámites
          </p>
        </div>
      )}

      {Object.entries(grupos).map(([grupoNombre, items]) => (
        <div key={grupoNombre}>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">{grupoNombre}</h3>
          <div className="space-y-3">
            {items.map((item) => {
              const doc = getDocumentoParaItem(item.id);
              const estado = doc ? doc.estado : 'pendiente';

              return (
                <div
                  key={item.id}
                  className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1 mb-3 md:mb-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getIconoEstado(estado)}
                        <span className="font-medium text-slate-900">{item.item}</span>
                        {item.obligatorio && (
                          <span className="text-xs font-bold text-red-600">(Obligatorio)</span>
                        )}
                      </div>
                      <span className="text-sm text-slate-500 capitalize ml-7">
                        Estado: {estado.replace('_', ' ')} | Responsable: {item.responsable}
                      </span>
                    </div>
                    {doc ? (
                      <div className="flex items-center space-x-2">
                        <Paperclip className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-blue-600 truncate max-w-xs">
                          {doc.nombre}
                        </span>
                        <button className="p-1 hover:bg-slate-100 rounded-full">
                          <Eye className="w-4 h-4 text-slate-600" />
                        </button>
                        {!esCliente && (
                          <button className="p-1 hover:bg-slate-100 rounded-full">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                        <button
                          onClick={() => handleSubirArchivo(item.id)}
                          className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md hover:bg-yellow-200"
                        >
                          Reemplazar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {!esCliente && (
                          <FormularioGeneratorButton
                            checklistItemId={item.id}
                            tramiteTipoId={tramiteTipoId}
                            onGenerar={handleGenerarFormulario}
                            isGenerating={generando === item.id}
                          />
                        )}
                        <button
                          onClick={() => handleSubirArchivo(item.id)}
                          className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Subir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface FormularioGeneratorButtonProps {
  checklistItemId: number;
  tramiteTipoId: string;
  onGenerar: (checklistItemId: number) => void;
  isGenerating: boolean;
}

function FormularioGeneratorButton({
  checklistItemId,
  tramiteTipoId,
  onGenerar,
  isGenerating
}: FormularioGeneratorButtonProps) {
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    const verificar = async () => {
      const config = await formularioService.obtenerConfiguracionFormulario(
        tramiteTipoId,
        checklistItemId
      );
      setDisponible(config !== null);
    };
    verificar();
  }, [tramiteTipoId, checklistItemId]);

  if (!disponible) return null;

  return (
    <button
      onClick={() => onGenerar(checklistItemId)}
      disabled={isGenerating}
      className={`flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
        isGenerating
          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
          : 'bg-emerald-600 text-white hover:bg-emerald-700'
      }`}
      title="Generar formulario automáticamente con datos del proyecto"
    >
      <Wand2 className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
      {isGenerating ? 'Generando...' : 'Generar'}
    </button>
  );
}
