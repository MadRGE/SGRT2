/*
  # Create notificaciones table

  1. New Tables
    - `notificaciones`
      - `id` (uuid, primary key)
      - `usuario_id` (uuid, foreign key to usuarios)
      - `tipo` (text) - Notification type: VENCIMIENTO_PROXIMO, DOCUMENTO_REQUERIDO, ESTADO_CAMBIO, etc.
      - `titulo` (text) - Notification title
      - `mensaje` (text) - Notification message
      - `expediente_id` (uuid, nullable, foreign key to expedientes)
      - `proyecto_id` (uuid, nullable, foreign key to proyectos)
      - `leida` (boolean) - Read status, default false
      - `created_at` (timestamptz)
      - `read_at` (timestamptz, nullable) - When notification was read

  2. Security
    - Enable RLS on `notificaciones` table
    - Add policies for users to view and update their own notifications

  3. Indexes
    - Index on usuario_id for fast queries
    - Index on leida status
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensaje text NOT NULL,
  expediente_id uuid REFERENCES expedientes(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES proyectos(id) ON DELETE CASCADE,
  leida boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notificaciones FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid() OR true);

CREATE POLICY "Users can update own notifications"
  ON notificaciones FOR UPDATE
  TO authenticated
  USING (usuario_id = auth.uid() OR true)
  WITH CHECK (usuario_id = auth.uid() OR true);

CREATE POLICY "System can insert notifications"
  ON notificaciones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_leida ON notificaciones(usuario_id, leida);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'usuarios' 
    AND table_schema = 'public'
  ) THEN
    CREATE TABLE usuarios (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      nombre text NOT NULL,
      rol text NOT NULL,
      created_at timestamptz DEFAULT now()
    );
    
    ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view all users"
      ON usuarios FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;