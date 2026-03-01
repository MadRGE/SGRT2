import { useState } from 'react';
import { FileText, Plus, Upload, Download, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import { type DespachoDoc } from '../../services/DespachoService';
import { DESPACHO_DOC_TIPO_LABELS, DESPACHO_DOC_TIPOS } from '../../lib/constants/despacho';
import { DOC_ESTADO_LABELS, DOC_ESTADO_COLORS, DOC_ESTADO_NEXT } from '../../lib/constants/estados';
import NuevoDespachoDocModal from './NuevoDespachoDocModal';
import ConfirmDialog, { useConfirmDialog } from '../UI/ConfirmDialog';

interface Props {
  despachoId: string;
  docs: DespachoDoc[];
  onReload: () => void;
}

export default function DespachoDocumentosTab({ despachoId, docs, onReload }: Props) {
  const { confirm, dialogProps } = useConfirmDialog();
  const [showAddModal, setShowAddModal] = useState(false);

  const { uploadingDocId, uploadError, fileInputRef, triggerUpload, handleFileSelected, handleDownloadFile, handleRemoveFile } =
    useDocumentUpload({
      storagePath: `despachos/${despachoId}`,
      tableName: 'despacho_documentos',
      onSuccess: onReload,
    });

  const handleToggleEstado = async (doc: DespachoDoc) => {
    const next = DOC_ESTADO_NEXT[doc.estado] || 'pendiente';
    const { error } = await supabase
      .from('despacho_documentos')
      .update({ estado: next })
      .eq('id', doc.id);
    if (!error) {
      toast.success(`Estado actualizado a ${DOC_ESTADO_LABELS[next]}`);
      onReload();
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    const ok = await confirm({ message: '¿Eliminar este documento? Esta acción no se puede deshacer.', title: 'Eliminar documento' });
    if (!ok) return;
    const { error } = await supabase.from('despacho_documentos').delete().eq('id', docId);
    if (!error) {
      toast.success('Documento eliminado');
      onReload();
    }
  };

  const obligatorios = docs.filter((d) => d.obligatorio);
  const opcionales = docs.filter((d) => !d.obligatorio);
  const docsCompletos = docs.filter((d) => d.estado === 'aprobado' || d.archivo_path).length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{docsCompletos}</span> / {docs.length} documentos completos
          </div>
          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all"
              style={{ width: `${docs.length > 0 ? (docsCompletos / docs.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 text-sm bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Documento
        </button>
      </div>

      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{uploadError}</div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />

      {/* Obligatorios */}
      {obligatorios.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Documentos Obligatorios</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {obligatorios.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                uploading={uploadingDocId === doc.id}
                onToggleEstado={handleToggleEstado}
                onUpload={triggerUpload}
                onDownload={handleDownloadFile}
                onRemoveFile={handleRemoveFile}
                onDelete={handleDeleteDoc}
              />
            ))}
          </div>
        </div>
      )}

      {/* Opcionales */}
      {opcionales.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm">Documentos Adicionales</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {opcionales.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                uploading={uploadingDocId === doc.id}
                onToggleEstado={handleToggleEstado}
                onUpload={triggerUpload}
                onDownload={handleDownloadFile}
                onRemoveFile={handleRemoveFile}
                onDelete={handleDeleteDoc}
              />
            ))}
          </div>
        </div>
      )}

      {docs.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center">
          <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-slate-500 text-sm">No hay documentos cargados</p>
          <button onClick={() => setShowAddModal(true)} className="text-sm text-amber-600 font-medium mt-2 hover:underline">
            Agregar el primero
          </button>
        </div>
      )}

      <NuevoDespachoDocModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        despachoId={despachoId}
        onSuccess={() => { setShowAddModal(false); onReload(); }}
      />
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

// ── Doc Row Component ─────────────────────────────────────────────────────

function DocRow({
  doc, uploading, onToggleEstado, onUpload, onDownload, onRemoveFile, onDelete,
}: {
  doc: DespachoDoc;
  uploading: boolean;
  onToggleEstado: (doc: DespachoDoc) => void;
  onUpload: (id: string) => void;
  onDownload: (path: string, nombre: string) => void;
  onRemoveFile: (id: string, path: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-800 truncate">{doc.nombre}</span>
          {doc.obligatorio && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-700">REQ</span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5 ml-6">
          {DESPACHO_DOC_TIPO_LABELS[doc.tipo_documento] || doc.tipo_documento}
          {doc.archivo_nombre && ` · ${doc.archivo_nombre}`}
        </p>
      </div>

      {/* Estado badge */}
      <button
        onClick={() => onToggleEstado(doc)}
        className={`px-2.5 py-1 rounded-full text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity ${DOC_ESTADO_COLORS[doc.estado] || 'bg-slate-100 text-slate-600'}`}
      >
        {DOC_ESTADO_LABELS[doc.estado] || doc.estado}
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {doc.archivo_path ? (
          <>
            <button onClick={() => onDownload(doc.archivo_path!, doc.archivo_nombre || 'archivo')}
              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Descargar">
              <Download className="w-4 h-4" />
            </button>
            <button onClick={() => onRemoveFile(doc.id, doc.archivo_path!)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Quitar archivo">
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => onUpload(doc.id)}
            disabled={uploading}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
            title="Subir archivo"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </button>
        )}
        <button onClick={() => onDelete(doc.id)}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar documento">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
