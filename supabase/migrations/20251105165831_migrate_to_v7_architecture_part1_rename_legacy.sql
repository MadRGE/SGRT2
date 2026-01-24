/*
  # Migration to v7 Architecture - Part 1: Rename Legacy Tables

  This migration renames the existing expedientes table to preserve legacy data
  while we build the new v7 architecture.

  ## Changes
  1. Rename existing expedientes table to proyectos_legacy_v1
  2. This preserves all existing data while allowing us to create the new structure

  ## Important Notes
  - All existing data is preserved
  - No data loss occurs
  - The old table can be used for data migration later if needed
*/

-- Rename existing expedientes table to preserve legacy data
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'expedientes' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE expedientes RENAME TO proyectos_legacy_v1;
  END IF;
END $$;