/*
  # Módulo 25: Seguimiento de Logística (Muestras y Terceros)

  1. Nueva Tabla
    - `expediente_tareas_terceros`
      - `id` (uuid, primary key) - Identificador único de la tarea
      - `expediente_id` (uuid, foreign key) - Referencia al expediente
      - `proveedor_id` (uuid, foreign key) - Referencia al proveedor/tercero (tabla terceros del Módulo 18)
      - `descripcion_tarea` (text) - Descripción de la tarea (ej: 'Envío de Muestra para Ensayo EN 71-1')
      - `estado` (varchar) - Estado de la tarea: 'pendiente', 'enviado', 'en_laboratorio', 'informe_recibido'
      - `fecha_envio` (timestamptz) - Fecha en que se envió la muestra/documento
      - `fecha_recepcion_informe` (timestamptz) - Fecha en que se recibió el informe/resultado
      - `url_informe_resultado` (text) - URL del informe/resultado almacenado
      - `notas` (text) - Notas adicionales sobre la tarea
      - `created_at` (timestamptz) - Fecha de creación

  2. Seguridad (RLS)
    - Enable RLS on `expediente_tareas_terceros` table
    - Usuarios autenticados pueden ver tareas
    - Solo gestores y admins pueden crear, actualizar y eliminar tareas

  3. Índices
    - Índice en `expediente_id` para optimizar búsquedas por expediente
    - Índice en `proveedor_id` para optimizar búsquedas por proveedor
*/

CREATE TABLE IF NOT EXISTS expediente_tareas_terceros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expediente_id UUID REFERENCES expedientes(id) ON DELETE CASCADE NOT NULL,
  proveedor_id UUID REFERENCES terceros(id) ON DELETE SET NULL,
  descripcion_tarea TEXT NOT NULL,
  estado VARCHAR(50) DEFAULT 'pendiente',
  fecha_envio TIMESTAMPTZ,
  fecha_recepcion_informe TIMESTAMPTZ,
  url_informe_resultado TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exp_tareas_terceros_exp ON expediente_tareas_terceros(expediente_id);
CREATE INDEX IF NOT EXISTS idx_exp_tareas_terceros_prov ON expediente_tareas_terceros(proveedor_id);

ALTER TABLE expediente_tareas_terceros ENABLE ROW LEVEL SECURITY;

-- Política para lectura: usuarios autenticados pueden ver tareas
CREATE POLICY "Users can view expediente tareas terceros"
  ON expediente_tareas_terceros FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserción: solo gestores y admins
CREATE POLICY "Gestores and admins can insert tareas terceros"
  ON expediente_tareas_terceros FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- Política para actualización: solo gestores y admins
CREATE POLICY "Gestores and admins can update tareas terceros"
  ON expediente_tareas_terceros FOR UPDATE
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
CREATE POLICY "Gestores and admins can delete tareas terceros"
  ON expediente_tareas_terceros FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );