-- =====================================================
-- Migration 60: Fix RLS on tramite_tipos after table recreate
-- The table was DROP CASCADE'd and recreated, losing all policies
-- =====================================================

-- Option A: Just disable RLS (it's a public catalog, no security needed)
ALTER TABLE tramite_tipos DISABLE ROW LEVEL SECURITY;

-- Option B (backup): If RLS stays enabled, create permissive policy
-- In case someone re-enables RLS later
DO $$ BEGIN
  -- Drop any existing policies first
  DROP POLICY IF EXISTS "tramite_tipos_select_all" ON tramite_tipos;
  DROP POLICY IF EXISTS "tramite_tipos_auth_write" ON tramite_tipos;
  DROP POLICY IF EXISTS "Allow public read" ON tramite_tipos;
  DROP POLICY IF EXISTS "Allow authenticated write" ON tramite_tipos;

  -- Create permissive policies
  CREATE POLICY "tramite_tipos_select_all" ON tramite_tipos
    FOR SELECT USING (true);

  CREATE POLICY "tramite_tipos_auth_write" ON tramite_tipos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy creation skipped: %', SQLERRM;
END $$;

-- Verify data exists
DO $$
DECLARE
  cnt integer;
BEGIN
  SELECT count(*) INTO cnt FROM tramite_tipos;
  RAISE NOTICE 'tramite_tipos tiene % registros', cnt;
END $$;
