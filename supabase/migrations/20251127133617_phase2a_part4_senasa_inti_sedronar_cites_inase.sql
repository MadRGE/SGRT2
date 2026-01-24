/*
  # Fase 2A Parte 4 - Organismos Finales (45 trámites)
  
  ## Descripción
  
  Completa los últimos 45 trámites de alta prioridad:
  - SENASA: 25 trámites
  - INTI: 10 trámites
  - SEDRONAR: 5 trámites
  - AMBIENTE (CITES): 3 trámites
  - INASE: 2 trámites
  
  ## Total Acumulado
  
  - INAL: 15 ✓
  - ANMAT PM: 20 ✓
  - ANMAT Cosméticos: 15 ✓
  - ANMAT Domisanitarios: 15 ✓
  - SENASA: 25 (esta migración)
  - INTI: 10 (esta migración)
  - SEDRONAR: 5 (esta migración)
  - CITES: 3 (esta migración)
  - INASE: 2 (esta migración)
  - **TOTAL: 110 trámites alta prioridad**
*/

-- ============================================================================
-- SENASA (25 trámites)
-- ============================================================================

INSERT INTO tramite_tipos (
  id, codigo, nombre, organismo_id, rubro, subcategoria,
  costo_base_2025, codigo_oficial, plataforma_gestion, sla_total_dias,
  documentacion_obligatoria, prioridad, costo_tasas_base
) VALUES
-- Registros Principales
('TT-SEN-EST-001', 'SEN-EST-001', 'Inscripción RNE SENASA Importador', 'SENASA', 'Establecimientos', 'RNE',
 25000.00, 'SEN-001', 'SIGSA', 90,
 ARRAY['Habilitación municipal', 'Plano', 'RT designado', 'AFIP'],
 'alta', 25000.00),

('TT-SEN-EST-002', 'SEN-EST-002', 'Inscripción RENSPA (por establecimiento)', 'SENASA', 'Establecimientos', 'RENSPA',
 15000.00, 'SEN-002', 'SIGSA', 60,
 ARRAY['Título propiedad', 'Plano', 'RT veterinario', 'Habilitación'],
 'alta', 15000.00),

('TT-SEN-PROD-001', 'SEN-PROD-001', 'Inscripción RPV Productos Veterinarios', 'SENASA', 'Productos', 'RPV',
 35000.00, 'SEN-003', 'SIGSA', 120,
 ARRAY['Fórmula', 'Estudios eficacia', 'Estudios seguridad', 'Rótulo', 'Certificado fabricante'],
 'alta', 35000.00),

-- Autorizaciones Importación Food
('TT-SEN-FOOD-001', 'SEN-FOOD-001', 'Autorización Importación Food (por producto)', 'SENASA', 'Importación', 'Food',
 18000.00, 'SEN-F001', 'SIGSA', 30,
 ARRAY['Certificado sanitario origen', 'Factura', 'BL', 'Análisis', 'Etiqueta'],
 'alta', 18000.00),

('TT-SEN-FOOD-002', 'SEN-FOOD-002', 'Autorización Importación Carne y Derivados', 'SENASA', 'Importación', 'Food',
 25000.00, 'SEN-F002', 'SIGSA', 45,
 ARRAY['Certificado veterinario', 'Certificado halal/kosher si aplica', 'Trazabilidad'],
 'alta', 25000.00),

('TT-SEN-FOOD-003', 'SEN-FOOD-003', 'Autorización Importación Productos Pesqueros', 'SENASA', 'Importación', 'Food',
 22000.00, 'SEN-F003', 'SIGSA', 40,
 ARRAY['Certificado sanitario', 'Zona captura', 'Análisis metales pesados'],
 'alta', 22000.00),

('TT-SEN-FOOD-004', 'SEN-FOOD-004', 'Autorización Importación Lácteos', 'SENASA', 'Importación', 'Food',
 20000.00, 'SEN-F004', 'SIGSA', 35,
 ARRAY['Certificado sanitario', 'Certificado brucelosis/tuberculosis', 'Análisis completo'],
 'alta', 20000.00),

('TT-SEN-FOOD-005', 'SEN-FOOD-005', 'Autorización Importación Miel', 'SENASA', 'Importación', 'Food',
 15000.00, 'SEN-F005', 'SIGSA', 30,
 ARRAY['Certificado apícola', 'Análisis residuos', 'Certificado origen'],
 'alta', 15000.00),

