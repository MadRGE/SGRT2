/*
  # Create facturas_proveedores (Provider Invoices) table

  1. New Tables
    - `facturas_proveedores`
      - `id` (uuid, primary key)
      - `proyecto_id` (uuid, FK to proyectos) - Project this expense belongs to
      - `proveedor_id` (uuid, FK to terceros) - Provider who issued the invoice
      - `presupuesto_item_id` (integer, FK to presupuesto_items) - Optional link to budget line item
      - `numero_factura` (text) - Invoice number
      - `fecha_emision` (timestamptz) - Issue date
      - `fecha_vencimiento` (timestamptz) - Due date
      - `monto_total` (numeric) - Total amount
      - `estado_pago` (text) - Payment status: 'pendiente', 'pagada', 'vencida', 'parcial'
      - `fecha_pago` (timestamptz) - Payment date (when marked as paid)
      - `url_archivo_factura` (text) - Link to PDF in storage
      - `notas` (text) - Additional notes
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `facturas_proveedores` table
    - Add policy for public read access
    - Add policy for authenticated users to manage
  
  3. Indexes
    - Index on proyecto_id for fast project lookups
    - Index on proveedor_id for provider filtering
    - Index on estado_pago for status filtering
*/

CREATE TABLE IF NOT EXISTS facturas_proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid REFERENCES proyectos(id) ON DELETE CASCADE NOT NULL,
  proveedor_id uuid REFERENCES terceros(id) ON DELETE SET NULL,
  presupuesto_item_id integer REFERENCES presupuesto_items(id) ON DELETE SET NULL,
  
  numero_factura text NOT NULL,
  fecha_emision timestamptz NOT NULL,
  fecha_vencimiento timestamptz,
  monto_total numeric(12, 2) NOT NULL,
  
  estado_pago text DEFAULT 'pendiente' NOT NULL,
  fecha_pago timestamptz,
  
  url_archivo_factura text,
  notas text,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facturas_proveedores_proyecto 
  ON facturas_proveedores(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_facturas_proveedores_proveedor 
  ON facturas_proveedores(proveedor_id);

CREATE INDEX IF NOT EXISTS idx_facturas_proveedores_estado 
  ON facturas_proveedores(estado_pago);

ALTER TABLE facturas_proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to facturas_proveedores"
  ON facturas_proveedores FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage facturas_proveedores"
  ON facturas_proveedores FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
