/*
  # Migration to v7 Architecture - Part 2: Core Entity Tables

  This migration creates the core tables for the v7 architecture:
  - productos: Product catalog per client
  - proyectos: Project container (replaces old single-expediente model)
  - expedientes: New expedientes table linked to projects
  - Junction tables for N-to-N relationships

  ## New Architecture (v7)
  1. Products Table
    - `productos` - Product catalog with client association
  
  2. Management Tables
    - `proyectos` - Project container (1-to-N with expedientes)
    - `expedientes` - Individual regulatory procedures

  3. Junction Tables (N-to-N)
    - `proyecto_productos` - Links projects to multiple products
    - `expediente_productos` - Links expedientes to specific products

  ## Security
  - RLS enabled on all tables
  - Authenticated users can view all records
  - Only gestores and admins can modify records
*/

-- ============================================
-- 2.1 PRODUCTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  rubro VARCHAR(100),
  pais_origen VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productos_cliente ON productos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_productos_rubro ON productos(rubro);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view productos"
  ON productos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can insert productos"
  ON productos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

CREATE POLICY "Gestores and admins can update productos"
  ON productos FOR UPDATE
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

CREATE POLICY "Gestores and admins can delete productos"
  ON productos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- 2.2 PROYECTOS TABLE (v7)
-- ============================================
CREATE TABLE IF NOT EXISTS proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_proyecto TEXT NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  estado TEXT DEFAULT 'relevamiento',
  prioridad TEXT DEFAULT 'normal',
  fecha_inicio TIMESTAMPTZ DEFAULT now(),
  fecha_cierre TIMESTAMPTZ,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proyectos_cliente ON proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado);

ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proyectos"
  ON proyectos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can insert proyectos"
  ON proyectos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

CREATE POLICY "Gestores and admins can update proyectos"
  ON proyectos FOR UPDATE
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

CREATE POLICY "Gestores and admins can delete proyectos"
  ON proyectos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- 2.3 EXPEDIENTES TABLE (v7 - NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS expedientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_expedientes_proyecto ON expedientes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_tramite_tipo ON expedientes(tramite_tipo_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON expedientes(estado);
CREATE INDEX IF NOT EXISTS idx_expedientes_semaforo ON expedientes(semaforo);

ALTER TABLE expedientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expedientes"
  ON expedientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can insert expedientes"
  ON expedientes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

CREATE POLICY "Gestores and admins can update expedientes"
  ON expedientes FOR UPDATE
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

CREATE POLICY "Gestores and admins can delete expedientes"
  ON expedientes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- 2.4 JUNCTION TABLES (N-to-N)
-- ============================================

-- Proyecto -> Productos (N-to-N)
CREATE TABLE IF NOT EXISTS proyecto_productos (
  id SERIAL PRIMARY KEY,
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE NOT NULL,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(proyecto_id, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_proyecto_productos_proyecto ON proyecto_productos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_productos_producto ON proyecto_productos(producto_id);

ALTER TABLE proyecto_productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view proyecto_productos"
  ON proyecto_productos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can manage proyecto_productos"
  ON proyecto_productos FOR ALL
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

-- Expediente -> Productos (N-to-N)
CREATE TABLE IF NOT EXISTS expediente_productos (
  id SERIAL PRIMARY KEY,
  expediente_id UUID REFERENCES expedientes(id) ON DELETE CASCADE NOT NULL,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(expediente_id, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_expediente_productos_expediente ON expediente_productos(expediente_id);
CREATE INDEX IF NOT EXISTS idx_expediente_productos_producto ON expediente_productos(producto_id);

ALTER TABLE expediente_productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expediente_productos"
  ON expediente_productos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestores and admins can manage expediente_productos"
  ON expediente_productos FOR ALL
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