-- Autorizaciones Importación Feed
('TT-SEN-FEED-001', 'SEN-FEED-001', 'Autorización Importación Feed (alimento animal)', 'SENASA', 'Importación', 'Feed',
 16000.00, 'SEN-A001', 'SIGSA', 30,
 ARRAY['Certificado sanitario', 'Análisis bromatológico', 'Libre EEB'],
 'alta', 16000.00),

('TT-SEN-FEED-002', 'SEN-FEED-002', 'Autorización Importación Materias Primas Feed', 'SENASA', 'Importación', 'Feed',
 14000.00, 'SEN-A002', 'SIGSA', 25,
 ARRAY['Certificado fitosanitario/sanitario', 'Análisis', 'Libre contaminantes'],
 'alta', 14000.00),

-- Fertilizantes y Suplementos
('TT-SEN-FERT-001', 'SEN-FERT-001', 'Inscripción Fertilizante SENASA', 'SENASA', 'Productos', 'Fertilizantes',
 28000.00, 'SEN-FER001', 'SIGSA', 90,
 ARRAY['Fórmula', 'Análisis químico', 'Rótulo', 'Certificado fabricante'],
 'alta', 28000.00),

('TT-SEN-SUP-001', 'SEN-SUP-001', 'Inscripción Suplemento Animal SENASA', 'SENASA', 'Productos', 'Suplementos',
 22000.00, 'SEN-SUP001', 'SIGSA', 60,
 ARRAY['Fórmula', 'Análisis', 'Rótulo', 'Certificado origen'],
 'alta', 22000.00),

-- Certificaciones Exportación
('TT-SEN-EXP-001', 'SEN-EXP-001', 'Certificado Sanitario Exportación Food', 'SENASA', 'Certificación', 'Exportación',
 12000.00, 'SEN-EXP001', 'SIGSA', 20,
 ARRAY['Solicitud destino', 'Análisis', 'Trazabilidad', 'Factura'],
 'alta', 12000.00),

('TT-SEN-EXP-002', 'SEN-EXP-002', 'Certificado Veterinario Exportación Carne', 'SENASA', 'Certificación', 'Exportación',
 15000.00, 'SEN-EXP002', 'SIGSA', 25,
 ARRAY['Solicitud', 'Trazabilidad RENSPA', 'Análisis', 'Habilitación frigorífico'],
 'alta', 15000.00),

('TT-SEN-EXP-003', 'SEN-EXP-003', 'Certificado Fitosanitario Exportación', 'SENASA', 'Certificación', 'Exportación',
 10000.00, 'SEN-EXP003', 'SIGSA', 15,
 ARRAY['Solicitud', 'Análisis plagas', 'Trazabilidad origen'],
 'alta', 10000.00),

-- Inspecciones
('TT-SEN-INS-001', 'SEN-INS-001', 'Inspección Establecimiento SENASA', 'SENASA', 'Inspección', 'Establecimiento',
 180000.00, 'SEN-INS001', 'Presencial', 30,
 ARRAY['Solicitud', 'Pago previo', 'Documentación completa'],
 'alta', 180000.00),

('TT-SEN-INS-002', 'SEN-INS-002', 'Inspección Sanitaria Carga Importación', 'SENASA', 'Inspección', 'Importación',
 8000.00, 'SEN-INS002', 'Puerto/Aeropuerto', 1,
 ARRAY['DUA', 'Certificado', 'Autorización previa'],
 'alta', 8000.00),

('TT-SEN-INS-003', 'SEN-INS-003', 'Inspección Sanitaria Carga Exportación', 'SENASA', 'Inspección', 'Exportación',
 8000.00, 'SEN-INS003', 'Puerto/Aeropuerto', 1,
 ARRAY['Certificado emitido', 'Documentación'],
 'alta', 8000.00),

-- Modificaciones y Renovaciones
('TT-SEN-MOD-001', 'SEN-MOD-001', 'Modificación RNE SENASA', 'SENASA', 'Modificación', 'RNE',
 8000.00, 'SEN-MOD001', 'SIGSA', 45,
 ARRAY['Nota cambio', 'Docs respaldatorios'],
 'alta', 8000.00),

('TT-SEN-MOD-002', 'SEN-MOD-002', 'Ampliación Rubro RNE SENASA', 'SENASA', 'Modificación', 'RNE',
 12000.00, 'SEN-MOD002', 'SIGSA', 60,
 ARRAY['Solicitud rubro', 'Condiciones instalación'],
 'alta', 12000.00),

('TT-SEN-REN-001', 'SEN-REN-001', 'Renovación RNE SENASA', 'SENASA', 'Renovación', 'RNE',
 15000.00, 'SEN-REN001', 'SIGSA', 60,
 ARRAY['Solicitud', 'AFIP actualizada', 'RT vigente'],
 'alta', 15000.00),

-- Autorizaciones Especiales
('TT-SEN-TEMP-001', 'SEN-TEMP-001', 'Autorización Importación Temporal SENASA', 'SENASA', 'Autorización', 'Temporal',
 5000.00, 'SEN-TEMP001', 'SIGSA', 15,
 ARRAY['Nota finalidad', 'Compromiso reexportación'],
 'alta', 5000.00),

('TT-SEN-TRA-001', 'SEN-TRA-001', 'Certificado Tránsito Internacional', 'SENASA', 'Certificación', 'Tránsito',
 8000.00, 'SEN-TRA001', 'SIGSA', 10,
 ARRAY['Certificado origen', 'Documentación transporte', 'Destino final'],
 'alta', 8000.00),

-- Análisis Laboratorio
('TT-SEN-LAB-001', 'SEN-LAB-001', 'Análisis Laboratorio SENASA', 'SENASA', 'Análisis', 'Laboratorio',
 0.00, 'SEN-LAB001', 'SIGSA', 15,
 ARRAY['Muestra', 'Solicitud análisis específico'],
 'alta', 0.00),

('TT-SEN-LAB-002', 'SEN-LAB-002', 'Certificado Análisis Oficial SENASA', 'SENASA', 'Certificación', 'Análisis',
 12000.00, 'SEN-LAB002', 'SIGSA', 20,
 ARRAY['Muestra analizada', 'Solicitud certificado'],
 'alta', 12000.00)

ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  costo_base_2025 = EXCLUDED.costo_base_2025,
  plataforma_gestion = EXCLUDED.plataforma_gestion,
  subcategoria = EXCLUDED.subcategoria,
  documentacion_obligatoria = EXCLUDED.documentacion_obligatoria,
  prioridad = EXCLUDED.prioridad,
  costo_tasas_base = EXCLUDED.costo_tasas_base,
  sla_total_dias = EXCLUDED.sla_total_dias,
  codigo_oficial = EXCLUDED.codigo_oficial;

-- ============================================================================
-- INTI (10 trámites)
-- ============================================================================

INSERT INTO tramite_tipos (
  id, codigo, nombre, organismo_id, rubro, subcategoria,
  costo_base_2025, codigo_oficial, plataforma_gestion, sla_total_dias,
  documentacion_obligatoria, prioridad, costo_tasas_base
) VALUES
('TT-INTI-001', 'INTI-001', 'Aprobación de Modelo - Balanzas', 'INTI', 'Metrología Legal', 'Aprobación Modelo',
 280000.00, 'INTI-001', 'Portal INTI', 90,
 ARRAY['Planos', 'Manual técnico', 'Muestras', 'Declaración conformidad'],
 'alta', 280000.00),

('TT-INTI-002', 'INTI-002', 'Verificación Primitiva - Balanzas', 'INTI', 'Metrología Legal', 'Verificación',
 45000.00, 'INTI-002', 'Portal INTI', 30,
 ARRAY['Aprobación modelo', 'Planilla datos', 'Disponibilidad equipo'],
 'alta', 45000.00),

('TT-INTI-003', 'INTI-003', 'Verificación Periódica - Balanzas', 'INTI', 'Metrología Legal', 'Verificación',
 28000.00, 'INTI-003', 'Portal INTI', 20,
 ARRAY['Certificado primitiva', 'Disponibilidad'],
 'alta', 28000.00),

('TT-INTI-004', 'INTI-004', 'Aprobación de Modelo - Surtidores Combustible', 'INTI', 'Metrología Legal', 'Aprobación Modelo',
 350000.00, 'INTI-004', 'Portal INTI', 120,
 ARRAY['Planos', 'Manual', 'Muestras', 'Ensayos previos', 'Declaración'],
 'alta', 350000.00),

