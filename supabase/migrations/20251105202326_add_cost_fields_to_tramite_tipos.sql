/*
  # Agregar campos de costos a tramite_tipos
  
  1. Cambios
    - Agregar columna `costo_honorarios_base` para costos de honorarios profesionales
    - Agregar columna `costo_tasas_base` para tasas de organismos
    - Valores por defecto en 0
  
  2. Propósito
    - Permitir generación automática de presupuestos basados en trámites
    - Facilitar la estimación de costos en el wizard v7
*/

-- Agregar columnas de costos si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tramite_tipos' AND column_name = 'costo_honorarios_base'
  ) THEN
    ALTER TABLE tramite_tipos ADD COLUMN costo_honorarios_base DECIMAL(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tramite_tipos' AND column_name = 'costo_tasas_base'
  ) THEN
    ALTER TABLE tramite_tipos ADD COLUMN costo_tasas_base DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Actualizar valores para trámites principales
UPDATE tramite_tipos 
SET 
  costo_honorarios_base = CASE id
    WHEN 'TT-INAL-001' THEN 50000
    WHEN 'TT-INAL-002' THEN 30000
    WHEN 'TT-INAL-003' THEN 20000
    WHEN 'TT-INAL-005' THEN 25000
    WHEN 'TT-COSM-001' THEN 35000
    WHEN 'TT-COSM-002' THEN 60000
    WHEN 'TT-PM-001' THEN 70000
    WHEN 'TT-PM-005' THEN 80000
    WHEN 'TT-SIC-001' THEN 40000
    WHEN 'TT-SIC-004' THEN 15000
    WHEN 'TT-SIC-005' THEN 10000
    WHEN 'TT-SENASA-003' THEN 50000
    WHEN 'TT-SENASA-004' THEN 45000
    WHEN 'TT-RENPRE-001' THEN 40000
    WHEN 'TT-ANMAC-001' THEN 60000
    ELSE 0
  END,
  costo_tasas_base = CASE id
    WHEN 'TT-INAL-001' THEN 15000
    WHEN 'TT-INAL-002' THEN 8000
    WHEN 'TT-INAL-003' THEN 5000
    WHEN 'TT-INAL-005' THEN 7000
    WHEN 'TT-COSM-001' THEN 12000
    WHEN 'TT-COSM-002' THEN 20000
    WHEN 'TT-PM-001' THEN 25000
    WHEN 'TT-PM-005' THEN 30000
    WHEN 'TT-SIC-001' THEN 0
    WHEN 'TT-SIC-004' THEN 0
    WHEN 'TT-SIC-005' THEN 0
    WHEN 'TT-SENASA-003' THEN 10000
    WHEN 'TT-SENASA-004' THEN 8000
    WHEN 'TT-RENPRE-001' THEN 12000
    WHEN 'TT-ANMAC-001' THEN 25000
    ELSE 0
  END
WHERE id IN ('TT-INAL-001', 'TT-INAL-002', 'TT-INAL-003', 'TT-INAL-005', 
             'TT-COSM-001', 'TT-COSM-002', 'TT-PM-001', 'TT-PM-005',
             'TT-SIC-001', 'TT-SIC-004', 'TT-SIC-005',
             'TT-SENASA-003', 'TT-SENASA-004', 'TT-RENPRE-001', 'TT-ANMAC-001');
