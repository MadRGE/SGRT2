/*
  # Add Discount and Audit Fields to Cotizaciones

  ## Changes
  
  1. **Discount Fields** - Add discount tracking to cotizaciones
    - `descuento_porcentaje` (decimal) - Discount percentage applied
    - `descuento_monto` (decimal) - Calculated discount amount
    - `motivo_descuento` (text) - Reason for discount
    - `precio_final` (decimal) - Final price after discount
  
  2. **Audit Fields** - Track who creates and modifies cotizaciones
    - `created_by` (uuid) - User who created the cotizacion
    - `updated_by` (uuid) - User who last updated the cotizacion
  
  ## Notes
  - Discount is optional (nullable fields)
  - precio_final = precio_total - descuento_monto
  - Audit fields reference usuarios table
*/

-- ============================================
-- ADD DISCOUNT FIELDS
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cotizaciones' AND column_name = 'descuento_porcentaje'
  ) THEN
    ALTER TABLE cotizaciones ADD COLUMN descuento_porcentaje DECIMAL(5, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cotizaciones' AND column_name = 'descuento_monto'
  ) THEN
    ALTER TABLE cotizaciones ADD COLUMN descuento_monto DECIMAL(12, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cotizaciones' AND column_name = 'motivo_descuento'
  ) THEN
    ALTER TABLE cotizaciones ADD COLUMN motivo_descuento TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cotizaciones' AND column_name = 'precio_final'
  ) THEN
    ALTER TABLE cotizaciones ADD COLUMN precio_final DECIMAL(12, 2) DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- ADD AUDIT FIELDS
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cotizaciones' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE cotizaciones ADD COLUMN created_by UUID REFERENCES usuarios(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cotizaciones' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE cotizaciones ADD COLUMN updated_by UUID REFERENCES usuarios(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cotizaciones_created_by ON cotizaciones(created_by);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_updated_by ON cotizaciones(updated_by);

-- ============================================
-- TRIGGER: Auto-set created_by and updated_by
-- ============================================
CREATE OR REPLACE FUNCTION trigger_set_cotizacion_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_cotizacion_audit ON cotizaciones;

CREATE TRIGGER set_cotizacion_audit
  BEFORE INSERT OR UPDATE ON cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_cotizacion_audit();

-- ============================================
-- FUNCTION: Calculate final price with discount
-- ============================================
CREATE OR REPLACE FUNCTION calculate_precio_final(
  p_precio_total DECIMAL,
  p_descuento_porcentaje DECIMAL,
  p_descuento_monto DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  IF p_descuento_monto IS NOT NULL AND p_descuento_monto > 0 THEN
    RETURN p_precio_total - p_descuento_monto;
  ELSIF p_descuento_porcentaje IS NOT NULL AND p_descuento_porcentaje > 0 THEN
    RETURN p_precio_total * (1 - p_descuento_porcentaje / 100);
  ELSE
    RETURN p_precio_total;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGER: Auto-calculate precio_final
-- ============================================
CREATE OR REPLACE FUNCTION trigger_calculate_precio_final()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.descuento_porcentaje > 0 AND (NEW.descuento_monto IS NULL OR NEW.descuento_monto = 0) THEN
    NEW.descuento_monto = NEW.precio_total * (NEW.descuento_porcentaje / 100);
  END IF;
  
  NEW.precio_final = calculate_precio_final(
    NEW.precio_total,
    NEW.descuento_porcentaje,
    NEW.descuento_monto
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_precio_final ON cotizaciones;

CREATE TRIGGER calculate_precio_final
  BEFORE INSERT OR UPDATE ON cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_precio_final();

-- ============================================
-- UPDATE existing records with default values
-- ============================================
UPDATE cotizaciones 
SET 
  precio_final = precio_total,
  descuento_porcentaje = 0,
  descuento_monto = 0
WHERE precio_final IS NULL OR precio_final = 0;