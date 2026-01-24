/*
  # Fix presupuesto_items FK constraint and add tracking fields

  ## Changes
  
  1. Foreign Key Fixes
    - Drop and recreate `presupuesto_items_expediente_id_fkey` with proper ON DELETE SET NULL
    - Ensure expediente_id column allows NULL values
  
  2. New Tracking Fields for presupuesto_items
    - `direccionado` (boolean) - Whether item has been assigned to an expediente
    - `fecha_direccionado` (timestamptz) - When it was assigned
    - `direccionado_por` (uuid, FK to usuarios) - Who assigned it
  
  3. New Audit Fields for presupuestos
    - `fecha_enviado` (timestamptz) - When budget was sent to client
    - `fecha_aprobado` (timestamptz) - When budget was approved
    - `enviado_por` (uuid, FK to usuarios) - Who sent it
    - `aprobado_por` (uuid, FK to usuarios) - Who approved it
    - `notas` (text) - Additional notes
  
  ## Security
  - No RLS changes needed (already configured)
*/

-- ============================================
-- FIX PRESUPUESTO_ITEMS FK CONSTRAINT
-- ============================================

-- Drop existing constraint if it exists
ALTER TABLE presupuesto_items 
DROP CONSTRAINT IF EXISTS presupuesto_items_expediente_id_fkey;

-- Ensure the column allows NULL
ALTER TABLE presupuesto_items 
ALTER COLUMN expediente_id DROP NOT NULL;

-- Recreate constraint with proper ON DELETE SET NULL
ALTER TABLE presupuesto_items 
ADD CONSTRAINT presupuesto_items_expediente_id_fkey 
FOREIGN KEY (expediente_id) 
REFERENCES expedientes(id) 
ON DELETE SET NULL;

-- ============================================
-- ADD TRACKING FIELDS TO PRESUPUESTO_ITEMS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'presupuesto_items' AND column_name = 'direccionado'
  ) THEN
    ALTER TABLE presupuesto_items 
    ADD COLUMN direccionado BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'presupuesto_items' AND column_name = 'fecha_direccionado'
  ) THEN
    ALTER TABLE presupuesto_items 
    ADD COLUMN fecha_direccionado TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'presupuesto_items' AND column_name = 'direccionado_por'
  ) THEN
    ALTER TABLE presupuesto_items 
    ADD COLUMN direccionado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- ADD AUDIT FIELDS TO PRESUPUESTOS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'presupuestos' AND column_name = 'fecha_enviado'
  ) THEN
    ALTER TABLE presupuestos 
    ADD COLUMN fecha_enviado TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'presupuestos' AND column_name = 'fecha_aprobado'
  ) THEN
    ALTER TABLE presupuestos 
    ADD COLUMN fecha_aprobado TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'presupuestos' AND column_name = 'enviado_por'
  ) THEN
    ALTER TABLE presupuestos 
    ADD COLUMN enviado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'presupuestos' AND column_name = 'aprobado_por'
  ) THEN
    ALTER TABLE presupuestos 
    ADD COLUMN aprobado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'presupuestos' AND column_name = 'notas'
  ) THEN
    ALTER TABLE presupuestos 
    ADD COLUMN notas TEXT;
  END IF;
END $$;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_presupuesto_items_direccionado 
ON presupuesto_items(direccionado);

CREATE INDEX IF NOT EXISTS idx_presupuesto_items_direccionado_por 
ON presupuesto_items(direccionado_por);

CREATE INDEX IF NOT EXISTS idx_presupuestos_estado 
ON presupuestos(estado);

-- ============================================
-- UPDATE EXISTING ITEMS
-- ============================================

-- Mark existing items with expediente_id as direccionado
UPDATE presupuesto_items 
SET direccionado = true, 
    fecha_direccionado = now()
WHERE expediente_id IS NOT NULL 
  AND direccionado IS NOT true;