('TT-INTI-005', 'INTI-005', 'Verificación Primitiva - Surtidores', 'INTI', 'Metrología Legal', 'Verificación',
 65000.00, 'INTI-005', 'Portal INTI', 30,
 ARRAY['Aprobación modelo', 'Disponibilidad'],
 'alta', 65000.00),

('TT-INTI-006', 'INTI-006', 'Aprobación de Modelo - Medidores Agua', 'INTI', 'Metrología Legal', 'Aprobación Modelo',
 250000.00, 'INTI-006', 'Portal INTI', 90,
 ARRAY['Planos', 'Manual', 'Muestras', 'Ensayos'],
 'alta', 250000.00),

('TT-INTI-007', 'INTI-007', 'Certificación Eficiencia Energética - Electrodomésticos', 'INTI', 'Certificación', 'Eficiencia Energética',
 180000.00, 'INTI-007', 'Portal INTI', 60,
 ARRAY['Ficha técnica', 'Ensayos laboratorio', 'Etiqueta propuesta'],
 'alta', 180000.00),

('TT-INTI-008', 'INTI-008', 'Ensayo Seguridad Eléctrica - Electrodomésticos', 'INTI', 'Ensayos', 'Seguridad',
 220000.00, 'INTI-008', 'Portal INTI', 45,
 ARRAY['Muestras', 'Manual', 'Planos eléctricos'],
 'alta', 220000.00),

('TT-INTI-009', 'INTI-009', 'Certificación Seguridad Juguetes', 'INTI', 'Certificación', 'Seguridad',
 150000.00, 'INTI-009', 'Portal INTI', 60,
 ARRAY['Muestras', 'Ficha técnica', 'Análisis riesgos'],
 'alta', 150000.00),

('TT-INTI-010', 'INTI-010', 'Ensayo Materiales - Textiles', 'INTI', 'Ensayos', 'Materiales',
 120000.00, 'INTI-010', 'Portal INTI', 30,
 ARRAY['Muestras suficientes', 'Especificación ensayo'],
 'alta', 120000.00)

ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  costo_base_2025 = EXCLUDED.costo_base_2025,
  plataforma_gestion = EXCLUDED.plataforma_gestion,
  subcategoria = EXCLUDED.subcategoria,
  documentacion_obligatoria = EXCLUDED.documentacion_obligatoria,
  prioridad = EXCLUDED.prioridad,
  costo_tasas_base = EXCLUDED.costo_tasas_base,
  sla_total_dias = EXCLUDED.sla_total_dias,
  codigo_oficial = EXCLUDED.codigo_oficial;

-- ============================================================================
-- SEDRONAR - RENPRE (5 trámites)
-- ============================================================================

INSERT INTO tramite_tipos (
  id, codigo, nombre, organismo_id, rubro, subcategoria,
  costo_base_2025, codigo_oficial, plataforma_gestion, sla_total_dias,
  documentacion_obligatoria, prioridad, costo_tasas_base
) VALUES
('TT-RENP-001', 'RENP-001', 'Inscripción RENPRE Importador', 'SEDRONAR', 'RENPRE', 'Inscripción',
 18000.00, 'RENP-001', 'Portal SEDRONAR', 60,
 ARRAY['AFIP', 'Estatuto', 'Poder', 'DNI', 'RT Químico', 'Depósito seguro'],
 'alta', 18000.00),

('TT-RENP-002', 'RENP-002', 'Inscripción RENPRE Fabricante', 'SEDRONAR', 'RENPRE', 'Inscripción',
 20000.00, 'RENP-002', 'Portal SEDRONAR', 75,
 ARRAY['AFIP', 'Habilitación', 'RT Químico', 'POE', 'Seguridad instalaciones'],
 'alta', 20000.00),

('TT-RENP-F01', 'RENP-F01', 'Formulario F01 - Solicitud Importación Precursores', 'SEDRONAR', 'RENPRE', 'Autorización',
 12000.00, 'RENP-F01', 'Portal SEDRONAR', 30,
 ARRAY['Inscripción RENPRE vigente', 'Detalle producto', 'Cantidad', 'Proveedor', 'Justificación uso'],
 'alta', 12000.00),

