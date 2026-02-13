-- =====================================================
-- Migration 62: Create registros_cliente + add fecha_emision to documentos_cliente
-- Needed by ClienteDetailV2 for RNE, RNEE, habilitaciones
-- =====================================================

-- 1. registros_cliente: registrations and authorizations held by a client
CREATE TABLE IF NOT EXISTS registros_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo text NOT NULL,                    -- RNE, RNEE, habilitacion_anmat, etc.
  numero text,                           -- registration number
  organismo text,                        -- issuing authority
  descripcion text,
  fecha_emision date,
  fecha_vencimiento date,
  estado text NOT NULL DEFAULT 'vigente', -- vigente, en_tramite, vencido, suspendido
  notas text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE registros_cliente DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_registros_cliente_cliente_id ON registros_cliente(cliente_id);

-- 2. Add fecha_emision to documentos_cliente if it doesn't exist
DO $$ BEGIN
  ALTER TABLE documentos_cliente ADD COLUMN fecha_emision date;
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'Column fecha_emision already exists on documentos_cliente';
END $$;
