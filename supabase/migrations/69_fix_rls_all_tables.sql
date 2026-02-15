-- =====================================================
-- Migration 69: Fix RLS on ALL SGT tables
-- Ensures authenticated users can read/write all tables
-- Run this in Supabase SQL Editor
-- =====================================================

-- Disable RLS on all core SGT tables
ALTER TABLE IF EXISTS clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gestiones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tramites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tramite_tipos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documentos_tramite DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS seguimientos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS precios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS registros_cliente DISABLE ROW LEVEL SECURITY;

-- Create permissive policies as backup (in case RLS gets re-enabled)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'clientes', 'gestiones', 'tramites', 'tramite_tipos',
    'documentos_tramite', 'seguimientos', 'precios', 'registros_cliente'
  ])
  LOOP
    -- Drop existing restrictive policies
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_authenticated" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "allow_select_all" ON %I', tbl);

    -- Create permissive policies
    EXECUTE format(
      'CREATE POLICY "allow_select_all" ON %I FOR SELECT USING (true)', tbl
    );
    EXECUTE format(
      'CREATE POLICY "allow_all_authenticated" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl
    );

    RAISE NOTICE 'Fixed RLS policies for: %', tbl;
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'RLS fix error: %', SQLERRM;
END $$;

-- Verify counts
DO $$
DECLARE
  cnt integer;
BEGIN
  SELECT count(*) INTO cnt FROM clientes;
  RAISE NOTICE 'clientes: % registros', cnt;
  SELECT count(*) INTO cnt FROM gestiones;
  RAISE NOTICE 'gestiones: % registros', cnt;
  SELECT count(*) INTO cnt FROM tramites;
  RAISE NOTICE 'tramites: % registros', cnt;
  SELECT count(*) INTO cnt FROM tramite_tipos;
  RAISE NOTICE 'tramite_tipos: % registros', cnt;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
