-- =====================================================
-- Migration 63: Add gestion_id to seguimientos + tipo column
-- Allows tracking activity at gestion level (calls, meetings, decisions)
-- =====================================================

-- Add gestion_id column (nullable - a seguimiento belongs to tramite OR gestion or both)
DO $$ BEGIN
  ALTER TABLE seguimientos ADD COLUMN gestion_id uuid REFERENCES gestiones(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'Column gestion_id already exists on seguimientos';
END $$;

-- Add tipo column for categorizing notes
DO $$ BEGIN
  ALTER TABLE seguimientos ADD COLUMN tipo text NOT NULL DEFAULT 'nota';
EXCEPTION WHEN duplicate_column THEN
  RAISE NOTICE 'Column tipo already exists on seguimientos';
END $$;

-- Make tramite_id nullable (was NOT NULL before - now seguimiento can belong to gestion only)
ALTER TABLE seguimientos ALTER COLUMN tramite_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_seguimientos_gestion_id ON seguimientos(gestion_id);
