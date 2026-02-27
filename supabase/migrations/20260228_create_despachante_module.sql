-- ============================================================================
-- Módulo Despachante de Aduanas
-- 5 tablas + ALTER seguimientos + RLS + indexes + triggers
-- ============================================================================

-- ── 1. despachante_clientes (asignación despachante ↔ cliente) ──────────────

CREATE TABLE IF NOT EXISTS despachante_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  despachante_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  activo boolean NOT NULL DEFAULT true,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(despachante_id, cliente_id)
);

CREATE INDEX idx_despachante_clientes_despachante ON despachante_clientes(despachante_id);
CREATE INDEX idx_despachante_clientes_cliente ON despachante_clientes(cliente_id);

-- ── 2. despachos (entidad principal) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS despachos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  despachante_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  gestion_id uuid REFERENCES gestiones(id) ON DELETE SET NULL,
  tramite_id uuid REFERENCES tramites(id) ON DELETE SET NULL,

  -- Auto-numeración
  numero_despacho text NOT NULL UNIQUE,

  -- Tipo
  tipo text NOT NULL CHECK (tipo IN ('importacion', 'exportacion')),

  -- Estado (máquina de estados)
  estado text NOT NULL DEFAULT 'en_preparacion'
    CHECK (estado IN ('en_preparacion', 'presentado', 'canal_verde', 'canal_naranja', 'canal_rojo', 'liberado', 'rechazado')),

  -- Mercadería
  descripcion text,
  posicion_arancelaria text, -- NCM
  valor_fob numeric(14,2),
  valor_cif numeric(14,2),
  moneda text NOT NULL DEFAULT 'USD',
  peso_kg numeric(12,2),
  cantidad_bultos integer,

  -- Transporte
  numero_guia text, -- BL / AWB
  booking_number text,

  -- Fechas del proceso
  fecha_presentacion date,
  fecha_oficializacion date,
  fecha_canal date,
  fecha_liberacion date,

  -- Meta
  prioridad text NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
  observaciones text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_despachos_despachante ON despachos(despachante_id);
CREATE INDEX idx_despachos_cliente ON despachos(cliente_id);
CREATE INDEX idx_despachos_estado ON despachos(estado);
CREATE INDEX idx_despachos_numero ON despachos(numero_despacho);
CREATE INDEX idx_despachos_deleted ON despachos(deleted_at) WHERE deleted_at IS NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_despacho_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_despachos_updated_at
  BEFORE UPDATE ON despachos
  FOR EACH ROW EXECUTE FUNCTION update_despacho_updated_at();

-- ── 3. despacho_documentos ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS despacho_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  despacho_id uuid NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo_documento text NOT NULL DEFAULT 'otro'
    CHECK (tipo_documento IN (
      'dua', 'permiso_embarque', 'certificado_origen', 'factura_comercial',
      'packing_list', 'conocimiento_embarque', 'poliza_seguro',
      'certificado_sanitario', 'licencia_importacion', 'nota_pedido',
      'declaracion_valor', 'otro'
    )),
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'presentado', 'aprobado', 'rechazado', 'vencido')),
  obligatorio boolean NOT NULL DEFAULT false,
  archivo_path text,
  archivo_nombre text,
  archivo_size bigint,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_despacho_docs_despacho ON despacho_documentos(despacho_id);

-- ── 4. despacho_liquidaciones ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS despacho_liquidaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  despacho_id uuid NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,

  -- Base imponible
  valor_en_aduana numeric(14,2) NOT NULL DEFAULT 0,
  moneda text NOT NULL DEFAULT 'USD',
  tipo_cambio numeric(10,4) NOT NULL DEFAULT 1,

  -- Tributos (porcentaje + monto calculado)
  derecho_importacion_pct numeric(5,2) NOT NULL DEFAULT 0,
  derecho_importacion numeric(14,2) NOT NULL DEFAULT 0,
  tasa_estadistica_pct numeric(5,2) NOT NULL DEFAULT 0,
  tasa_estadistica numeric(14,2) NOT NULL DEFAULT 0,
  iva_pct numeric(5,2) NOT NULL DEFAULT 21,
  iva numeric(14,2) NOT NULL DEFAULT 0,
  iva_adicional_pct numeric(5,2) NOT NULL DEFAULT 0,
  iva_adicional numeric(14,2) NOT NULL DEFAULT 0,
  ingresos_brutos_pct numeric(5,2) NOT NULL DEFAULT 0,
  ingresos_brutos numeric(14,2) NOT NULL DEFAULT 0,
  ganancias_pct numeric(5,2) NOT NULL DEFAULT 0,
  ganancias numeric(14,2) NOT NULL DEFAULT 0,

  -- Totales
  total_tributos numeric(14,2) NOT NULL DEFAULT 0,
  total_ars numeric(14,2) NOT NULL DEFAULT 0,

  estado text NOT NULL DEFAULT 'borrador'
    CHECK (estado IN ('borrador', 'confirmado', 'pagado')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_despacho_liq_despacho ON despacho_liquidaciones(despacho_id);

-- ── 5. cargas (tracking de carga/transporte) ───────────────────────────────

CREATE TABLE IF NOT EXISTS cargas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  despacho_id uuid NOT NULL REFERENCES despachos(id) ON DELETE CASCADE,

  -- Transporte
  tipo_transporte text NOT NULL DEFAULT 'maritimo'
    CHECK (tipo_transporte IN ('maritimo', 'aereo', 'terrestre', 'multimodal')),
  numero_contenedor text,
  numero_bl text,
  numero_awb text,
  booking_number text,
  naviera_aerolinea text,
  buque_vuelo text,

  -- Estado
  estado text NOT NULL DEFAULT 'en_origen'
    CHECK (estado IN ('en_origen', 'en_transito', 'en_puerto', 'deposito_fiscal', 'en_verificacion', 'liberado')),

  -- Fechas
  fecha_embarque date,
  fecha_arribo_estimado date,
  fecha_arribo_real date,
  fecha_ingreso_deposito date,
  fecha_liberacion date,

  -- Detalles
  puerto_origen text,
  puerto_destino text,
  peso_kg numeric(12,2),
  volumen_m3 numeric(10,2),
  cantidad_bultos integer,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cargas_despacho ON cargas(despacho_id);
CREATE INDEX idx_cargas_estado ON cargas(estado);

-- ── 6. Extensión seguimientos para despachos ────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seguimientos' AND column_name = 'despacho_id'
  ) THEN
    ALTER TABLE seguimientos ADD COLUMN despacho_id uuid REFERENCES despachos(id) ON DELETE CASCADE;
    CREATE INDEX idx_seguimientos_despacho ON seguimientos(despacho_id);
  END IF;
