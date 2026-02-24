-- Agregar soft-delete a cotizaciones
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_cotizaciones_deleted ON cotizaciones(deleted_at) WHERE deleted_at IS NULL;

-- Recargar schema cache
NOTIFY pgrst, 'reload schema';
