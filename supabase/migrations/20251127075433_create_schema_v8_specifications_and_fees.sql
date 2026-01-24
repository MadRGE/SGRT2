/*
  # Schema v8 - Technical Specifications and Official Fees System

  This migration implements the v8 architecture for detailed product technical specifications
  and official fee management system.

  ## New Tables

  ### 1. producto_especificaciones
  Stores detailed technical specifications for products by regulatory category
  - `id` (uuid, primary key)
  - `producto_id` (uuid, FK to productos) - Product reference
  - `tipo_especificacion` (varchar) - Type: 'envases_anmat', 'alimentos_inal', 'medicos_anmat'
  - `datos_tecnicos` (jsonb) - Flexible technical data storage
  - `version` (integer) - Specification version number
  - `estado` (text) - Status: 'borrador', 'completo', 'aprobado'
  - `fabricante` (text) - Manufacturer name
  - `pais_fabricacion` (text) - Country of manufacture
  - `certificaciones` (text[]) - Array of certifications
  - `created_by` (uuid, FK to usuarios)
  - `created_at`, `updated_at` (timestamptz)

  ### 2. aranceles_oficiales
  Official fee structure from regulatory organisms (INAL, ANMAT, etc.)
  - `id` (uuid, primary key)
  - `organismo_id` (varchar, FK to organismos) - Regulatory organism
  - `codigo_tramite` (varchar) - Official procedure code
  - `descripcion` (text) - Fee description
  - `monto` (decimal) - Base amount
  - `moneda` (varchar) - Currency (ARS, USD)
  - `categoria` (varchar) - Product category
  - `vigencia_desde` (date) - Valid from date
  - `vigencia_hasta` (date) - Valid until date
  - `formula_calculo` (text) - Calculation formula for variable fees
  - `notas_aplicacion` (text) - Application notes
  - `created_at`, `updated_at` (timestamptz)

  ### 3. Updated expediente_productos table
  Enhanced to track individual product status within procedures
  - Add `estado_individual` - Individual status per product
  - Add `observaciones_individuales` - Individual observations
  - Add `certificado_url` - Individual certificate URL
  - Add `fecha_aprobacion_individual` - Individual approval date
  - Add `aprobado_por` - User who approved
  - Add `numero_certificado` - Certificate number

  ## Security
  - RLS enabled on all tables
  - Authenticated users can view specifications
  - Only gestors and admins can modify specifications and fees
*/

-- ============================================
-- 1. PRODUCTO_ESPECIFICACIONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS producto_especificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid REFERENCES productos(id) ON DELETE CASCADE NOT NULL,
  tipo_especificacion varchar(50) NOT NULL CHECK (tipo_especificacion IN ('envases_anmat', 'alimentos_inal', 'medicos_anmat', 'cosmeticos_anmat', 'veterinarios_senasa')),
  datos_tecnicos jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer DEFAULT 1,
  estado text DEFAULT 'borrador' CHECK (estado IN ('borrador', 'completo', 'aprobado', 'rechazado')),
  fabricante text,
  pais_fabricacion text,
  certificaciones text[] DEFAULT ARRAY[]::text[],
  notas text,
  created_by uuid REFERENCES usuarios(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_producto_especificaciones_producto ON producto_especificaciones(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_especificaciones_tipo ON producto_especificaciones(tipo_especificacion);
CREATE INDEX IF NOT EXISTS idx_producto_especificaciones_estado ON producto_especificaciones(estado);

ALTER TABLE producto_especificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product specifications"
  ON producto_especificaciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can manage product specifications"
  ON producto_especificaciones FOR ALL
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
-- 2. ARANCELES_OFICIALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS aranceles_oficiales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organismo_id varchar(50) REFERENCES organismos(id),
  codigo_tramite varchar(50) NOT NULL,
  descripcion text NOT NULL,
  monto decimal(12,2) NOT NULL,
  moneda varchar(3) DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  categoria varchar(100),
  vigencia_desde date DEFAULT CURRENT_DATE,
  vigencia_hasta date,
  formula_calculo text,
  notas_aplicacion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aranceles_organismo ON aranceles_oficiales(organismo_id);
CREATE INDEX IF NOT EXISTS idx_aranceles_codigo ON aranceles_oficiales(codigo_tramite);
CREATE INDEX IF NOT EXISTS idx_aranceles_categoria ON aranceles_oficiales(categoria);
CREATE INDEX IF NOT EXISTS idx_aranceles_vigencia ON aranceles_oficiales(vigencia_desde, vigencia_hasta);
CREATE INDEX IF NOT EXISTS idx_aranceles_activo ON aranceles_oficiales(activo);

ALTER TABLE aranceles_oficiales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active fees"
  ON aranceles_oficiales FOR SELECT
  TO authenticated
  USING (activo = true);

CREATE POLICY "Admins can manage fees"
  ON aranceles_oficiales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol = 'admin'
    )
  );

-- ============================================
-- 3. ENHANCE EXPEDIENTE_PRODUCTOS TABLE
-- ============================================
DO $$
BEGIN
  -- Add estado_individual column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expediente_productos' AND column_name = 'estado_individual'
  ) THEN
    ALTER TABLE expediente_productos ADD COLUMN estado_individual varchar(50) DEFAULT 'en_evaluacion' CHECK (estado_individual IN ('en_evaluacion', 'aprobado', 'observado', 'rechazado'));
  END IF;

  -- Add observaciones_individuales column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expediente_productos' AND column_name = 'observaciones_individuales'
  ) THEN
    ALTER TABLE expediente_productos ADD COLUMN observaciones_individuales text;
  END IF;

  -- Add certificado_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expediente_productos' AND column_name = 'certificado_url'
  ) THEN
    ALTER TABLE expediente_productos ADD COLUMN certificado_url text;
  END IF;

  -- Add fecha_aprobacion_individual column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expediente_productos' AND column_name = 'fecha_aprobacion_individual'
  ) THEN
    ALTER TABLE expediente_productos ADD COLUMN fecha_aprobacion_individual timestamptz;
  END IF;

  -- Add aprobado_por column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expediente_productos' AND column_name = 'aprobado_por'
  ) THEN
    ALTER TABLE expediente_productos ADD COLUMN aprobado_por uuid REFERENCES usuarios(id);
  END IF;

  -- Add numero_certificado column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expediente_productos' AND column_name = 'numero_certificado'
  ) THEN
    ALTER TABLE expediente_productos ADD COLUMN numero_certificado varchar(100);
  END IF;

  -- Create indexes for new columns
  CREATE INDEX IF NOT EXISTS idx_expediente_productos_estado_individual ON expediente_productos(estado_individual);
  CREATE INDEX IF NOT EXISTS idx_expediente_productos_aprobado_por ON expediente_productos(aprobado_por);
END $$;

-- ============================================
-- 4. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_producto_especificaciones_updated_at
  BEFORE UPDATE ON producto_especificaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aranceles_oficiales_updated_at
  BEFORE UPDATE ON aranceles_oficiales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();