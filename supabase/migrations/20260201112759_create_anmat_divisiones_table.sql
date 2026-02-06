-- Create anmat_divisiones table and seed initial data

-- Create table if not exists
CREATE TABLE IF NOT EXISTS anmat_divisiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for active divisions
CREATE INDEX IF NOT EXISTS idx_anmat_divisiones_activo ON anmat_divisiones(activo);

-- Insert initial ANMAT divisions
INSERT INTO anmat_divisiones (codigo, nombre, descripcion, activo) VALUES
  ('ALIMENTOS', 'Alimentos', 'Registro Nacional de Productos Alimenticios (RNPA) y establecimientos alimenticios', true),
  ('MEDICAMENTOS', 'Medicamentos', 'Registro de especialidades medicinales, drogueras y farmacias', true),
  ('PROD_MEDICOS', 'Productos Médicos', 'Registro de productos médicos y tecnología biomédica', true),
  ('COSMETICOS', 'Cosméticos', 'Registro de productos cosméticos y de higiene personal', true),
  ('USO_DOMESTICO', 'Productos de Uso Doméstico', 'Registro de productos domisanitarios y de limpieza', true),
  ('REACTIVOS', 'Reactivos de Diagnóstico', 'Registro de reactivos de diagnóstico in vitro', true),
  ('SUPLEMENTOS', 'Suplementos Dietarios', 'Registro de suplementos dietarios', true)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activo = EXCLUDED.activo,
  updated_at = now();

-- Enable RLS
ALTER TABLE anmat_divisiones ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read
CREATE POLICY "Allow authenticated users to read anmat_divisiones"
  ON anmat_divisiones
  FOR SELECT
  TO authenticated
  USING (true);
