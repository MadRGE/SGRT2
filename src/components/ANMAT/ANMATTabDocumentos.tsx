import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Download,
  Trash2,
  Calendar,
  List,
  Check
} from 'lucide-react';

interface Props {
  casoId: string;
  divisionCodigo?: string;
}

interface Documento {
  id: string;
  tipo_documento: string;
  nombre: string;
  archivo_url: string | null;
  archivo_nombre: string | null;
  estado: string;
  fecha_vencimiento: string | null;
  notas: string | null;
  created_at: string;
}

interface Requisito {
  id: string;
  nombre: string;
  descripcion: string | null;
  es_obligatorio: boolean;
  categoria: string | null;
  orden: number;
}

interface ChecklistItem {
  id: string;
  requisito_id: string;
  estado: string;
  notas: string | null;
  fecha_recepcion: string | null;
  requisito: Requisito;
}

const ESTADOS_DOC: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDIENTE: { label: 'Pendiente', color: 'text-slate-700', bg: 'bg-slate-100', icon: Clock },
  RECIBIDO: { label: 'Recibido', color: 'text-blue-700', bg: 'bg-blue-100', icon: FileText },
  APROBADO: { label: 'Aprobado', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  RECHAZADO: { label: 'Rechazado', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  NO_APLICA: { label: 'No Aplica', color: 'text-gray-500', bg: 'bg-gray-100', icon: Eye }
};

const CATEGORIAS: Record<string, { label: string; color: string }> = {
  LEGAL: { label: 'Legal', color: 'bg-blue-100 text-blue-700' },
  TECNICO: { label: 'Técnico', color: 'bg-purple-100 text-purple-700' },
  COMERCIAL: { label: 'Comercial', color: 'bg-green-100 text-green-700' },
  SANITARIO: { label: 'Sanitario', color: 'bg-orange-100 text-orange-700' }
};

export function ANMATTabDocumentos({ casoId, divisionCodigo }: Props) {
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [checklistGenerado, setChecklistGenerado] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    tipo_documento: '',
    fecha_vencimiento: '',
    notas: ''
  });

  useEffect(() => {
    loadData();
  }, [casoId, divisionCodigo]);

  const loadData = async () => {
    setLoading(true);

    // Cargar requisitos de la división
    if (divisionCodigo) {
      const { data: reqData } = await supabase
        .from('anmat_requisitos_documentos')
        .select('*')
        .eq('division_codigo', divisionCodigo)
        .eq('activo', true)
        .order('orden');

      if (reqData) setRequisitos(reqData);
    }

    // Cargar checklist existente
    const { data: checklistData } = await supabase
      .from('anmat_caso_documentos_checklist')
      .select(`
        *,
        requisito:anmat_requisitos_documentos(*)
      `)
      .eq('caso_id', casoId);

    if (checklistData && checklistData.length > 0) {
      setChecklist(checklistData as any);
      setChecklistGenerado(true);
    }

    // Cargar documentos adicionales
    const { data: docsData } = await supabase
      .from('anmat_documentos')
      .select('*')
      .eq('caso_id', casoId)
      .order('created_at', { ascending: false });

    if (docsData) setDocumentos(docsData);

    setLoading(false);
  };

  const handleGenerarChecklist = async () => {
    if (requisitos.length === 0) {
      alert('No hay requisitos configurados para esta división');
      return;
    }

    const itemsToInsert = requisitos.map(req => ({
      caso_id: casoId,
      requisito_id: req.id,
      estado: 'PENDIENTE'
    }));

    const { error } = await supabase
      .from('anmat_caso_documentos_checklist')
      .insert(itemsToInsert);

    if (error) {
      console.error('Error generando checklist:', error);
      alert('Error al generar checklist');
    } else {
      loadData();
    }
  };

  const handleUpdateChecklistItem = async (itemId: string, estado: string) => {
    const updateData: any = {
      estado,
      updated_at: new Date().toISOString()
    };

    if (estado === 'RECIBIDO') {
      updateData.fecha_recepcion = new Date().toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from('anmat_caso_documentos_checklist')
      .update(updateData)
      .eq('id', itemId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      loadData();
    }
  };

  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('anmat_documentos')
      .insert([{
        caso_id: casoId,
        tipo_documento: formData.tipo_documento || 'OTRO',
        nombre: formData.nombre,
        fecha_vencimiento: formData.fecha_vencimiento || null,
        notas: formData.notas || null,
        estado: 'PENDIENTE'
      }]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setFormData({ nombre: '', tipo_documento: '', fecha_vencimiento: '', notas: '' });
      setShowForm(false);
      loadData();
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return;

    const { error } = await supabase
      .from('anmat_documentos')
      .delete()
      .eq('id', id);

    if (!error) loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Stats del checklist
  const totalChecklist = checklist.length;
  const completados = checklist.filter(c => c.estado === 'RECIBIDO' || c.estado === 'APROBADO').length;
  const pendientes = checklist.filter(c => c.estado === 'PENDIENTE').length;
  const porcentaje = totalChecklist > 0 ? Math.round((completados / totalChecklist) * 100) : 0;

  // Agrupar checklist por categoría
  const checklistPorCategoria = checklist.reduce((acc, item) => {
    const cat = item.requisito?.categoria || 'OTRO';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Documentación Requerida</h3>
          <p className="text-sm text-slate-600">
            {checklistGenerado
              ? `${completados} de ${totalChecklist} documentos recibidos`
              : 'Genera el checklist para ver los requisitos'
            }
          </p>
        </div>
        <div className="flex gap-2">
          {!checklistGenerado && requisitos.length > 0 && (
            <button
              onClick={handleGenerarChecklist}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              <List className="w-4 h-4" />
              Generar Checklist ({requisitos.length} items)
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 border border-teal-600 text-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Documento Extra
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {checklistGenerado && totalChecklist > 0 && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Progreso de documentación</span>
            <span className="font-medium text-teal-600">{porcentaje}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-teal-500 h-3 rounded-full transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
              Pendientes: {pendientes}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              Recibidos: {completados}
            </span>
          </div>
        </div>
      )}

      {/* Checklist por Categoría */}
      {checklistGenerado && Object.keys(checklistPorCategoria).length > 0 && (
        <div className="space-y-4">
          {Object.entries(checklistPorCategoria).map(([categoria, items]) => {
            const catConfig = CATEGORIAS[categoria] || { label: categoria, color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={categoria} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className={`px-4 py-2 ${catConfig.color} font-medium text-sm`}>
                  {catConfig.label} ({items.length})
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map(item => {
                    const estadoConfig = ESTADOS_DOC[item.estado] || ESTADOS_DOC.PENDIENTE;
                    return (
                      <div key={item.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleUpdateChecklistItem(
                              item.id,
                              item.estado === 'RECIBIDO' ? 'PENDIENTE' : 'RECIBIDO'
                            )}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              item.estado === 'RECIBIDO' || item.estado === 'APROBADO'
                                ? 'bg-teal-500 border-teal-500 text-white'
                                : 'border-slate-300 hover:border-teal-400'
                            }`}
                          >
                            {(item.estado === 'RECIBIDO' || item.estado === 'APROBADO') && (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <div>
                            <p className={`text-sm ${
                              item.estado === 'RECIBIDO' || item.estado === 'APROBADO'
                                ? 'text-slate-500 line-through'
                                : 'text-slate-800'
                            }`}>
                              {item.requisito?.nombre}
                              {item.requisito?.es_obligatorio && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </p>
                            {item.requisito?.descripcion && (
                              <p className="text-xs text-slate-500">{item.requisito.descripcion}</p>
                            )}
                          </div>
                        </div>
                        <select
                          value={item.estado}
                          onChange={(e) => handleUpdateChecklistItem(item.id, e.target.value)}
                          className={`text-xs border rounded px-2 py-1 ${estadoConfig.bg} ${estadoConfig.color}`}
                        >
                          {Object.entries(ESTADOS_DOC).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sin checklist */}
      {!checklistGenerado && requisitos.length > 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
          <List className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Checklist no generado</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Hay {requisitos.length} documentos requeridos para esta división
          </p>
          <button
            onClick={handleGenerarChecklist}
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            <List className="w-4 h-4" />
            Generar Checklist
          </button>
        </div>
      )}

      {/* Sin requisitos configurados */}
      {!checklistGenerado && requisitos.length === 0 && (
        <div className="text-center py-8 bg-amber-50 rounded-lg border border-amber-200">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-amber-700 font-medium">Sin requisitos configurados</p>
          <p className="text-sm text-amber-600 mt-1">
            No hay documentos requeridos definidos para esta división
          </p>
        </div>
      )}

      {/* Form para documento extra */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h4 className="font-semibold text-slate-800 mb-4">Agregar Documento Extra</h4>
          <form onSubmit={handleSubmitDoc} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                  placeholder="Nombre del documento"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select
                  value={formData.tipo_documento}
                  onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                >
                  <option value="">Seleccionar...</option>
                  <option value="LEGAL">Legal</option>
                  <option value="TECNICO">Técnico</option>
                  <option value="COMERCIAL">Comercial</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vencimiento</label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                Agregar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documentos extras */}
      {documentos.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-800 mb-3">Documentos Adicionales</h4>
          <div className="space-y-2">
            {documentos.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{doc.nombre}</p>
                    {doc.fecha_vencimiento && (
                      <p className="text-xs text-slate-500">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Vence: {new Date(doc.fecha_vencimiento).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDoc(doc.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
