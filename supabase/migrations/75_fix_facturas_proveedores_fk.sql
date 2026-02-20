-- Migration: Fix facturas_proveedores to reference gestiones instead of proyectos
-- The app code now uses gestion_id, but the DB table still has proyecto_id

-- 1. Add gestion_id column referencing gestiones
ALTER TABLE facturas_proveedores
  ADD COLUMN IF NOT EXISTS gestion_id uuid REFERENCES gestiones(id) ON DELETE SET NULL;

-- 2. Create index on gestion_id
CREATE INDEX IF NOT EXISTS idx_facturas_proveedores_gestion
  ON facturas_proveedores(gestion_id);

-- 3. Make proyecto_id nullable (it was NOT NULL, but we no longer use it)
ALTER TABLE facturas_proveedores
  ALTER COLUMN proyecto_id DROP NOT NULL;

-- 4. Drop presupuesto_item_id FK if it exists (references old presupuesto_items table)
ALTER TABLE facturas_proveedores
  DROP COLUMN IF EXISTS presupuesto_item_id;
