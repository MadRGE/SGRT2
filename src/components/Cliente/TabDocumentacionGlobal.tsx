import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FileText, Calendar, Trash2, Download, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ClienteDocumento {
  id: string;
  tipo_documento: string;
  url_archivo: string;
  nombre_archivo: string;
  fecha_vencimiento: string | null;
  created_at: string;
}

interface TabDocumentacionGlobalProps {
  clienteId: string;
}

export const TabDocumentacionGlobal: React.FC<TabDocumentacionGlobalProps> = ({ clienteId }) => {
  const [documentos, setDocumentos] = useState<ClienteDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    tipo_documento: '',
    fecha_vencimiento: '',
    archivo: null as File | null
  });

  const tiposDocumento = [
    'Estatuto Social',
    'Constancia CUIT',
    'Constancia AFIP',
    'Poder Legal',
    'DNI/CUIT Representante',
    'Inscripción IIBB',
    'Certificado Habilitación',
    'Otro'
  ];

  useEffect(() => {
    fetchDocumentos();
  }, [clienteId]);

  const fetchDocumentos = async () => {
    try {
      const { data, error } = await supabase
        .from('cliente_documentos')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocumentos(data || []);
    } catch (error) {
      console.error('Error fetching documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, archivo: e.target.files[0] });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.archivo || !formData.tipo_documento) return;

    setUploading(true);
    try {
      const fileExt = formData.archivo.name.split('.').pop();
      const fileName = `${clienteId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos-clientes')
        .upload(fileName, formData.archivo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documentos-clientes')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('cliente_documentos')
        .insert({
          cliente_id: clienteId,
          tipo_documento: formData.tipo_documento,
          url_archivo: publicUrl,
          nombre_archivo: formData.archivo.name,
          fecha_vencimiento: formData.fecha_vencimiento || null
        });

      if (insertError) throw insertError;

      await fetchDocumentos();
      setShowUploadForm(false);
      setFormData({ tipo_documento: '', fecha_vencimiento: '', archivo: null });
    } catch (error) {
      console.error('Error uploading documento:', error);
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    if (!confirm('¿Está seguro de eliminar este documento?')) return;

    try {
      const fileName = url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('documentos-clientes')
          .remove([`${clienteId}/${fileName}`]);
      }

      const { error } = await supabase
        .from('cliente_documentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Documento eliminado');
      await fetchDocumentos();
    } catch (error) {
      console.error('Error deleting documento:', error);
      toast.error('Error al eliminar el documento');
    }
  };

  const isVencido = (fecha: string | null) => {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  };

  const isPorVencer = (fecha: string | null) => {
    if (!fecha) return false;
    const days = Math.floor((new Date(fecha).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 30;
  };

  if (loading) {
    return <div className="text-center py-8">Cargando documentación...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Documentación Global del Cliente</h3>
          <p className="text-sm text-gray-600 mt-1">
            Documentos corporativos y legales del cliente (estatutos, poderes, constancias, etc.)
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Subir Documento
        </button>
      </div>

      {showUploadForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Nuevo Documento</h4>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Documento *
              </label>
              <select
                value={formData.tipo_documento}
                onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccione un tipo</option>
                {tiposDocumento.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo *
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento (opcional)
              </label>
              <input
                type="date"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Subiendo...' : 'Subir Documento'}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {documentos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No hay documentos cargados</p>
          <p className="text-sm text-gray-500 mt-1">
            Suba los documentos corporativos y legales del cliente
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documentos.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white p-4 rounded-lg border ${
                isVencido(doc.fecha_vencimiento)
                  ? 'border-red-300 bg-red-50'
                  : isPorVencer(doc.fecha_vencimiento)
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{doc.tipo_documento}</h4>
                    <p className="text-sm text-gray-600 mt-1">{doc.nombre_archivo}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        Subido: {new Date(doc.created_at).toLocaleDateString('es-AR')}
                      </span>
                      {doc.fecha_vencimiento && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Vence: {new Date(doc.fecha_vencimiento).toLocaleDateString('es-AR')}
                          {isVencido(doc.fecha_vencimiento) && (
                            <span className="ml-2 text-red-600 font-semibold">VENCIDO</span>
                          )}
                          {isPorVencer(doc.fecha_vencimiento) && (
                            <span className="ml-2 text-yellow-600 font-semibold">POR VENCER</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.url_archivo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id, doc.url_archivo)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
