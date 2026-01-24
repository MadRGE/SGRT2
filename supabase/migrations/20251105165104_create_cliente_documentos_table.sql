/*
  # Módulo 24: Documentación Global del Cliente

  1. Nueva Tabla
    - `cliente_documentos`
      - `id` (uuid, primary key) - Identificador único del documento
      - `cliente_id` (uuid, foreign key) - Referencia al cliente propietario
      - `tipo_documento` (text) - Tipo de documento (ej: 'Estatuto', 'Constancia CUIT', 'Poder Legal')
      - `url_archivo` (text) - URL del archivo almacenado en Supabase Storage
      - `fecha_vencimiento` (timestamptz) - Fecha de vencimiento del documento (opcional)
      - `nombre_archivo` (text) - Nombre original del archivo
      - `created_at` (timestamptz) - Fecha de creación

  2. Seguridad (RLS)
    - Enable RLS on `cliente_documentos` table
    - Usuarios autenticados pueden ver documentos de sus propios clientes
    - Solo gestores y admins pueden insertar, actualizar y eliminar documentos

  3. Índices
    - Índice en `cliente_id` para optimizar búsquedas por cliente
*/

CREATE TABLE IF NOT EXISTS cliente_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  tipo_documento TEXT NOT NULL,
  url_archivo TEXT NOT NULL,
  nombre_archivo TEXT NOT NULL,
  fecha_vencimiento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cliente_documentos_cliente ON cliente_documentos(cliente_id);

ALTER TABLE cliente_documentos ENABLE ROW LEVEL SECURITY;

-- Política para lectura: usuarios autenticados pueden ver documentos
CREATE POLICY "Users can view cliente documents"
  ON cliente_documentos FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserción: solo gestores y admins
CREATE POLICY "Gestores and admins can insert cliente documents"
  ON cliente_documentos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- Política para actualización: solo gestores y admins
CREATE POLICY "Gestores and admins can update cliente documents"
  ON cliente_documentos FOR UPDATE
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

-- Política para eliminación: solo gestores y admins
CREATE POLICY "Gestores and admins can delete cliente documents"
  ON cliente_documentos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );