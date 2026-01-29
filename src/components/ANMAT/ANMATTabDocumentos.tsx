import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Download,
  Trash2,
  Calendar
} from 'lucide-react';

interface Props {
  casoId: string;
  tramiteCatalogoId?: string;
}

interface Documento {
  id: string;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  requerido: boolean;
  estado: string;
  archivo_url: string | null;
  archivo_nombre: string | null;
  fecha_solicitud: string | null;
  fecha_recepcion: string | null;
  fecha_validacion: string | null;
  tiene_vencimiento: boolean;
  fecha_vencimiento: string | null;
  comentario_validacion: string | null;
  familia: {
    numero_familia: number;
    nombre: string | null;
  } | null;
}

interface DocumentoRequerido {
  id: string;
  nombre: string;
  descripcion: string | null;
  obligatorio: boolean;
}

const ESTADOS_DOC: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDIENTE: { label: 'Pendiente', color: 'text-slate-700', bg: 'bg-slate-100', icon: Clock },
  SOLICITADO: { label: 'Solicitado', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock },
  RECIBIDO: { label: 'Recibido', color: 'text-cyan-700', bg: 'bg-cyan-100', icon: FileText },
  EN_REVISION: { label: 'En Revisión', color: 'text-purple-700', bg: 'bg-purple-100', icon: Eye },
  VALIDADO: { label: 'Validado', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  RECHAZADO: { label: 'Rechazado', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  OBSERVADO: { label: 'Observado', color: 'text-orange-700', bg: 'bg-orange-100', icon: AlertTriangle }
};

export function ANMATTabDocumentos({ casoId, tramiteCatalogoId }: Props) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [docsRequeridos, setDocsRequeridos] = useState<DocumentoRequerido[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [familias, setFamilias] = useState<{ id: string; numero_familia: number; nombre: string | null }[]>([]);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    familia_id: '',
    requerido: true,
    tiene_vencimiento: false,
    fecha_vencimiento: ''
  });

  useEffect(() => {
    loadDocumentos();
    loadFamilias();
    if (tramiteCatalogoId) {
      loadDocsRequeridos();
    }
  }, [casoId, tramiteCatalogoId]);

  const loadDocumentos = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('anmat_documentos')
      .select(`
        *,
        familia:anmat_familias(numero_familia, nombre)
      `)
      .eq('caso_id', casoId)
      .order('codigo');

    if (error) {
      console.error('Error loading documentos:', error);
    } else {
      setDocumentos(data as any);
    }

    setLoading(false);
  };

  const loadFamilias = async () => {
    const { data } = await supabase
      .from('anmat_familias')
      .select('id, numero_familia, nombre')
      .eq('caso_id', casoId)
      .order('numero_familia');

    if (data) setFamilias(data);
  };

  const loadDocsRequeridos = async () => {
    if (!tramiteCatalogoId) return;

    const { data } = await supabase
      .from('tramites_documentos_req')
      .select('id, nombre, descripcion, obligatorio')
      .eq('tramite_catalogo_id', tramiteCatalogoId)
      .order('orden');

    if (data) setDocsRequeridos(data);
  };

  const handleGenerarChecklist = async () => {
    if (docsRequeridos.length === 0) {
      alert('No hay documentos requeridos configurados para este tipo de trámite');
      return;
    }

    const docsToInsert = docsRequeridos.map((doc, index) => ({
      caso_id: casoId,
      documento_req_id: doc.id,
      codigo: `DOC-${String(index + 1).padStart(3, '0')}`,
      nombre: doc.nombre,
      descripcion: doc.descripcion,
      requerido: doc.obligatorio,
      estado: 'PENDIENTE'
    }));

    const { error } = await supabase
      .from('anmat_documentos')
      .insert(docsToInsert);

    if (error) {
      alert('Error al generar checklist: ' + error.message);
    } else {
      loadDocumentos();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextCodigo = `DOC-${String(documentos.length + 1).padStart(3, '0')}`;

    const { error } = await supabase
      .from('anmat_documentos')
      .insert([{
        caso_id: casoId,
        codigo: nextCodigo,
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        familia_id: formData.familia_id || null,
        requerido: formData.requerido,
        tiene_vencimiento: formData.tiene_vencimiento,
        fecha_vencimiento: formData.fecha_vencimiento || null,
        estado: 'PENDIENTE'
      }]);

    if (error) {
      alert('Error al crear: ' + error.message);
    } else {
      resetForm();
      loadDocumentos();
    }
  };

  const handleChangeEstado = async (docId: string, nuevoEstado: string) => {
    const updateData: any = { estado: nuevoEstado };

    if (nuevoEstado === 'VALIDADO') {
      updateData.fecha_validacion = new Date().toISOString();
    }

    const { error } = await supabase
      .from('anmat_documentos')
      .update(updateData)
      .eq('id', docId);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      loadDocumentos();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return;

    const { error } = await supabase
      .from('anmat_documentos')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      loadDocumentos();
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      familia_id: '',
      requerido: true,
      tiene_vencimiento: false,
      fecha_vencimiento: ''
    });
    setShowForm(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const isVencido = (fecha: string | null) => {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  };

  const isPorVencer = (fecha: string | null) => {
    if (!fecha) return false;
    const vencimiento = new Date(fecha);
    const hoy = new Date();
    const diff = (vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Stats
  const totalDocs = documentos.length;
  const docsPendientes = documentos.filter(d => d.estado === 'PENDIENTE' || d.estado === 'SOLICITADO').length;
  const docsValidados = documentos.filter(d => d.estado === 'VALIDADO').length;
  const docsObservados = documentos.filter(d => d.estado === 'OBSERVADO' || d.estado === 'RECHAZADO').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Documentación</h3>
          <p className="text-sm text-slate-600">
            {docsValidados} de {totalDocs} documentos validados
          </p>
        </div>
        <div className="flex gap-2">
          {docsRequeridos.length > 0 && documentos.length === 0 && (
            <button
              onClick={handleGenerarChecklist}
              className="flex items-center gap-2 border border-teal-600 text-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generar Checklist
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Documento
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalDocs > 0 && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Progreso de documentación</span>
            <span className="font-medium">{Math.round((docsValidados / totalDocs) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${(docsValidados / totalDocs) * 100}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
              Pendientes: {docsPendientes}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Validados: {docsValidados}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Observados: {docsObservados}
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h4 className="font-semibold text-slate-800 mb-4">Nuevo Documento</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: Certificado de Migración Global"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Familia (opcional)</label>
                <select
                  value={formData.familia_id}
                  onChange={(e) => setFormData({ ...formData, familia_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">General (todo el caso)</option>
                  {familias.map(fam => (
                    <option key={fam.id} value={fam.id}>
                      F{fam.numero_familia} - {fam.nombre || 'Sin nombre'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento</label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    fecha_vencimiento: e.target.value,
                    tiene_vencimiento: !!e.target.value 
                  })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requerido"
                checked={formData.requerido}
                onChange={(e) => setFormData({ ...formData, requerido: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <label htmlFor="requerido" className="text-sm text-slate-700">Documento obligatorio</label>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                Agregar
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents List */}
      {documentos.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No hay documentos cargados</p>
          {docsRequeridos.length > 0 && (
            <p className="text-sm text-slate-500 mt-1">
              Usa "Generar Checklist" para crear la lista de documentos requeridos
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {documentos.map(doc => {
            const estadoConfig = ESTADOS_DOC[doc.estado] || ESTADOS_DOC.PENDIENTE;
            const Icon = estadoConfig.icon;
            const vencido = isVencido(doc.fecha_vencimiento);
            const porVencer = isPorVencer(doc.fecha_vencimiento);

            return (
              <div
                key={doc.id}
                className={`bg-white border rounded-lg p-4 ${
                  vencido ? 'border-red-300 bg-red-50' : porVencer ? 'border-yellow-300 bg-yellow-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${estadoConfig.bg}`}>
                      <Icon className={`w-5 h-5 ${estadoConfig.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900">{doc.nombre}</h4>
                        {doc.requerido && (
                          <span className="text-xs text-red-600">*</span>
                        )}
                        {doc.familia && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            F{doc.familia.numero_familia}
                          </span>
                        )}
                      </div>
                      {doc.descripcion && (
                        <p className="text-sm text-slate-600 mt-1">{doc.descripcion}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        {doc.codigo && <span className="font-mono">{doc.codigo}</span>}
                        {doc.fecha_vencimiento && (
                          <span className={`flex items-center gap-1 ${vencido ? 'text-red-600' : porVencer ? 'text-yellow-600' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            Vence: {formatDate(doc.fecha_vencimiento)}
                            {vencido && ' (VENCIDO)'}
                            {porVencer && !vencido && ' (Por vencer)'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={doc.estado}
                      onChange={(e) => handleChangeEstado(doc.id, e.target.value)}
                      className={`text-xs border rounded px-2 py-1 ${estadoConfig.bg} ${estadoConfig.color}`}
                    >
                      {Object.entries(ESTADOS_DOC).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    {doc.archivo_url && (
                      <a
                        href={doc.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
