/*
  # Create Cotizaciones (Quotations) System

  ## Overview
  This migration creates a complete pre-project quotation system with margin calculation
  capabilities for managing client quotes before converting them to formal projects.

  ## New Tables

  1. **contactos_temporales** - Temporary contacts/leads before becoming formal clients
    - `id` (uuid, primary key)
    - `nombre_empresa` (text) - Company name
    - `nombre_contacto` (text) - Contact person name
    - `telefono` (text) - Phone number
    - `email` (text) - Email address
    - `origen` (text) - Lead source (whatsapp, referido, web, etc)
    - `estado` (text) - Status (nuevo, calificado, convertido)
    - `notas` (text) - Notes about the contact
    - `created_at` (timestamptz)

  2. **cotizaciones** - Quotations/quotes before formal projects
    - `id` (uuid, primary key)
    - `numero_cotizacion` (text, unique) - Quote number
    - `cliente_id` (uuid, nullable) - Reference to formal client
    - `contacto_temporal_id` (uuid, nullable) - Reference to temporary contact
    - `nombre_cliente` (text) - Client/contact name for display
    - `estado` (text) - Status (borrador, enviada, negociacion, aceptada, rechazada, vencida, convertida)
    - `fecha_emision` (date) - Issue date
    - `fecha_vencimiento` (date) - Expiration date
    - `costo_total` (decimal) - Total costs
    - `precio_total` (decimal) - Total price to charge
    - `margen_total` (decimal) - Total margin amount
    - `margen_porcentaje` (decimal) - Margin percentage
    - `observaciones` (text) - Notes and special conditions
    - `proyecto_id` (uuid, nullable) - Link to converted project
    - `veces_compartida` (integer) - Times shared counter
    - `url_publica` (text) - Public shareable URL slug
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  3. **cotizacion_items** - Line items for each quotation
    - `id` (serial, primary key)
    - `cotizacion_id` (uuid) - Reference to quotation
    - `tramite_tipo_id` (varchar) - Reference to procedure type from catalog
    - `concepto` (text) - Item description
    - `tipo` (text) - Type (honorarios, tasas, analisis, otros)
    - `costo_base` (decimal) - Base cost
    - `precio_venta` (decimal) - Selling price
    - `margen_unitario` (decimal) - Unit margin
    - `margen_porcentaje` (decimal) - Margin percentage
    - `cantidad` (integer) - Quantity
    - `subtotal_costo` (decimal) - Calculated total cost
    - `subtotal_precio` (decimal) - Calculated total price
    - `created_at` (timestamptz)

  4. **configuracion_margenes** - Configuration for margins and pricing
    - `id` (serial, primary key)
    - `categoria` (text) - Category (honorarios, tasas, analisis, otros)
    - `margen_minimo` (decimal) - Minimum acceptable margin %
    - `margen_objetivo` (decimal) - Target margin %
    - `activo` (boolean) - Active flag
    - `notas` (text) - Notes
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Authenticated users can view all records
  - Only gestores and admins can create/modify
*/

-- ============================================
-- CONTACTOS TEMPORALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contactos_temporales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_empresa TEXT NOT NULL,
  nombre_contacto TEXT,
  telefono TEXT,
  email TEXT,
  origen TEXT DEFAULT 'whatsapp',
  estado TEXT DEFAULT 'nuevo',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contactos_temporales_estado ON contactos_temporales(estado);
CREATE INDEX IF NOT EXISTS idx_contactos_temporales_created ON contactos_temporales(created_at DESC);

