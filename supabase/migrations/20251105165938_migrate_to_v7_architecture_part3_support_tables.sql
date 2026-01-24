/*
  # Migration to v7 Architecture - Part 3: Support Tables

  This migration creates or updates support tables for the v7 architecture:
  - presupuestos: Budget management per project
  - presupuesto_items: Line items for budgets
  - Updates to existing terceros, expediente_tareas_terceros, cliente_documentos, facturas_proveedores

  ## New/Updated Tables
  1. Financial Tables
    - `presupuestos` - Project budgets
    - `presupuesto_items` - Budget line items

  2. Already exists from previous migrations (just ensuring they're compatible):
    - `terceros` - Third party providers
    - `expediente_tareas_terceros` - Logistics tasks
    - `cliente_documentos` - Client global documents
    - `facturas_proveedores` - Provider invoices

  ## Security
  - RLS enabled on all new tables
  - Authenticated users can view records
  - Only gestores and admins can modify
*/

-- ============================================
-- PRESUPUESTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE UNIQUE NOT NULL,
  estado VARCHAR(50) DEFAULT 'borrador',
  total_final DECIMAL(12, 2) DEFAULT 0,
  fecha_envio TIMESTAMPTZ,
  fecha_aprobacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto ON presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON presupuestos(estado);

ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view presupuestos"
  ON presupuestos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can manage presupuestos"
  ON presupuestos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- PRESUPUESTO_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS presupuesto_items (
  id SERIAL PRIMARY KEY,
  presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE CASCADE NOT NULL,
  expediente_id UUID REFERENCES expedientes(id) ON DELETE SET NULL,
  concepto VARCHAR(200) NOT NULL,
  tipo VARCHAR(50),
  monto DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cantidad INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_presupuesto_items_presupuesto ON presupuesto_items(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_presupuesto_items_expediente ON presupuesto_items(expediente_id);

ALTER TABLE presupuesto_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view presupuesto_items"
  ON presupuesto_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can manage presupuesto_items"
  ON presupuesto_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- UPDATE FACTURAS_PROVEEDORES (already exists, ensure correct schema)
-- ============================================
DO $$
BEGIN
  -- Check if facturas_proveedores needs the proyecto_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facturas_proveedores' 
    AND column_name = 'proyecto_id'
  ) THEN
    ALTER TABLE facturas_proveedores 
    ADD COLUMN proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE;
    
    CREATE INDEX idx_facturas_proveedores_proyecto ON facturas_proveedores(proyecto_id);
  END IF;
END $$;