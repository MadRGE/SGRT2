/*
  # Fix Security and Performance Issues (Corrected)
  
  ## Summary
  This migration addresses critical security and performance issues:
  
  1. **Missing Indexes on Foreign Keys** - Improves query performance
  2. **RLS Policy Optimization** - Uses `(select auth.uid())` pattern
  3. **Function Security** - Sets immutable search_path
  
  ## Impact
  - Faster queries on foreign key relationships
  - Improved RLS policy evaluation
  - Better function security
*/

-- ============================================
-- ADD MISSING FOREIGN KEY INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_catalogo_servicios_proveedor 
  ON catalogo_servicios(proveedor_sugerido_id);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_proyecto 
  ON cotizaciones(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_document_validations_validado_por 
  ON document_validations(validado_por);

CREATE INDEX IF NOT EXISTS idx_documentos_checklist_item 
  ON documentos(checklist_item_id);

CREATE INDEX IF NOT EXISTS idx_expediente_stages_completado_por 
  ON expediente_stages(completado_por);

CREATE INDEX IF NOT EXISTS idx_expedientes_proyecto_id 
  ON expedientes(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_expedientes_tramite_tipo_id 
  ON expedientes(tramite_tipo_id);

CREATE INDEX IF NOT EXISTS idx_facturas_proveedores_presupuesto_item 
  ON facturas_proveedores(presupuesto_item_id);

CREATE INDEX IF NOT EXISTS idx_historial_expediente 
  ON historial(expediente_id);

CREATE INDEX IF NOT EXISTS idx_historial_proyecto 
  ON historial(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_historial_usuario 
  ON historial(usuario_id);

CREATE INDEX IF NOT EXISTS idx_notificaciones_expediente 
  ON notificaciones(expediente_id);

CREATE INDEX IF NOT EXISTS idx_notificaciones_proyecto 
  ON notificaciones(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_proyectos_producto 
  ON proyectos(producto_id);

-- ============================================
-- OPTIMIZE RLS POLICIES - NOTIFICACIONES
-- ============================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notificaciones;
CREATE POLICY "Users can view own notifications"
  ON notificaciones FOR SELECT
  TO authenticated
  USING (usuario_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON notificaciones;
CREATE POLICY "Users can update own notifications"
  ON notificaciones FOR UPDATE
  TO authenticated
  USING (usuario_id = (select auth.uid()))
  WITH CHECK (usuario_id = (select auth.uid()));

-- ============================================
-- OPTIMIZE RLS POLICIES - CLIENTE_DOCUMENTOS
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can insert cliente documents" ON cliente_documentos;
CREATE POLICY "Gestores and admins can insert cliente documents"
  ON cliente_documentos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Gestores and admins can update cliente documents" ON cliente_documentos;
CREATE POLICY "Gestores and admins can update cliente documents"
  ON cliente_documentos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Gestores and admins can delete cliente documents" ON cliente_documentos;
CREATE POLICY "Gestores and admins can delete cliente documents"
  ON cliente_documentos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - EXPEDIENTE_TAREAS_TERCEROS
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can insert tareas terceros" ON expediente_tareas_terceros;
CREATE POLICY "Gestores and admins can insert tareas terceros"
  ON expediente_tareas_terceros FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Gestores and admins can update tareas terceros" ON expediente_tareas_terceros;
CREATE POLICY "Gestores and admins can update tareas terceros"
  ON expediente_tareas_terceros FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Gestores and admins can delete tareas terceros" ON expediente_tareas_terceros;
CREATE POLICY "Gestores and admins can delete tareas terceros"
  ON expediente_tareas_terceros FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - PRODUCTOS
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can insert productos" ON productos;
CREATE POLICY "Gestores and admins can insert productos"
  ON productos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Gestores and admins can update productos" ON productos;
CREATE POLICY "Gestores and admins can update productos"
  ON productos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Gestores and admins can delete productos" ON productos;
CREATE POLICY "Gestores and admins can delete productos"
  ON productos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - PROYECTOS
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can insert proyectos" ON proyectos;
CREATE POLICY "Gestores and admins can insert proyectos"
  ON proyectos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Gestores and admins can update proyectos" ON proyectos;
CREATE POLICY "Gestores and admins can update proyectos"
  ON proyectos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Gestores and admins can delete proyectos" ON proyectos;
CREATE POLICY "Gestores and admins can delete proyectos"
  ON proyectos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - EXPEDIENTES
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can insert expedientes" ON expedientes;
CREATE POLICY "Gestores and admins can insert expedientes"
  ON expedientes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Gestores and admins can update expedientes" ON expedientes;
CREATE POLICY "Gestores and admins can update expedientes"
  ON expedientes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Gestores and admins can delete expedientes" ON expedientes;
CREATE POLICY "Gestores and admins can delete expedientes"
  ON expedientes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - PROYECTO_PRODUCTOS
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can manage proyecto_productos" ON proyecto_productos;
CREATE POLICY "Gestores and admins can manage proyecto_productos"
  ON proyecto_productos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - EXPEDIENTE_PRODUCTOS
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can manage expediente_productos" ON expediente_productos;
CREATE POLICY "Gestores and admins can manage expediente_productos"
  ON expediente_productos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - PRESUPUESTOS
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can manage presupuestos" ON presupuestos;
CREATE POLICY "Gestores and admins can manage presupuestos"
  ON presupuestos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - PRESUPUESTO_ITEMS
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can manage presupuesto_items" ON presupuesto_items;
CREATE POLICY "Gestores and admins can manage presupuesto_items"
  ON presupuesto_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - PROCEDURE_DOCUMENTS
-- ============================================

DROP POLICY IF EXISTS "Admin users can manage procedure documents" ON procedure_documents;
CREATE POLICY "Admin users can manage procedure documents"
  ON procedure_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol = 'admin'
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - DOCUMENT_VALIDATIONS
-- ============================================

DROP POLICY IF EXISTS "Staff can create and update validations" ON document_validations;
CREATE POLICY "Staff can create and update validations"
  ON document_validations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - PROCEDURE_STAGES
-- ============================================

DROP POLICY IF EXISTS "Admin users can manage procedure stages" ON procedure_stages;
CREATE POLICY "Admin users can manage procedure stages"
  ON procedure_stages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol = 'admin'
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - EXPEDIENTE_STAGES
-- ============================================

DROP POLICY IF EXISTS "Staff can manage expediente stages" ON expediente_stages;
CREATE POLICY "Staff can manage expediente stages"
  ON expediente_stages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - NOTIFICATION_TEMPLATES
-- ============================================

DROP POLICY IF EXISTS "Admin users can manage notification templates" ON notification_templates;
CREATE POLICY "Admin users can manage notification templates"
  ON notification_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol = 'admin'
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - FEES_CONFIGURATION
-- ============================================

DROP POLICY IF EXISTS "Admin users can manage fees configuration" ON fees_configuration;
CREATE POLICY "Admin users can manage fees configuration"
  ON fees_configuration FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol = 'admin'
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - CONTACTOS_TEMPORALES
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can manage contactos_temporales" ON contactos_temporales;
CREATE POLICY "Gestores and admins can manage contactos_temporales"
  ON contactos_temporales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - COTIZACIONES
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can manage cotizaciones" ON cotizaciones;
CREATE POLICY "Gestores and admins can manage cotizaciones"
  ON cotizaciones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - COTIZACION_ITEMS
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can manage cotizacion_items" ON cotizacion_items;
CREATE POLICY "Gestores and admins can manage cotizacion_items"
  ON cotizacion_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - CONFIGURACION_MARGENES
-- ============================================

DROP POLICY IF EXISTS "Admins can manage configuracion_margenes" ON configuracion_margenes;
CREATE POLICY "Admins can manage configuracion_margenes"
  ON configuracion_margenes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol = 'admin'
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - CATALOGO_SERVICIOS
-- ============================================

DROP POLICY IF EXISTS "Gestores and admins can manage catalogo_servicios" ON catalogo_servicios;
CREATE POLICY "Gestores and admins can manage catalogo_servicios"
  ON catalogo_servicios FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (select auth.uid())
      AND usuarios.rol IN ('gestor', 'admin')
    )
  );

-- ============================================
-- FIX FUNCTION SEARCH PATHS (Security)
-- ============================================

ALTER FUNCTION update_updated_at_column() SET search_path = '';
ALTER FUNCTION generate_numero_cotizacion() SET search_path = '';
ALTER FUNCTION generate_url_publica() SET search_path = '';
ALTER FUNCTION trigger_generate_numero_cotizacion() SET search_path = '';
ALTER FUNCTION trigger_update_timestamp() SET search_path = '';
ALTER FUNCTION get_service_profitability_stats(UUID) SET search_path = '';
ALTER FUNCTION get_provider_performance_stats(UUID) SET search_path = '';
