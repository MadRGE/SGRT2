/*
  # Crear Catálogo de Servicios y Mejorar Sistema de Proveedores
  
  ## Resumen
  Esta migración crea un catálogo de servicios flexible para consultores que permite:
  - Definir servicios sin costo base obligatorio (servicios de consultoría puros)
  - Gestionar precios sugeridos por categoría de cliente
  - Vincular proveedores externos a servicios específicos
  - Registrar costos variables cuando se requieren terceros
  
  ## Nuevas Tablas
  
  1. **catalogo_servicios** - Catálogo de servicios y consultoría
    - `id` (uuid, primary key) - Identificador único
    - `codigo` (text, unique) - Código del servicio (ej: CONS-001)
    - `nombre` (text) - Nombre del servicio
    - `descripcion` (text) - Descripción detallada
    - `categoria` (text) - Categoría (consultoria, tramite, analisis, capacitacion, otro)
    - `tipo_costo` (text) - Tipo: 'sin_costo_base' | 'costo_fijo' | 'costo_variable'
    - `costo_base_sugerido` (decimal) - Costo base sugerido (opcional)
    - `precio_sugerido_estandar` (decimal) - Precio sugerido cliente estándar
    - `precio_sugerido_corporativo` (decimal) - Precio sugerido cliente corporativo
    - `precio_sugerido_pyme` (decimal) - Precio sugerido PYME
    - `requiere_proveedor_externo` (boolean) - Si típicamente requiere terceros
    - `proveedor_sugerido_id` (uuid) - Proveedor recomendado (opcional)
    - `tiempo_estimado_horas` (integer) - Tiempo estimado en horas
    - `activo` (boolean) - Si está activo
    - `notas` (text) - Notas internas
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  2. **cotizacion_items** (modificaciones)
    - Agregar `servicio_catalogo_id` - Referencia al catálogo
    - Agregar `proveedor_externo_id` - Proveedor específico para este ítem
    - Agregar `costo_proveedor_externo` - Costo real del proveedor
    - Agregar `requiere_tercero` - Flag si requiere tercero
    - Agregar `notas_costo` - Notas sobre el costo
  
  3. **terceros** (mejoras)
    - Agregar `tipo_servicio` - Tipo de servicio que provee (array)
    - Agregar `calificacion` - Calificación del proveedor (1-5)
    - Agregar `tiempo_respuesta_dias` - Tiempo típico de respuesta
    - Agregar `activo` - Si está activo
  
  ## Mejoras en el Sistema
  - Catálogo flexible que soporta servicios de consultoría sin costo base
  - Precios sugeridos por tipo de cliente para agilizar cotizaciones
  - Vinculación entre servicios y proveedores sugeridos
  - Tracking de costos reales de proveedores externos
  - Análisis de rentabilidad real considerando terceros
  
  ## Seguridad
  - RLS habilitado en todas las tablas
  - Solo gestores y admins pueden modificar el catálogo
  - Todos los usuarios autenticados pueden ver el catálogo
*/

-- ============================================
-- CATALOGO SERVICIOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS catalogo_servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT DEFAULT 'consultoria',
  tipo_costo TEXT DEFAULT 'sin_costo_base',
  costo_base_sugerido DECIMAL(12, 2) DEFAULT 0,
  precio_sugerido_estandar DECIMAL(12, 2) DEFAULT 0,
  precio_sugerido_corporativo DECIMAL(12, 2) DEFAULT 0,
  precio_sugerido_pyme DECIMAL(12, 2) DEFAULT 0,
  requiere_proveedor_externo BOOLEAN DEFAULT false,
  proveedor_sugerido_id UUID REFERENCES terceros(id) ON DELETE SET NULL,
  tiempo_estimado_horas INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalogo_servicios_codigo ON catalogo_servicios(codigo);
CREATE INDEX IF NOT EXISTS idx_catalogo_servicios_categoria ON catalogo_servicios(categoria);
CREATE INDEX IF NOT EXISTS idx_catalogo_servicios_activo ON catalogo_servicios(activo);

-- RLS for catalogo_servicios
ALTER TABLE catalogo_servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view catalogo_servicios"
  ON catalogo_servicios FOR SELECT
  TO authenticated
  USING (activo = true);

CREATE POLICY "Gestores and admins can manage catalogo_servicios"
  ON catalogo_servicios FOR ALL
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

