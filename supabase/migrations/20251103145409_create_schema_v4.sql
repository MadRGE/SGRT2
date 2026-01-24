/*
  # SGT v5 - Schema Creation (Architecture v4)

  1. Catalog Tables (The "Brain")
    - `organismos` - Government organizations
    - `tramite_tipos` - Master catalog of all procedure types
    - `tramite_checklists` - Document requirements per procedure type

  2. Entity Tables
    - `clientes` - Clients/companies
    - `productos` - Products

  3. Management Tables (Architecture v4)
    - `proyectos` - Projects (parent entity)
    - `expedientes` - Procedures/cases (children of projects)
    - `documentos` - Documents per expediente

  4. Financial Tables
    - `presupuestos` - Budgets (linked to projects)
    - `presupuesto_items` - Budget line items

  5. Support Tables
    - `usuarios` - Users
    - `historial` - Audit log

  Security:
    - RLS enabled on all tables
    - Policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATALOG TABLES
CREATE TABLE IF NOT EXISTS organismos (
  id VARCHAR(50) PRIMARY KEY,
  sigla VARCHAR(20) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  plataforma_presentacion VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS tramite_tipos (
  id VARCHAR(50) PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(200) NOT NULL,
  organismo_id VARCHAR(50) REFERENCES organismos(id),
  rubro VARCHAR(100),
  base_legal TEXT[],
  renovacion VARCHAR(100),
  sla_total_dias INTEGER DEFAULT 30,
  admite_equivalencia BOOLEAN DEFAULT false,
  logica_especial VARCHAR(20),
  es_habilitacion_previa BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS tramite_checklists (
  id SERIAL PRIMARY KEY,
  tramite_tipo_id VARCHAR(50) REFERENCES tramite_tipos(id),
  item VARCHAR(300) NOT NULL,
  obligatorio BOOLEAN DEFAULT true,
  responsable VARCHAR(50) DEFAULT 'cliente',
  grupo VARCHAR(100)
);

-- 2. ENTITY TABLES
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social TEXT NOT NULL,
  cuit TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  marca VARCHAR(100),
  rubro VARCHAR(100),
  pais_origen VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MANAGEMENT TABLES (ARCHITECTURE v4)
CREATE TABLE IF NOT EXISTS proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_proyecto TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id) NOT NULL,
  producto_id UUID REFERENCES productos(id) NOT NULL,
  estado TEXT DEFAULT 'relevamiento',
  prioridad TEXT DEFAULT 'normal',
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expedientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  proyecto_id UUID REFERENCES proyectos(id) NOT NULL,
  tramite_tipo_id VARCHAR(50) REFERENCES tramite_tipos(id) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'iniciado',
  fecha_limite TIMESTAMPTZ NOT NULL,
  fecha_finalizacion TIMESTAMPTZ,
  paso_actual INTEGER DEFAULT 1,
  progreso INTEGER DEFAULT 0,
  semaforo TEXT DEFAULT 'verde',
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID REFERENCES expedientes(id) NOT NULL,
  checklist_item_id INTEGER REFERENCES tramite_checklists(id),
  nombre TEXT NOT NULL,
  url_archivo TEXT,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. FINANCIAL TABLES
CREATE TABLE IF NOT EXISTS presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) UNIQUE NOT NULL,
  estado VARCHAR(50) DEFAULT 'borrador',
  total_final DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS presupuesto_items (
  id SERIAL PRIMARY KEY,
  presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE CASCADE,
  expediente_id UUID REFERENCES expedientes(id) NULL,
  concepto VARCHAR(200) NOT NULL,
  tipo VARCHAR(50),
  monto DECIMAL(10, 2) NOT NULL
);

-- 5. SUPPORT TABLES
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  rol VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id),
  expediente_id UUID REFERENCES expedientes(id),
  accion TEXT NOT NULL,
  descripcion TEXT,
  usuario_id UUID REFERENCES usuarios(id),
  fecha TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE organismos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tramite_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tramite_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuesto_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON organismos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON tramite_tipos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON tramite_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON productos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON proyectos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON expedientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON documentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON presupuestos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON presupuesto_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON historial FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tramite_tipos_organismo ON tramite_tipos(organismo_id);
CREATE INDEX IF NOT EXISTS idx_tramite_checklists_tipo ON tramite_checklists(tramite_tipo_id);
CREATE INDEX IF NOT EXISTS idx_productos_cliente ON productos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_cliente ON proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_proyecto ON expedientes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_tramite_tipo ON expedientes(tramite_tipo_id);
CREATE INDEX IF NOT EXISTS idx_documentos_expediente ON documentos(expediente_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto ON presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_presupuesto_items_presupuesto ON presupuesto_items(presupuesto_id);