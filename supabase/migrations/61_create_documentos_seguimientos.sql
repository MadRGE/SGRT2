-- =====================================================
-- Migration 61: Create documentos_tramite, seguimientos, documentos_cliente
-- Tables needed by TramiteDetailV2
-- =====================================================

-- 1. documentos_tramite: docs required for each tramite
CREATE TABLE IF NOT EXISTS documentos_tramite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tramite_id uuid NOT NULL REFERENCES tramites(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente',
  obligatorio boolean DEFAULT false,
  responsable text,
  documento_cliente_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documentos_tramite DISABLE ROW LEVEL SECURITY;

-- 2. seguimientos: activity log / timeline for each tramite
CREATE TABLE IF NOT EXISTS seguimientos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tramite_id uuid NOT NULL REFERENCES tramites(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seguimientos DISABLE ROW LEVEL SECURITY;

-- 3. documentos_cliente: docs that belong to a client (shared across tramites)
CREATE TABLE IF NOT EXISTS documentos_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  estado text NOT NULL DEFAULT 'vigente',
  categoria text NOT NULL DEFAULT 'general',
  fecha_vencimiento date,
  archivo_url text,
  notas text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documentos_cliente DISABLE ROW LEVEL SECURITY;

-- Add FK from documentos_tramite to documentos_cliente
DO $$ BEGIN
  ALTER TABLE documentos_tramite
    ADD CONSTRAINT fk_documento_cliente
    FOREIGN KEY (documento_cliente_id) REFERENCES documentos_cliente(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FK already exists or skipped: %', SQLERRM;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documentos_tramite_tramite_id ON documentos_tramite(tramite_id);
CREATE INDEX IF NOT EXISTS idx_seguimientos_tramite_id ON seguimientos(tramite_id);
CREATE INDEX IF NOT EXISTS idx_documentos_cliente_cliente_id ON documentos_cliente(cliente_id);