-- ============================================
-- ADD COLUMNS TO cotizacion_items
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizacion_items' AND column_name = 'servicio_catalogo_id'
  ) THEN
    ALTER TABLE cotizacion_items ADD COLUMN servicio_catalogo_id UUID REFERENCES catalogo_servicios(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizacion_items' AND column_name = 'proveedor_externo_id'
  ) THEN
    ALTER TABLE cotizacion_items ADD COLUMN proveedor_externo_id UUID REFERENCES terceros(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizacion_items' AND column_name = 'costo_proveedor_externo'
  ) THEN
    ALTER TABLE cotizacion_items ADD COLUMN costo_proveedor_externo DECIMAL(12, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizacion_items' AND column_name = 'requiere_tercero'
  ) THEN
    ALTER TABLE cotizacion_items ADD COLUMN requiere_tercero BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizacion_items' AND column_name = 'notas_costo'
  ) THEN
    ALTER TABLE cotizacion_items ADD COLUMN notas_costo TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cotizacion_items_servicio ON cotizacion_items(servicio_catalogo_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_proveedor ON cotizacion_items(proveedor_externo_id);

-- ============================================
-- ENHANCE terceros TABLE
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'terceros' AND column_name = 'tipo_servicio'
  ) THEN
    ALTER TABLE terceros ADD COLUMN tipo_servicio TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'terceros' AND column_name = 'calificacion'
  ) THEN
    ALTER TABLE terceros ADD COLUMN calificacion INTEGER DEFAULT 0 CHECK (calificacion >= 0 AND calificacion <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'terceros' AND column_name = 'tiempo_respuesta_dias'
  ) THEN
    ALTER TABLE terceros ADD COLUMN tiempo_respuesta_dias INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'terceros' AND column_name = 'activo'
  ) THEN
    ALTER TABLE terceros ADD COLUMN activo BOOLEAN DEFAULT true;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_terceros_activo ON terceros(activo);
CREATE INDEX IF NOT EXISTS idx_terceros_tipo ON terceros(tipo);

-- ============================================
-- TRIGGER: Update updated_at for catalogo_servicios
-- ============================================
CREATE TRIGGER before_update_catalogo_servicios
  BEFORE UPDATE ON catalogo_servicios
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_timestamp();

-- ============================================
-- SEED CATALOGO SERVICIOS
-- ============================================
INSERT INTO catalogo_servicios (
  codigo, nombre, descripcion, categoria, tipo_costo,
  precio_sugerido_estandar, precio_sugerido_corporativo, precio_sugerido_pyme,
  requiere_proveedor_externo, tiempo_estimado_horas
) VALUES
  (
    'CONS-001',
    'Consultoría Estratégica',
    'Asesoramiento estratégico en comercio exterior y normativas',
    'consultoria',
    'sin_costo_base',
    150000,
    250000,
    100000,
    false,
    8
  ),
  (
    'CONS-002',
    'Análisis de Viabilidad',
    'Estudio de viabilidad para trámites y procedimientos',
    'consultoria',
    'sin_costo_base',
    80000,
    120000,
    60000,
    false,
    4
  ),
  (
    'CAP-001',
    'Capacitación en Normativas',
    'Capacitación empresarial en normativas regulatorias',
    'capacitacion',
    'sin_costo_base',
    200000,
    350000,
    150000,
    false,
    16
  ),
  (
    'ANA-001',
    'Análisis Técnico Externo',
    'Análisis técnico que requiere laboratorio o perito externo',
    'analisis',
    'costo_variable',
    50000,
    80000,
    40000,
    true,
    2
  )
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- FUNCTION: Get service profitability stats
-- ============================================
CREATE OR REPLACE FUNCTION get_service_profitability_stats(servicio_id UUID)
RETURNS TABLE (
  total_cotizaciones BIGINT,
  precio_promedio DECIMAL,
  costo_promedio_terceros DECIMAL,
  margen_promedio DECIMAL,
  veces_requirio_tercero BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT ci.cotizacion_id)::BIGINT,
    AVG(ci.precio_venta),
    AVG(ci.costo_proveedor_externo),
    AVG(ci.margen_porcentaje),
    COUNT(CASE WHEN ci.requiere_tercero THEN 1 END)::BIGINT
  FROM cotizacion_items ci
  WHERE ci.servicio_catalogo_id = get_service_profitability_stats.servicio_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get provider performance stats
-- ============================================
CREATE OR REPLACE FUNCTION get_provider_performance_stats(proveedor_id UUID)
RETURNS TABLE (
  total_servicios_contratados BIGINT,
  costo_total DECIMAL,
  costo_promedio DECIMAL,
  servicios_usados TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    SUM(ci.costo_proveedor_externo),
    AVG(ci.costo_proveedor_externo),
    ARRAY_AGG(DISTINCT cs.nombre)
  FROM cotizacion_items ci
  LEFT JOIN catalogo_servicios cs ON cs.id = ci.servicio_catalogo_id
  WHERE ci.proveedor_externo_id = get_provider_performance_stats.proveedor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
