import { supabase } from './supabase';

const BUCKET = 'documentos';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Upload a file to Supabase Storage.
 * @param folder - e.g., "tramites/{tramiteId}" or "clientes/{clienteId}"
 * @param file - the File object from input[type=file]
 * @returns { path, error } - path is the storage path, error is a user-friendly message
 */
export async function uploadDocumento(
  folder: string,
  file: File
): Promise<{ path: string; error: string | null }> {
  if (file.size > MAX_FILE_SIZE) {
    return { path: '', error: `Archivo demasiado grande (max ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB)` };
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) {
    if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
      return { path: '', error: 'Bucket "documentos" no existe. Ejecute la migracion 73 o creelo manualmente en Supabase Storage.' };
    }
    return { path: '', error: error.message };
  }

  return { path, error: null };
}

/**
 * Get a signed URL for downloading/viewing a file (1 hour expiry).
 */
export async function getDocumentoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Delete a file from storage.
 */
export async function deleteDocumento(path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  return !error;
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
