-- Add user tracking columns to seguimientos
DO $$ BEGIN
  ALTER TABLE seguimientos ADD COLUMN usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'Column usuario_id already exists on seguimientos';
END $$;

DO $$ BEGIN
  ALTER TABLE seguimientos ADD COLUMN usuario_nombre text;
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'Column usuario_nombre already exists on seguimientos';
END $$;

CREATE INDEX IF NOT EXISTS idx_seguimientos_usuario_id ON seguimientos(usuario_id);
