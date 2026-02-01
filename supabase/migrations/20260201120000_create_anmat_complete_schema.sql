-- Complete ANMAT module schema
-- Creates all missing tables and views for the ANMAT module

-- 1. ANMAT Comunicaciones (para tracking de comunicaciones con clientes)
CREATE TABLE IF NOT EXISTS anmat_comunicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES anmat_casos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL DEFAULT 'NOTA', -- NOTA, EMAIL, LLAMADA, WHATSAPP
  contenido TEXT NOT NULL,
  es_interno BOOLEAN DEFAULT false,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anmat_comunicaciones_caso ON anmat_comunicaciones(caso_id);

-- 2. ANMAT Materiales (catálogo de materiales para envases)
CREATE TABLE IF NOT EXISTS anmat_materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50), -- PLASTICO, VIDRIO, METAL, CARTON, MULTICAPA
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed materiales básicos
INSERT INTO anmat_materiales (codigo, nombre, tipo) VALUES
  ('PET', 'Polietileno Tereftalato (PET)', 'PLASTICO'),
  ('PEAD', 'Polietileno Alta Densidad (PEAD)', 'PLASTICO'),
  ('PEBD', 'Polietileno Baja Densidad (PEBD)', 'PLASTICO'),
  ('PP', 'Polipropileno (PP)', 'PLASTICO'),
  ('PS', 'Poliestireno (PS)', 'PLASTICO'),
  ('VIDRIO', 'Vidrio', 'VIDRIO'),
  ('ALUMINIO', 'Aluminio', 'METAL'),
  ('HOJALATA', 'Hojalata', 'METAL'),
  ('CARTON', 'Cartón', 'CARTON'),
  ('MULTICAPA', 'Material Multicapa', 'MULTICAPA')
ON CONFLICT (codigo) DO NOTHING;

-- 3. ANMAT Familias (agrupación de productos similares)
CREATE TABLE IF NOT EXISTS anmat_familias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES anmat_casos(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  material_principal_id UUID REFERENCES anmat_materiales(id),
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anmat_familias_caso ON anmat_familias(caso_id);

-- 4. ANMAT Caso Productos (productos individuales dentro de un caso)
CREATE TABLE IF NOT EXISTS anmat_caso_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES anmat_casos(id) ON DELETE CASCADE,
  familia_id UUID REFERENCES anmat_familias(id) ON DELETE SET NULL,
  nombre VARCHAR(200) NOT NULL,
  marca VARCHAR(100),
  presentacion VARCHAR(100),
  capacidad VARCHAR(50),
  material_id UUID REFERENCES anmat_materiales(id),
  codigo_producto VARCHAR(50),
  estado VARCHAR(20) DEFAULT 'PENDIENTE',
  datos_adicionales JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anmat_productos_caso ON anmat_caso_productos(caso_id);
CREATE INDEX IF NOT EXISTS idx_anmat_productos_familia ON anmat_caso_productos(familia_id);

-- 5. ANMAT Documentos (documentos asociados a casos)
CREATE TABLE IF NOT EXISTS anmat_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES anmat_casos(id) ON DELETE CASCADE,
  familia_id UUID REFERENCES anmat_familias(id) ON DELETE SET NULL,
  tipo_documento VARCHAR(50) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  archivo_url TEXT,
  archivo_nombre VARCHAR(200),
  estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, RECIBIDO, APROBADO, RECHAZADO
  fecha_vencimiento DATE,
  notas TEXT,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anmat_documentos_caso ON anmat_documentos(caso_id);
CREATE INDEX IF NOT EXISTS idx_anmat_documentos_familia ON anmat_documentos(familia_id);

-- 6. Vista para dashboard de casos ANMAT
CREATE OR REPLACE VIEW v_anmat_dashboard AS
SELECT
  c.id,
  c.estado,
  c.es_urgente,
  c.descripcion_cliente,
  c.referencia_cliente,
  c.fuente_contacto,
  c.cantidad_skus,
  c.fecha_ingreso_puerto,
  c.datos_especificos,
  c.created_at,
  c.updated_at,
  cl.id as cliente_id,
  cl.razon_social as cliente_razon_social,
  cl.cuit as cliente_cuit,
  d.id as division_id,
  d.codigo as division_codigo,
  d.nombre as division_nombre,
  u.id as asignado_id,
  u.nombre as asignado_nombre,
  (SELECT COUNT(*) FROM anmat_caso_productos p WHERE p.caso_id = c.id) as total_productos,
  (SELECT COUNT(*) FROM anmat_familias f WHERE f.caso_id = c.id) as total_familias,
  (SELECT COUNT(*) FROM anmat_documentos doc WHERE doc.caso_id = c.id) as total_documentos
FROM anmat_casos c
LEFT JOIN clientes cl ON c.cliente_id = cl.id
LEFT JOIN anmat_divisiones d ON c.division_id = d.id
LEFT JOIN usuarios u ON c.asignado_a = u.id;

-- RLS Policies
ALTER TABLE anmat_comunicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE anmat_materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE anmat_familias ENABLE ROW LEVEL SECURITY;
ALTER TABLE anmat_caso_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE anmat_documentos ENABLE ROW LEVEL SECURITY;

-- Policies para lectura
CREATE POLICY "Allow authenticated to read anmat_comunicaciones" ON anmat_comunicaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to read anmat_materiales" ON anmat_materiales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to read anmat_familias" ON anmat_familias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to read anmat_caso_productos" ON anmat_caso_productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to read anmat_documentos" ON anmat_documentos FOR SELECT TO authenticated USING (true);

-- Policies para inserción
CREATE POLICY "Allow authenticated to insert anmat_comunicaciones" ON anmat_comunicaciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated to insert anmat_familias" ON anmat_familias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated to insert anmat_caso_productos" ON anmat_caso_productos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated to insert anmat_documentos" ON anmat_documentos FOR INSERT TO authenticated WITH CHECK (true);

-- Policies para actualización
CREATE POLICY "Allow authenticated to update anmat_comunicaciones" ON anmat_comunicaciones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated to update anmat_familias" ON anmat_familias FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated to update anmat_caso_productos" ON anmat_caso_productos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated to update anmat_documentos" ON anmat_documentos FOR UPDATE TO authenticated USING (true);

-- Policies para eliminación
CREATE POLICY "Allow authenticated to delete anmat_comunicaciones" ON anmat_comunicaciones FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated to delete anmat_familias" ON anmat_familias FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated to delete anmat_caso_productos" ON anmat_caso_productos FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow authenticated to delete anmat_documentos" ON anmat_documentos FOR DELETE TO authenticated USING (true);
