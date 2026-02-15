-- =====================================================
-- Migration 65: Fix ALL RLS issues in one shot
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Fix tramite_tipos (catálogo) - disable RLS
ALTER TABLE IF EXISTS tramite_tipos DISABLE ROW LEVEL SECURITY;

-- 2. Create permissive policies as backup
DO $$ BEGIN
  DROP POLICY IF EXISTS "tramite_tipos_select_all" ON tramite_tipos;
  DROP POLICY IF EXISTS "tramite_tipos_auth_write" ON tramite_tipos;
  DROP POLICY IF EXISTS "Allow all for authenticated" ON tramite_tipos;
  DROP POLICY IF EXISTS "Allow read for all" ON tramite_tipos;
  DROP POLICY IF EXISTS "Allow write for authenticated" ON tramite_tipos;
  DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON tramite_tipos;

  CREATE POLICY "tramite_tipos_select_all" ON tramite_tipos
    FOR SELECT USING (true);

  CREATE POLICY "tramite_tipos_auth_write" ON tramite_tipos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'tramite_tipos policies: %', SQLERRM;
END $$;

-- 3. Verify data
DO $$
DECLARE cnt integer;
BEGIN
  SELECT count(*) INTO cnt FROM tramite_tipos;
  RAISE NOTICE 'tramite_tipos: % registros', cnt;
END $$;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
