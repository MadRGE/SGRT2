-- Migration 64: Soft delete - papelera de 30 días
-- Agrega deleted_at a clientes, gestiones y tramites
-- Los items con deleted_at != null se ocultan de la app
-- Después de 30 días se pueden eliminar definitivamente

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='deleted_at') THEN
    ALTER TABLE clientes ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gestiones' AND column_name='deleted_at') THEN
    ALTER TABLE gestiones ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tramites' AND column_name='deleted_at') THEN
    ALTER TABLE tramites ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Indexes para filtrar rápido los no-eliminados
CREATE INDEX IF NOT EXISTS idx_clientes_deleted ON clientes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gestiones_deleted ON gestiones(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tramites_deleted ON tramites(deleted_at) WHERE deleted_at IS NULL;
