-- Migration: Create facturas_proveedores table with V2 schema
-- The original migration (20251104174535) referenced proyectos(id) and
-- presupuesto_items(id) which don't exist in the V2 DB, so the table
-- was never created. This migration creates it fresh with gestion_id.

CREATE TABLE IF NOT EXISTS facturas_proveedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gestion_id uuid REFERENCES gestiones(id) ON DELETE SET NULL,
  proveedor_id uuid REFERENCES terceros(id) ON DELETE SET NULL,

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

CREATE INDEX IF NOT EXISTS idx_facturas_proveedores_gestion
  ON facturas_proveedores(gestion_id);

CREATE INDEX IF NOT EXISTS idx_facturas_proveedores_proveedor
  ON facturas_proveedores(proveedor_id);

CREATE INDEX IF NOT EXISTS idx_facturas_proveedores_estado
  ON facturas_proveedores(estado_pago);

ALTER TABLE facturas_proveedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to facturas_proveedores"
  ON facturas_proveedores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage facturas_proveedores"
  ON facturas_proveedores FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