('TT-RENP-F02', 'RENP-F02', 'Formulario F02 - Ingreso Precursores', 'SEDRONAR', 'RENPRE', 'Control',
 0.00, 'RENP-F02', 'Portal SEDRONAR', 5,
 ARRAY['F01 aprobado', 'DUA', 'Factura'],
 'alta', 0.00),

('TT-RENP-F16', 'RENP-F16', 'Formulario F16 - Informe Trimestral Stock', 'SEDRONAR', 'RENPRE', 'Informe',
 0.00, 'RENP-F16', 'Portal SEDRONAR', 15,
 ARRAY['Movimientos stock', 'Saldos', 'Ventas/Usos'],
 'alta', 0.00)

ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  costo_base_2025 = EXCLUDED.costo_base_2025,
  plataforma_gestion = EXCLUDED.plataforma_gestion,
  subcategoria = EXCLUDED.subcategoria,
  documentacion_obligatoria = EXCLUDED.documentacion_obligatoria,
  prioridad = EXCLUDED.prioridad,
  costo_tasas_base = EXCLUDED.costo_tasas_base,
  sla_total_dias = EXCLUDED.sla_total_dias,
  codigo_oficial = EXCLUDED.codigo_oficial;

-- ============================================================================
-- AMBIENTE - CITES (3 trámites)
-- ============================================================================

INSERT INTO tramite_tipos (
  id, codigo, nombre, organismo_id, rubro, subcategoria,
  costo_base_2025, codigo_oficial, plataforma_gestion, sla_total_dias,
  documentacion_obligatoria, prioridad, costo_tasas_base
) VALUES
('TT-CIT-001', 'CIT-001', 'Inscripción RUOFS (Registro Único Operadores Fauna Silvestre)', 'AMBIENTE', 'Registro', 'RUOFS',
 8000.00, 'CIT-001', 'Portal Fauna', 60,
 ARRAY['AFIP', 'Habilitación', 'Depósito', 'RT Biólogo/Veterinario'],
 'alta', 8000.00),

('TT-CIT-002', 'CIT-002', 'Certificado CITES Importación', 'AMBIENTE', 'Certificación', 'Importación',
 10000.00, 'CIT-002', 'Portal Fauna', 30,
 ARRAY['RUOFS vigente', 'Permiso exportación país origen', 'Factura', 'Especie detallada'],
 'alta', 10000.00),

('TT-CIT-003', 'CIT-003', 'Certificado CITES Exportación', 'AMBIENTE', 'Certificación', 'Exportación',
 10000.00, 'CIT-003', 'Portal Fauna', 30,
 ARRAY['RUOFS vigente', 'Origen legal especie', 'Destino', 'No extinción'],
 'alta', 10000.00)

ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  costo_base_2025 = EXCLUDED.costo_base_2025,
  plataforma_gestion = EXCLUDED.plataforma_gestion,
  subcategoria = EXCLUDED.subcategoria,
  documentacion_obligatoria = EXCLUDED.documentacion_obligatoria,
  prioridad = EXCLUDED.prioridad,
  costo_tasas_base = EXCLUDED.costo_tasas_base,
  sla_total_dias = EXCLUDED.sla_total_dias,
  codigo_oficial = EXCLUDED.codigo_oficial;

-- ============================================================================
-- INASE (2 trámites)
-- ============================================================================

INSERT INTO tramite_tipos (
  id, codigo, nombre, organismo_id, rubro, subcategoria,
  costo_base_2025, codigo_oficial, plataforma_gestion, sla_total_dias,
  documentacion_obligatoria, prioridad, costo_tasas_base
) VALUES
('TT-INA-001', 'INA-001', 'Inscripción RNCyFS - Importador Semillas', 'INASE', 'Registro', 'RNCyFS',
 85000.00, 'INA-001', 'Portal INASE', 90,
 ARRAY['AFIP', 'Habilitación', 'RT Ingeniero Agrónomo', 'Depósito condiciones'],
 'alta', 85000.00),

