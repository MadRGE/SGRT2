/*
  # Create Procedure Management Enhancement Tables

  This migration adds complementary tables to enhance procedure and document management
  without modifying existing tables. All additions are incremental and non-breaking.

  ## New Tables

  ### 1. procedure_documents
  Maps specific documents to tramite types with detailed requirements
  - `id` (uuid, primary key)
  - `tramite_tipo_id` (varchar, FK to tramite_tipos)
  - `nombre_documento` (text) - Document name
  - `descripcion` (text) - Detailed description
  - `es_obligatorio` (boolean) - Is mandatory
  - `validez_dias` (integer) - Validity period in days
  - `categoria` (text) - Document category
  - `formato_aceptado` (text[]) - Accepted file formats
  - `requisitos_especificos` (jsonb) - Specific requirements
  - `orden` (integer) - Display order
  - `created_at`, `updated_at` (timestamptz)

  ### 2. document_validations
  Stores validation results for documents
  - `id` (uuid, primary key)
  - `documento_id` (uuid, FK to documentos)
  - `tipo_validacion` (text) - Validation type
  - `estado` (text) - Status: pendiente/aprobado/rechazado
  - `resultado` (jsonb) - Validation results
  - `observaciones` (text) - Observations
  - `validado_por` (uuid, FK to usuarios)
  - `validado_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 3. procedure_stages
  Defines workflow stages for each tramite type
  - `id` (uuid, primary key)
  - `tramite_tipo_id` (varchar, FK to tramite_tipos)
  - `nombre` (text) - Stage name
  - `descripcion` (text) - Description
  - `orden` (integer) - Sequential order
  - `duracion_estimada_dias` (integer) - Estimated duration
  - `requiere_aprobacion` (boolean) - Requires approval
  - `documentos_requeridos` (uuid[]) - Required document IDs
  - `acciones_disponibles` (jsonb) - Available actions
  - `created_at`, `updated_at` (timestamptz)

  ### 4. expediente_stages
  Tracks current stage for each expediente
  - `id` (uuid, primary key)
  - `expediente_id` (uuid, FK to expedientes)
  - `stage_id` (uuid, FK to procedure_stages)
  - `estado` (text) - Status: pendiente/en_proceso/completado/bloqueado
  - `fecha_inicio` (timestamptz) - Start date
  - `fecha_completado` (timestamptz) - Completion date
  - `notas` (text) - Notes
  - `completado_por` (uuid, FK to usuarios)
  - `created_at`, `updated_at` (timestamptz)

  ### 5. notification_templates
  Templates for automated notifications
  - `id` (uuid, primary key)
  - `codigo` (text, unique) - Template code
  - `nombre` (text) - Template name
  - `tipo` (text) - Type: email/sistema/sms
  - `asunto` (text) - Subject
  - `contenido` (text) - Content with placeholders
  - `variables` (jsonb) - Available variables
  - `activo` (boolean) - Is active
  - `created_at`, `updated_at` (timestamptz)

  ### 6. fees_configuration
  Fee structure for tramite types
  - `id` (uuid, primary key)
  - `tramite_tipo_id` (varchar, FK to tramite_tipos)
  - `concepto` (text) - Fee concept
  - `monto_base` (decimal) - Base amount
  - `moneda` (text) - Currency (ARS/USD)
  - `tipo_calculo` (text) - Calculation type: fijo/variable/porcentaje
  - `formula` (jsonb) - Calculation formula if variable
  - `vigencia_desde` (date) - Valid from
  - `vigencia_hasta` (date) - Valid until
  - `activo` (boolean) - Is active
  - `created_at`, `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users based on roles
*/

-- Create procedure_documents table
CREATE TABLE IF NOT EXISTS procedure_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tramite_tipo_id varchar REFERENCES tramite_tipos(id) ON DELETE CASCADE,
  nombre_documento text NOT NULL,
  descripcion text,
  es_obligatorio boolean DEFAULT true,
  validez_dias integer,
  categoria text,
  formato_aceptado text[] DEFAULT ARRAY['pdf', 'jpg', 'png'],
  requisitos_especificos jsonb DEFAULT '{}'::jsonb,
  orden integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_validations table
CREATE TABLE IF NOT EXISTS document_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid REFERENCES documentos(id) ON DELETE CASCADE,
  tipo_validacion text NOT NULL,
  estado text NOT NULL CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  resultado jsonb DEFAULT '{}'::jsonb,
  observaciones text,
  validado_por uuid REFERENCES usuarios(id),
  validado_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create procedure_stages table
CREATE TABLE IF NOT EXISTS procedure_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tramite_tipo_id varchar REFERENCES tramite_tipos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  descripcion text,
  orden integer NOT NULL DEFAULT 0,
  duracion_estimada_dias integer,
  requiere_aprobacion boolean DEFAULT false,
  documentos_requeridos uuid[] DEFAULT ARRAY[]::uuid[],
  acciones_disponibles jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expediente_stages table
