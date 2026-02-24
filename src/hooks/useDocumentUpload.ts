import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { uploadDocumento, getDocumentoUrl, deleteDocumento } from '../lib/storage';

interface UseDocumentUploadOptions {
  storagePath: string;
  tableName: string;
  onSuccess: () => void;
}

export function useDocumentUpload({ storagePath, tableName, onSuccess }: UseDocumentUploadOptions) {
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadDocId = useRef<string | null>(null);

  const triggerUpload = useCallback((docId: string) => {
    pendingUploadDocId.current = docId;
    setUploadError('');
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const docId = pendingUploadDocId.current;
    if (!file || !docId) return;
    e.target.value = '';

    setUploadingDocId(docId);
    setUploadError('');

    const { path, error: uploadErr } = await uploadDocumento(storagePath, file);

    if (uploadErr) {
      setUploadError(uploadErr);
      setUploadingDocId(null);
      return;
    }

    const { error: dbErr } = await supabase
      .from(tableName)
      .update({
        archivo_path: path,
        archivo_nombre: file.name,
        archivo_size: file.size,
      })
      .eq('id', docId);

    if (dbErr) {
      if (dbErr.message?.includes('archivo_path') || dbErr.message?.includes('schema cache')) {
        setUploadError('Ejecute la migracion 73 para habilitar subida de archivos.');
      } else {
        setUploadError(dbErr.message || 'Error al guardar referencia del archivo.');
      }
      await deleteDocumento(path);
    } else {
      onSuccess();
    }
    setUploadingDocId(null);
  }, [storagePath, tableName, onSuccess]);

  const handleDownloadFile = useCallback(async (path: string, nombre: string) => {
    const url = await getDocumentoUrl(path);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      a.target = '_blank';
      a.click();
    }
  }, []);

  const handleRemoveFile = useCallback(async (docId: string, archivoPath: string) => {
    if (!confirm('¿Quitar el archivo adjunto? El registro del documento se mantiene.')) return;

    await deleteDocumento(archivoPath);
    await supabase
      .from(tableName)
      .update({ archivo_path: null, archivo_nombre: null, archivo_size: null })
      .eq('id', docId);
    toast.success('Archivo adjunto eliminado');
    onSuccess();
  }, [tableName, onSuccess]);

  return {
    uploadingDocId,
    uploadError,
    setUploadError,
    fileInputRef,
    triggerUpload,
    handleFileSelected,
    handleDownloadFile,
    handleRemoveFile,
  };
}