('TT-INA-002', 'INA-002', 'Autorización Importación Semillas (por lote)', 'INASE', 'Autorización', 'Importación',
 25000.00, 'INA-002', 'Portal INASE', 45,
 ARRAY['RNCyFS vigente', 'Certificado fitosanitario', 'Análisis semilla', 'Cultivar registrado'],
 'alta', 25000.00)

ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  costo_base_2025 = EXCLUDED.costo_base_2025,
  plataforma_gestion = EXCLUDED.plataforma_gestion,
  subcategoria = EXCLUDED.subcategoria,
  documentacion_obligatoria = EXCLUDED.documentacion_obligatoria,
  prioridad = EXCLUDED.prioridad,
  costo_tasas_base = EXCLUDED.costo_tasas_base,
  sla_total_dias = EXCLUDED.sla_total_dias,
  codigo_oficial = EXCLUDED.codigo_oficial;

-- ============================================================================
-- ÍNDICES Y VERIFICACIÓN FINAL
-- ============================================================================

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_tramite_tipos_prioridad ON tramite_tipos(prioridad);
CREATE INDEX IF NOT EXISTS idx_tramite_tipos_organismo_prioridad ON tramite_tipos(organismo_id, prioridad);
CREATE INDEX IF NOT EXISTS idx_tramite_tipos_plataforma ON tramite_tipos(plataforma_gestion);
CREATE INDEX IF NOT EXISTS idx_tramite_tipos_codigo_oficial ON tramite_tipos(codigo_oficial);

-- Verificación final completa
DO $$
DECLARE
  total_alta INTEGER;
  count_inal INTEGER;
  count_pm INTEGER;
  count_cosm INTEGER;
  count_dom INTEGER;
  count_senasa INTEGER;
  count_inti INTEGER;
  count_sedronar INTEGER;
  count_cites INTEGER;
  count_inase INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_alta FROM tramite_tipos WHERE prioridad = 'alta';
  SELECT COUNT(*) INTO count_inal FROM tramite_tipos WHERE organismo_id = 'INAL' AND prioridad = 'alta';
  SELECT COUNT(*) INTO count_pm FROM tramite_tipos WHERE organismo_id = 'ANMAT_PM' AND prioridad = 'alta';
  SELECT COUNT(*) INTO count_cosm FROM tramite_tipos WHERE organismo_id = 'ANMAT' AND rubro = 'Cosméticos' AND prioridad = 'alta';
  SELECT COUNT(*) INTO count_dom FROM tramite_tipos WHERE organismo_id = 'ANMAT' AND rubro = 'Domisanitarios' AND prioridad = 'alta';
  SELECT COUNT(*) INTO count_senasa FROM tramite_tipos WHERE organismo_id = 'SENASA' AND prioridad = 'alta';
  SELECT COUNT(*) INTO count_inti FROM tramite_tipos WHERE organismo_id = 'INTI' AND prioridad = 'alta';
  SELECT COUNT(*) INTO count_sedronar FROM tramite_tipos WHERE organismo_id = 'SEDRONAR' AND prioridad = 'alta';
  SELECT COUNT(*) INTO count_cites FROM tramite_tipos WHERE organismo_id = 'AMBIENTE' AND prioridad = 'alta';
  SELECT COUNT(*) INTO count_inase FROM tramite_tipos WHERE organismo_id = 'INASE' AND prioridad = 'alta';
  
  RAISE NOTICE '====================================================================';
  RAISE NOTICE '          FASE 2A COMPLETADA - 110 TRÁMITES ALTA PRIORIDAD';
  RAISE NOTICE '====================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Distribución por organismo:';
  RAISE NOTICE '  - INAL:                   % trámites', count_inal;
  RAISE NOTICE '  - ANMAT PM:               % trámites', count_pm;
  RAISE NOTICE '  - ANMAT Cosméticos:       % trámites', count_cosm;
  RAISE NOTICE '  - ANMAT Domisanitarios:   % trámites', count_dom;
  RAISE NOTICE '  - SENASA:                 % trámites', count_senasa;
  RAISE NOTICE '  - INTI:                   % trámites', count_inti;
  RAISE NOTICE '  - SEDRONAR:               % trámites', count_sedronar;
  RAISE NOTICE '  - AMBIENTE (CITES):       % trámites', count_cites;
  RAISE NOTICE '  - INASE:                  % trámites', count_inase;
  RAISE NOTICE '';
  RAISE NOTICE '  TOTAL ALTA PRIORIDAD:     % trámites', total_alta;
  RAISE NOTICE '';
  RAISE NOTICE '====================================================================';
END $$;