CREATE TABLE IF NOT EXISTS expediente_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id uuid REFERENCES expedientes(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES procedure_stages(id) ON DELETE CASCADE,
  estado text NOT NULL CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'bloqueado')),
  fecha_inicio timestamptz DEFAULT now(),
  fecha_completado timestamptz,
  notas text,
  completado_por uuid REFERENCES usuarios(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('email', 'sistema', 'sms')),
  asunto text,
  contenido text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fees_configuration table
CREATE TABLE IF NOT EXISTS fees_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tramite_tipo_id varchar REFERENCES tramite_tipos(id) ON DELETE CASCADE,
  concepto text NOT NULL,
  monto_base decimal(10,2) NOT NULL,
  moneda text DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  tipo_calculo text NOT NULL CHECK (tipo_calculo IN ('fijo', 'variable', 'porcentaje')),
  formula jsonb DEFAULT '{}'::jsonb,
  vigencia_desde date DEFAULT CURRENT_DATE,
  vigencia_hasta date,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_procedure_documents_tramite ON procedure_documents(tramite_tipo_id);
CREATE INDEX IF NOT EXISTS idx_document_validations_documento ON document_validations(documento_id);
CREATE INDEX IF NOT EXISTS idx_procedure_stages_tramite ON procedure_stages(tramite_tipo_id);
CREATE INDEX IF NOT EXISTS idx_expediente_stages_expediente ON expediente_stages(expediente_id);
CREATE INDEX IF NOT EXISTS idx_expediente_stages_stage ON expediente_stages(stage_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_codigo ON notification_templates(codigo);
CREATE INDEX IF NOT EXISTS idx_fees_configuration_tramite ON fees_configuration(tramite_tipo_id);

-- Enable RLS on all tables
ALTER TABLE procedure_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE expediente_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees_configuration ENABLE ROW LEVEL SECURITY;

-- RLS Policies for procedure_documents
CREATE POLICY "Authenticated users can view procedure documents"
  ON procedure_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage procedure documents"
  ON procedure_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('admin', 'staff')
    )
  );

-- RLS Policies for document_validations
CREATE POLICY "Users can view validations for their expedientes"
  ON document_validations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documentos d
      JOIN proyectos_legacy_v1 e ON d.expediente_id = e.id
      JOIN proyectos p ON e.proyecto_id = p.id
      WHERE d.id = document_validations.documento_id
      AND (
        p.cliente_id IN (SELECT cliente_id FROM usuarios WHERE id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM usuarios
          WHERE usuarios.id = auth.uid()
          AND usuarios.rol IN ('admin', 'staff', 'despachante')
        )
      )
    )
  );

CREATE POLICY "Staff can create and update validations"
  ON document_validations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('admin', 'staff', 'despachante')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('admin', 'staff', 'despachante')
    )
  );

-- RLS Policies for procedure_stages
CREATE POLICY "Authenticated users can view procedure stages"
  ON procedure_stages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can manage procedure stages"
  ON procedure_stages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('admin', 'staff')
    )
  );

-- RLS Policies for expediente_stages
CREATE POLICY "Users can view stages for their expedientes"
  ON expediente_stages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expedientes e
      JOIN proyectos p ON e.proyecto_id = p.id
      WHERE e.id = expediente_stages.expediente_id
      AND (
        p.cliente_id IN (SELECT cliente_id FROM usuarios WHERE id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM usuarios
          WHERE usuarios.id = auth.uid()
          AND usuarios.rol IN ('admin', 'staff', 'despachante')
        )
      )
    )
  );

CREATE POLICY "Staff can manage expediente stages"
  ON expediente_stages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('admin', 'staff', 'despachante')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('admin', 'staff', 'despachante')
    )
  );

-- RLS Policies for notification_templates
CREATE POLICY "Authenticated users can view active notification templates"
  ON notification_templates FOR SELECT
  TO authenticated
  USING (activo = true);

CREATE POLICY "Admin users can manage notification templates"
  ON notification_templates FOR ALL
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

-- RLS Policies for fees_configuration
CREATE POLICY "Authenticated users can view active fees"
  ON fees_configuration FOR SELECT
  TO authenticated
  USING (activo = true);

CREATE POLICY "Admin users can manage fees configuration"
  ON fees_configuration FOR ALL
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

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_procedure_documents_updated_at BEFORE UPDATE ON procedure_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procedure_stages_updated_at BEFORE UPDATE ON procedure_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expediente_stages_updated_at BEFORE UPDATE ON expediente_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fees_configuration_updated_at BEFORE UPDATE ON fees_configuration
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();