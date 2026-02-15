-- Add cantidad_registros_envase to tramites table
-- This tracks how many packaging registrations are included in a tramite
ALTER TABLE tramites ADD COLUMN IF NOT EXISTS cantidad_registros_envase integer DEFAULT 0;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
