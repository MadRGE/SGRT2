/*
  # Add telefono column to clientes table

  1. Changes
    - Add `telefono` column to `clientes` table
    - Column is optional (nullable)
*/

DO $$
BEGIN
  -- Add telefono column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clientes' AND column_name = 'telefono'
  ) THEN
    ALTER TABLE clientes ADD COLUMN telefono TEXT;
  END IF;
END $$;