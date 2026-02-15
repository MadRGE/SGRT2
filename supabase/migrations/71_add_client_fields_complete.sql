-- =====================================================
-- Migration 71: Add all important fields to clientes
-- For regulatory consulting (INAL, ANMAT, SENASA, etc.)
-- Run in Supabase SQL Editor
-- =====================================================

DO $$
BEGIN
  -- Contact person
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='contacto_nombre') THEN
    ALTER TABLE clientes ADD COLUMN contacto_nombre text;
  END IF;

  -- Client origin/referral
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='origen') THEN
    ALTER TABLE clientes ADD COLUMN origen text DEFAULT 'directo';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='referido_por') THEN
    ALTER TABLE clientes ADD COLUMN referido_por text;
  END IF;

  -- Address
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='direccion') THEN
    ALTER TABLE clientes ADD COLUMN direccion text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='localidad') THEN
    ALTER TABLE clientes ADD COLUMN localidad text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='provincia') THEN
    ALTER TABLE clientes ADD COLUMN provincia text;
  END IF;

  -- Regulatory registrations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='rne') THEN
    ALTER TABLE clientes ADD COLUMN rne text;
  END IF;

  -- Notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='notas') THEN
    ALTER TABLE clientes ADD COLUMN notas text;
  END IF;

  -- Soft delete
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='deleted_at') THEN
    ALTER TABLE clientes ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;

  -- Telefono (por si falta)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='telefono') THEN
    ALTER TABLE clientes ADD COLUMN telefono text;
  END IF;
END $$;

-- Make cuit nullable (v4 had NOT NULL)
DO $$
BEGIN
  ALTER TABLE clientes ALTER COLUMN cuit DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'cuit already nullable';
END $$;

-- Disable RLS on all tables
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE gestiones DISABLE ROW LEVEL SECURITY;
ALTER TABLE tramites DISABLE ROW LEVEL SECURITY;
ALTER TABLE tramite_tipos DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_tramite DISABLE ROW LEVEL SECURITY;

-- deleted_at on other tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gestiones' AND column_name='deleted_at') THEN
    ALTER TABLE gestiones ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tramites' AND column_name='deleted_at') THEN
    ALTER TABLE tramites ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Force PostgREST to reload
NOTIFY pgrst, 'reload schema';
