-- Products table (ficha de producto para certificados)
CREATE TABLE IF NOT EXISTS productos_certificados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  marca TEXT,
  pais_origen TEXT,
  ncm TEXT,
  tipo_producto TEXT,
  metadata JSONB,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cliente_id, codigo)
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos_certificados(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id),
  organismo TEXT NOT NULL, -- ANMAT | SENASA | INAL | ARCA | INPI | otro
  tipo TEXT NOT NULL, -- registro | habilitacion | certificado | permiso | inscripcion | libre_venta
  titulo TEXT NOT NULL,
  referencia TEXT,
  estado TEXT DEFAULT 'vigente', -- vigente | vencido | cancelado | suspendido | en_renovacion
  fecha_emision TIMESTAMPTZ,
  fecha_vencimiento TIMESTAMPTZ,
  archivo_path TEXT,
  archivo_size INT,
  notas TEXT,
  resolucion TEXT,
  requiere_qr BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- DJC table
CREATE TABLE IF NOT EXISTS djcs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos_certificados(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id),
  resolucion TEXT,
  estado TEXT DEFAULT 'borrador', -- borrador | generada | pendiente_firma | firmada
  fuente TEXT DEFAULT 'sistema', -- sistema | cliente
  representante TEXT,
  representante_cuit TEXT,
  representante_domicilio TEXT,
  archivo_path TEXT,
  archivo_firmado_path TEXT,
  firmado_at TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- QR Access log
CREATE TABLE IF NOT EXISTS qr_accesos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos_certificados(id) ON DELETE CASCADE,
  ip TEXT,
  user_agent TEXT,
  referer TEXT,
  pais TEXT,
  accion TEXT DEFAULT 'view', -- view | certificate | djc
  detalle TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prod_cert_cliente ON productos_certificados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_prod_cert_uuid ON productos_certificados(uuid);
CREATE INDEX IF NOT EXISTS idx_certificados_producto ON certificados(producto_id);
CREATE INDEX IF NOT EXISTS idx_certificados_cliente ON certificados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_certificados_estado ON certificados(estado);
CREATE INDEX IF NOT EXISTS idx_certificados_organismo ON certificados(organismo);
CREATE INDEX IF NOT EXISTS idx_djcs_producto ON djcs(producto_id);
CREATE INDEX IF NOT EXISTS idx_djcs_cliente ON djcs(cliente_id);
CREATE INDEX IF NOT EXISTS idx_qr_accesos_producto ON qr_accesos(producto_id);
CREATE INDEX IF NOT EXISTS idx_qr_accesos_created ON qr_accesos(created_at);

-- RLS
ALTER TABLE productos_certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE djcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_accesos ENABLE ROW LEVEL SECURITY;

-- Policies - authenticated can do everything (filtered at app level)
CREATE POLICY "auth_all_productos_cert" ON productos_certificados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_certificados" ON certificados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_djcs" ON djcs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_qr_accesos" ON qr_accesos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public read for passport (QR scans)
CREATE POLICY "public_read_productos_cert" ON productos_certificados FOR SELECT TO anon USING (activo = true);
CREATE POLICY "public_read_certificados" ON certificados FOR SELECT TO anon USING (estado IN ('vigente', 'en_renovacion'));
CREATE POLICY "public_read_djcs" ON djcs FOR SELECT TO anon USING (estado IN ('generada', 'firmada'));
CREATE POLICY "public_insert_qr_accesos" ON qr_accesos FOR INSERT TO anon WITH CHECK (true);