END$$;

-- ── 7. RLS Policies ────────────────────────────────────────────────────────

-- Helper: check if user is admin or gestor
CREATE OR REPLACE FUNCTION is_admin_or_gestor()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND rol IN ('admin', 'gestor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- despachante_clientes
ALTER TABLE despachante_clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "despachante_clientes_select" ON despachante_clientes
  FOR SELECT USING (
    despachante_id = auth.uid() OR is_admin_or_gestor()
  );

CREATE POLICY "despachante_clientes_insert" ON despachante_clientes
  FOR INSERT WITH CHECK (is_admin_or_gestor());

CREATE POLICY "despachante_clientes_update" ON despachante_clientes
  FOR UPDATE USING (is_admin_or_gestor());

CREATE POLICY "despachante_clientes_delete" ON despachante_clientes
  FOR DELETE USING (is_admin_or_gestor());

-- despachos
ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "despachos_select" ON despachos
  FOR SELECT USING (
    despachante_id = auth.uid() OR is_admin_or_gestor()
  );

CREATE POLICY "despachos_insert" ON despachos
  FOR INSERT WITH CHECK (
    despachante_id = auth.uid() OR is_admin_or_gestor()
  );

CREATE POLICY "despachos_update" ON despachos
  FOR UPDATE USING (
    despachante_id = auth.uid() OR is_admin_or_gestor()
  );

CREATE POLICY "despachos_delete" ON despachos
  FOR DELETE USING (is_admin_or_gestor());

-- despacho_documentos (hereda acceso del despacho padre)
ALTER TABLE despacho_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "despacho_docs_select" ON despacho_documentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM despachos
      WHERE despachos.id = despacho_documentos.despacho_id
        AND (despachos.despachante_id = auth.uid() OR is_admin_or_gestor())
    )
  );

CREATE POLICY "despacho_docs_insert" ON despacho_documentos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM despachos
      WHERE despachos.id = despacho_documentos.despacho_id
        AND (despachos.despachante_id = auth.uid() OR is_admin_or_gestor())
    )
  );

CREATE POLICY "despacho_docs_update" ON despacho_documentos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM despachos
      WHERE despachos.id = despacho_documentos.despacho_id
        AND (despachos.despachante_id = auth.uid() OR is_admin_or_gestor())
    )
  );

CREATE POLICY "despacho_docs_delete" ON despacho_documentos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM despachos
      WHERE despachos.id = despacho_documentos.despacho_id
        AND (despachos.despachante_id = auth.uid() OR is_admin_or_gestor())
    )
  );

-- despacho_liquidaciones
ALTER TABLE despacho_liquidaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "despacho_liq_select" ON despacho_liquidaciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM despachos
      WHERE despachos.id = despacho_liquidaciones.despacho_id
        AND (despachos.despachante_id = auth.uid() OR is_admin_or_gestor())
    )
  );

CREATE POLICY "despacho_liq_insert" ON despacho_liquidaciones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM despachos
      WHERE despachos.id = despacho_liquidaciones.despacho_id
        AND (despachos.despachante_id = auth.uid() OR is_admin_or_gestor())
    )
  );

CREATE POLICY "despacho_liq_update" ON despacho_liquidaciones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM despachos
      WHERE despachos.id = despacho_liquidaciones.despacho_id
        AND (despachos.despachante_id = auth.uid() OR is_admin_or_gestor())
    )
  );

CREATE POLICY "despacho_liq_delete" ON despacho_liquidaciones
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM despachos
      WHERE despachos.id = despacho_liquidaciones.despacho_id
        AND (despachos.despachante_id = auth.uid() OR is_admin_or_gestor())
    )
  );

-- cargas
ALTER TABLE cargas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cargas_select" ON cargas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM despachos
      WHERE despachos.id = cargas.despacho_id
        AND (despachos.despachante_id = auth.uid() OR is_admin_or_gestor())
    )
  );

CREATE POLICY "cargas_insert" ON cargas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM despachos
      WHERE despachos.id = cargas.despacho_id
        AND (despachos.despachante_id = auth.uid() OR is_admin_or_gestor())
    )
  );

CREATE POLICY "cargas_update" ON cargas
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM despachos
      WHERE despachos.id = cargas.despacho_id
        AND (despachos.despachante_id = auth.uid() OR is_admin_or_gestor())
    )
  );

CREATE POLICY "cargas_delete" ON cargas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM despachos
      WHERE despachos.id = cargas.despacho_id
        AND (despachos.despachante_id = auth.uid() OR is_admin_or_gestor())
    )
  );
