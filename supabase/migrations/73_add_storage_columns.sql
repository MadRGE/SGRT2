-- =====================================================
-- Migration 73: Add file storage columns + bucket
-- Enables file upload/download in documentos_tramite
-- and documentos_cliente tables
-- =====================================================

-- 1. Add archivo columns to documentos_tramite
ALTER TABLE documentos_tramite ADD COLUMN IF NOT EXISTS archivo_path text;
ALTER TABLE documentos_tramite ADD COLUMN IF NOT EXISTS archivo_nombre text;
ALTER TABLE documentos_tramite ADD COLUMN IF NOT EXISTS archivo_size integer;

-- 2. Add archivo columns to documentos_cliente (already has archivo_url from v4)
ALTER TABLE documentos_cliente ADD COLUMN IF NOT EXISTS archivo_path text;
ALTER TABLE documentos_cliente ADD COLUMN IF NOT EXISTS archivo_nombre text;
ALTER TABLE documentos_cliente ADD COLUMN IF NOT EXISTS archivo_size integer;

-- 3. Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documentos', 'documentos', false, 26214400)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS policies for the documentos bucket
DO $$ BEGIN
  CREATE POLICY "auth_upload_documentos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'documentos');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy auth_upload_documentos already exists';
END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_documentos" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'documentos');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy auth_read_documentos already exists';
END $$;

DO $$ BEGIN
  CREATE POLICY "auth_delete_documentos" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'documentos');
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Policy auth_delete_documentos already exists';
END $$;
