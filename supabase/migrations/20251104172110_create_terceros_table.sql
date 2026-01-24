/*
  # Create terceros (providers/third parties) table

  1. New Tables
    - `terceros`
      - `id` (uuid, primary key)
      - `nombre` (text) - Provider name
      - `cuit` (text, unique) - Tax ID
      - `email` (text) - Contact email
      - `telefono` (text) - Phone number
      - `tipo` (text) - Type: laboratorio, ocp, broker_aduanal, rt, otro
      - `direccion` (text) - Address
      - `notas` (text) - Additional notes
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `terceros` table
    - Add policy for public read access (catalog table)
    - Add policy for authenticated users to manage
*/

CREATE TABLE IF NOT EXISTS terceros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  cuit text UNIQUE NOT NULL,
  email text,
  telefono text,
  tipo text NOT NULL DEFAULT 'otro',
  direccion text,
  notas text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE terceros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to terceros"
  ON terceros FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage terceros"
  ON terceros FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
