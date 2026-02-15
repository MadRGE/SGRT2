-- =====================================================
-- Migration 70: Add missing columns to clientes table
-- The v4 schema only created: id, razon_social, cuit, email, created_at
-- The v2 schema expected: + rne, telefono, contacto_nombre, origen, referido_por, notas
-- telefono was added by migration 20251105182211
-- This adds the remaining missing columns
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='origen') THEN
    ALTER TABLE clientes ADD COLUMN origen text DEFAULT 'directo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='notas') THEN
    ALTER TABLE clientes ADD COLUMN notas text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='contacto_nombre') THEN
    ALTER TABLE clientes ADD COLUMN contacto_nombre text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='referido_por') THEN
    ALTER TABLE clientes ADD COLUMN referido_por text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='rne') THEN
    ALTER TABLE clientes ADD COLUMN rne text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='telefono') THEN
    ALTER TABLE clientes ADD COLUMN telefono text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='deleted_at') THEN
    ALTER TABLE clientes ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Also add deleted_at to other tables if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gestiones' AND column_name='deleted_at') THEN
    ALTER TABLE gestiones ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tramites' AND column_name='deleted_at') THEN
    ALTER TABLE tramites ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Make cuit nullable (v4 had it as NOT NULL UNIQUE, but v2 has it as optional)
ALTER TABLE clientes ALTER COLUMN cuit DROP NOT NULL;
DO $$
BEGIN
  -- Drop unique constraint on cuit if it exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_cuit_key') THEN
    ALTER TABLE clientes DROP CONSTRAINT clientes_cuit_key;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not drop cuit constraint: %', SQLERRM;
END $$;

-- Disable RLS
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE gestiones DISABLE ROW LEVEL SECURITY;
ALTER TABLE tramites DISABLE ROW LEVEL SECURITY;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
