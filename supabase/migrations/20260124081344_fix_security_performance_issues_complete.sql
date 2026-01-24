/*
  # Fix Critical Security and Performance Issues
  
  ## Critical Fixes
  
  1. **Missing Foreign Key Indexes** (Performance)
     - Add indexes for unindexed foreign keys
  
  2. **Auth RLS Function Optimization** (Performance)
     - Wrap auth.uid() calls in SELECT for better query performance at scale
  
  3. **Function Search Path Security** (Security)
     - Set immutable search paths for functions to prevent search path hijacking
  
  4. **Remove Unused Indexes** (Performance)
     - Drop indexes that have never been used to reduce maintenance overhead
*/

-- ============================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_certificados_finalizados_expediente_id 
ON certificados_finalizados(expediente_id);

CREATE INDEX IF NOT EXISTS idx_presupuestos_aprobado_por 
ON presupuestos(aprobado_por);

CREATE INDEX IF NOT EXISTS idx_presupuestos_enviado_por 
ON presupuestos(enviado_por);

CREATE INDEX IF NOT EXISTS idx_producto_especificaciones_created_by 
ON producto_especificaciones(created_by);

-- ============================================
-- 2. OPTIMIZE AUTH RLS POLICIES
-- ============================================

-- certificados_tramites policies
DROP POLICY IF EXISTS "Gestores and admins can view all certificates" ON certificados_tramites;
CREATE POLICY "Gestores and admins can view all certificates"
  ON certificados_tramites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = (SELECT auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Gestores and admins can insert certificates" ON certificados_tramites;
CREATE POLICY "Gestores and admins can insert certificates"
  ON certificados_tramites FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = (SELECT auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Gestores and admins can update certificates" ON certificados_tramites;
CREATE POLICY "Gestores and admins can update certificates"
  ON certificados_tramites FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = (SELECT auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Clients can view own certificates" ON certificados_tramites;
CREATE POLICY "Clients can view own certificates"
  ON certificados_tramites FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT cliente_id FROM usuarios
      WHERE auth_user_id = (SELECT auth.uid())
    )
  );

-- producto_especificaciones policy
DROP POLICY IF EXISTS "Gestores and admins can manage product specifications" ON producto_especificaciones;
CREATE POLICY "Gestores and admins can manage product specifications"
  ON producto_especificaciones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = (SELECT auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = (SELECT auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- aranceles_oficiales policy
DROP POLICY IF EXISTS "Admins can manage fees" ON aranceles_oficiales;
CREATE POLICY "Admins can manage fees"
  ON aranceles_oficiales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = (SELECT auth.uid())
      AND usuarios.rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.auth_user_id = (SELECT auth.uid())
      AND usuarios.rol = 'admin'
    )
  );

-- document_validations policy
DROP POLICY IF EXISTS "Users can view validations for their expedientes" ON document_validations;
CREATE POLICY "Users can view validations for their expedientes"
  ON document_validations FOR SELECT
  TO authenticated
  USING (
    documento_id IN (
      SELECT d.id FROM documentos d
      INNER JOIN proyectos_legacy_v1 e ON d.expediente_id = e.id
      INNER JOIN proyectos p ON e.proyecto_id = p.id
      INNER JOIN usuarios u ON p.cliente_id = u.cliente_id
      WHERE u.auth_user_id = (SELECT auth.uid())
    )
  );

-- expediente_stages policy
DROP POLICY IF EXISTS "Users can view stages for their expedientes" ON expediente_stages;
CREATE POLICY "Users can view stages for their expedientes"
  ON expediente_stages FOR SELECT
  TO authenticated
  USING (
    expediente_id IN (
      SELECT e.id FROM expedientes e
      INNER JOIN proyectos p ON e.proyecto_id = p.id
      INNER JOIN usuarios u ON p.cliente_id = u.cliente_id
      WHERE u.auth_user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- 3. FIX FUNCTION SEARCH PATHS (Security)
-- ============================================

ALTER FUNCTION update_updated_at_column() SET search_path = pg_catalog, public;
ALTER FUNCTION update_certificados_updated_at() SET search_path = pg_catalog, public;
ALTER FUNCTION trigger_set_cotizacion_audit() SET search_path = pg_catalog, public;
ALTER FUNCTION calculate_precio_final(numeric, numeric, numeric) SET search_path = pg_catalog, public;
ALTER FUNCTION trigger_calculate_precio_final() SET search_path = pg_catalog, public;

-- ============================================
-- 4. REMOVE UNUSED INDEXES (Performance)
-- ============================================

DROP INDEX IF EXISTS idx_expediente_productos_estado_individual;
DROP INDEX IF EXISTS idx_expediente_productos_aprobado_por;
DROP INDEX IF EXISTS idx_tramite_checklists_tipo;
DROP INDEX IF EXISTS idx_productos_clase_riesgo;
DROP INDEX IF EXISTS idx_productos_tipo_dispositivo;
DROP INDEX IF EXISTS idx_tramite_tipos_codigo_oficial;
DROP INDEX IF EXISTS idx_tramite_tipos_prioridad;
DROP INDEX IF EXISTS idx_notificaciones_leida;
DROP INDEX IF EXISTS idx_notificaciones_created_at;
DROP INDEX IF EXISTS idx_exp_tareas_terceros_exp;
DROP INDEX IF EXISTS idx_exp_tareas_terceros_prov;
DROP INDEX IF EXISTS idx_productos_rubro;
DROP INDEX IF EXISTS idx_expedientes_semaforo;
DROP INDEX IF EXISTS idx_tramite_tipos_logica_especial;
DROP INDEX IF EXISTS idx_tramite_tipos_es_habilitacion;
DROP INDEX IF EXISTS idx_tramite_tipos_organismo_prioridad;
DROP INDEX IF EXISTS idx_tramite_tipos_plataforma;
DROP INDEX IF EXISTS idx_contactos_temporales_estado;
DROP INDEX IF EXISTS idx_contactos_temporales_created;
DROP INDEX IF EXISTS idx_notification_templates_codigo;
DROP INDEX IF EXISTS idx_cotizaciones_url;
DROP INDEX IF EXISTS idx_catalogo_servicios_codigo;
DROP INDEX IF EXISTS idx_catalogo_servicios_categoria;
DROP INDEX IF EXISTS idx_catalogo_servicios_activo;
DROP INDEX IF EXISTS idx_cotizacion_items_servicio;
DROP INDEX IF EXISTS idx_cotizacion_items_proveedor;
DROP INDEX IF EXISTS idx_terceros_activo;
DROP INDEX IF EXISTS idx_terceros_tipo;
DROP INDEX IF EXISTS idx_catalogo_servicios_proveedor;
DROP INDEX IF EXISTS idx_documentos_checklist_item;
DROP INDEX IF EXISTS idx_facturas_proveedores_presupuesto_item;
DROP INDEX IF EXISTS idx_historial_expediente;
DROP INDEX IF EXISTS idx_historial_proyecto;
DROP INDEX IF EXISTS idx_historial_usuario;
DROP INDEX IF EXISTS idx_notificaciones_expediente;
DROP INDEX IF EXISTS idx_notificaciones_proyecto;
DROP INDEX IF EXISTS idx_proyectos_producto;
DROP INDEX IF EXISTS idx_presupuesto_items_direccionado;
DROP INDEX IF EXISTS idx_presupuesto_items_direccionado_por;
DROP INDEX IF EXISTS idx_producto_especificaciones_tipo;
DROP INDEX IF EXISTS idx_producto_especificaciones_estado;
DROP INDEX IF EXISTS idx_certificados_cliente_id;
DROP INDEX IF EXISTS idx_certificados_tramite_tipo_id;
DROP INDEX IF EXISTS idx_certificados_producto_id;
DROP INDEX IF EXISTS idx_certificados_estado;
DROP INDEX IF EXISTS idx_certificados_fecha_vencimiento;
DROP INDEX IF EXISTS idx_certificados_expediente_id;
DROP INDEX IF EXISTS idx_aranceles_organismo;
DROP INDEX IF EXISTS idx_aranceles_codigo;
DROP INDEX IF EXISTS idx_certificados_cliente;
DROP INDEX IF EXISTS idx_certificados_producto;
DROP INDEX IF EXISTS idx_certificados_tramite_tipo;
DROP INDEX IF EXISTS idx_aranceles_categoria;
DROP INDEX IF EXISTS idx_aranceles_vigencia;
DROP INDEX IF EXISTS idx_aranceles_activo;