ALTER TABLE contactos_temporales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contactos_temporales"
  ON contactos_temporales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can manage contactos_temporales"
  ON contactos_temporales FOR ALL
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
-- COTIZACIONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_cotizacion TEXT UNIQUE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  contacto_temporal_id UUID REFERENCES contactos_temporales(id) ON DELETE SET NULL,
  nombre_cliente TEXT NOT NULL,
  estado TEXT DEFAULT 'borrador',
  fecha_emision DATE DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  costo_total DECIMAL(12, 2) DEFAULT 0,
  precio_total DECIMAL(12, 2) DEFAULT 0,
  margen_total DECIMAL(12, 2) DEFAULT 0,
  margen_porcentaje DECIMAL(5, 2) DEFAULT 0,
  observaciones TEXT,
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE SET NULL,
  veces_compartida INTEGER DEFAULT 0,
  url_publica TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_contacto ON cotizaciones(contacto_temporal_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_created ON cotizaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_url ON cotizaciones(url_publica);

ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cotizaciones"
  ON cotizaciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view shared cotizaciones"
  ON cotizaciones FOR SELECT
  TO anon
  USING (url_publica IS NOT NULL);

CREATE POLICY "Gestores and admins can manage cotizaciones"
  ON cotizaciones FOR ALL
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
-- COTIZACION ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cotizacion_items (
  id SERIAL PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE NOT NULL,
  tramite_tipo_id VARCHAR(50) REFERENCES tramite_tipos(id) ON DELETE SET NULL,
  concepto TEXT NOT NULL,
  tipo TEXT DEFAULT 'honorarios',
  costo_base DECIMAL(12, 2) DEFAULT 0,
  precio_venta DECIMAL(12, 2) DEFAULT 0,
  margen_unitario DECIMAL(12, 2) DEFAULT 0,
  margen_porcentaje DECIMAL(5, 2) DEFAULT 0,
  cantidad INTEGER DEFAULT 1,
  subtotal_costo DECIMAL(12, 2) DEFAULT 0,
  subtotal_precio DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotizacion_items_cotizacion ON cotizacion_items(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_tramite ON cotizacion_items(tramite_tipo_id);

ALTER TABLE cotizacion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cotizacion_items"
  ON cotizacion_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view items of shared cotizaciones"
  ON cotizacion_items FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM cotizaciones
      WHERE cotizaciones.id = cotizacion_items.cotizacion_id
      AND cotizaciones.url_publica IS NOT NULL
    )
  );

CREATE POLICY "Gestores and admins can manage cotizacion_items"
  ON cotizacion_items FOR ALL
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
-- CONFIGURACION MARGENES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS configuracion_margenes (
  id SERIAL PRIMARY KEY,
  categoria TEXT NOT NULL UNIQUE,
  margen_minimo DECIMAL(5, 2) DEFAULT 20,
  margen_objetivo DECIMAL(5, 2) DEFAULT 40,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE configuracion_margenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view configuracion_margenes"
  ON configuracion_margenes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage configuracion_margenes"
  ON configuracion_margenes FOR ALL
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
-- SEED CONFIGURACION MARGENES
-- ============================================
INSERT INTO configuracion_margenes (categoria, margen_minimo, margen_objetivo, notas)
VALUES 
  ('honorarios', 25, 45, 'Margen para servicios de honorarios profesionales'),
  ('tasas', 15, 30, 'Margen para tasas y aranceles oficiales'),
  ('analisis', 20, 35, 'Margen para análisis y certificaciones'),
  ('otros', 20, 40, 'Margen para otros gastos y servicios')
ON CONFLICT (categoria) DO NOTHING;

-- ============================================
-- FUNCTION: Generate unique quote number
-- ============================================
CREATE OR REPLACE FUNCTION generate_numero_cotizacion()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_month TEXT;
  counter INTEGER;
BEGIN
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_cotizacion FROM 10) AS INTEGER)), 0) + 1
  INTO counter
  FROM cotizaciones
  WHERE numero_cotizacion LIKE 'COT-' || year_month || '-%';
  
  new_number := 'COT-' || year_month || '-' || LPAD(counter::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Generate unique public URL
-- ============================================
CREATE OR REPLACE FUNCTION generate_url_publica()
RETURNS TEXT AS $$
DECLARE
  new_url TEXT;
  url_exists BOOLEAN;
BEGIN
  LOOP
    new_url := SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 12);
    
    SELECT EXISTS(SELECT 1 FROM cotizaciones WHERE url_publica = new_url) INTO url_exists;
    
    EXIT WHEN NOT url_exists;
  END LOOP;
  
  RETURN new_url;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-generate numero_cotizacion
-- ============================================
CREATE OR REPLACE FUNCTION trigger_generate_numero_cotizacion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_cotizacion IS NULL OR NEW.numero_cotizacion = '' THEN
    NEW.numero_cotizacion := generate_numero_cotizacion();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_cotizacion
  BEFORE INSERT ON cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_numero_cotizacion();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_update_cotizacion
  BEFORE UPDATE ON cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_timestamp();