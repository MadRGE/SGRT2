-- Create anmat_casos table for ANMAT case management

CREATE TABLE IF NOT EXISTS anmat_casos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones principales
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  division_id UUID NOT NULL REFERENCES anmat_divisiones(id),

  -- Información básica del caso
  referencia_cliente VARCHAR(100),
  descripcion_cliente TEXT NOT NULL,
  fuente_contacto VARCHAR(20) DEFAULT 'EMAIL',
  es_urgente BOOLEAN DEFAULT false,
  fecha_ingreso_puerto DATE,
  cantidad_skus INTEGER,

  -- Estado del caso
  estado VARCHAR(20) DEFAULT 'INTAKE',

  -- Campos específicos por división (JSON para flexibilidad)
  datos_especificos JSONB DEFAULT '{}',

  -- Auditoría
  created_by UUID REFERENCES usuarios(id),
  asignado_a UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_anmat_casos_cliente ON anmat_casos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_anmat_casos_division ON anmat_casos(division_id);
CREATE INDEX IF NOT EXISTS idx_anmat_casos_estado ON anmat_casos(estado);
CREATE INDEX IF NOT EXISTS idx_anmat_casos_asignado ON anmat_casos(asignado_a);
CREATE INDEX IF NOT EXISTS idx_anmat_casos_created ON anmat_casos(created_at DESC);

-- Enable RLS
ALTER TABLE anmat_casos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Allow authenticated users to read anmat_casos"
  ON anmat_casos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert anmat_casos"
  ON anmat_casos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update anmat_casos"
  ON anmat_casos
  FOR UPDATE
  TO authenticated
  USING (true);
