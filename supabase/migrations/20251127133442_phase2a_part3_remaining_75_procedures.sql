/*
  # Fase 2A Parte 3 - Organismos Restantes (75 trámites)
  
  ## Descripción
  
  Completa la inserción de 110 trámites alta prioridad:
  - ANMAT Cosméticos: 15 trámites
  - ANMAT Domisanitarios: 15 trámites
  - SENASA: 25 trámites
  - INTI: 10 trámites
  - SEDRONAR: 5 trámites
  - AMBIENTE (CITES): 3 trámites
  - INASE: 2 trámites
  
  ## Total Fase 2A
  
  - INAL: 15 ✓
  - ANMAT PM: 20 ✓
  - ANMAT Cosméticos: 15 (esta migración)
  - ANMAT Domisanitarios: 15 (esta migración)
  - SENASA: 25 (esta migración)
  - INTI: 10 (esta migración)
  - SEDRONAR: 5 (esta migración)
  - CITES: 3 (esta migración)
  - INASE: 2 (esta migración)
  - **TOTAL: 110 trámites alta prioridad**
*/

-- ============================================================================
-- ANMAT COSMÉTICOS (15 trámites)
-- ============================================================================

INSERT INTO tramite_tipos (
  id, codigo, nombre, organismo_id, rubro, subcategoria,
  costo_base_2025, codigo_oficial, plataforma_gestion, sla_total_dias,
  documentacion_obligatoria, prioridad, costo_tasas_base
) VALUES
('TT-COSM-LEG-001', 'COSM-LEG-001', 'Legajo Digital Importador Cosméticos', 'ANMAT', 'Cosméticos', 'Legajo',
 40000.00, '5001', 'TAD', 60,
 ARRAY['AFIP vigente', 'Estatuto', 'Poder', 'DNI'],
 'alta', 40000.00),

('TT-COSM-LEG-002', 'COSM-LEG-002', 'Legajo + rubro cremas/lociones', 'ANMAT', 'Cosméticos', 'Legajo',
 42000.00, '5001A', 'TAD', 60,
 ARRAY['Docs legajo', 'Detalle rubro'],
 'alta', 42000.00),

('TT-COSM-LEG-003', 'COSM-LEG-003', 'Legajo + rubro shampoos/jabones', 'ANMAT', 'Cosméticos', 'Legajo',
 42000.00, '5001B', 'TAD', 60,
 ARRAY['Docs legajo', 'Detalle rubro'],
 'alta', 42000.00),

('TT-COSM-HAB-001', 'COSM-HAB-001', 'Habilitación Depósito Cosméticos', 'ANMAT', 'Cosméticos', 'Habilitación',
 30000.00, '5002', 'TAD', 60,
 ARRAY['Habilitación municipal', 'Plano', 'POE'],
 'alta', 30000.00),

('TT-COSM-RT-001', 'COSM-RT-001', 'Designación RT Cosméticos', 'ANMAT', 'Cosméticos', 'Personal',
 12000.00, '5003', 'TAD', 30,
 ARRAY['CV', 'Título', 'Matrícula', 'DDJJ'],
 'alta', 12000.00),

('TT-COSM-NOT-001', 'COSM-NOT-001', 'Notificación Grado 1 (cremas/shampoos)', 'ANMAT', 'Cosméticos', 'Notificación',
 28000.00, '5100', 'TAD', 30,
 ARRAY['Formulario', 'Fórmula INCI', 'Rótulo', 'CFS', 'FISPQ'],
 'alta', 28000.00),

('TT-COSM-NOT-002', 'COSM-NOT-002', 'Notificación jabones/desodorantes', 'ANMAT', 'Cosméticos', 'Notificación',
 28000.00, '5100A', 'TAD', 30,
 ARRAY['Formulario', 'Fórmula', 'Rótulo', 'CFS'],
 'alta', 28000.00),

('TT-COSM-NOT-003', 'COSM-NOT-003', 'Notificación perfumes', 'ANMAT', 'Cosméticos', 'Notificación',
 30000.00, '5100B', 'TAD', 45,
 ARRAY['Formulario', 'Fórmula', 'Rótulo', 'CFS', 'Alérgenos declarados'],
 'alta', 30000.00),

('TT-COSM-REG-001', 'COSM-REG-001', 'Registro Grado 2 (tintes/depilatorios)', 'ANMAT', 'Cosméticos', 'Registro',
 45000.00, '5101', 'TAD', 60,
 ARRAY['Formulario', 'Fórmula', 'Rótulo', 'CFS', 'FISPQ', 'Estudios seguridad'],
 'alta', 45000.00),

('TT-COSM-REG-002', 'COSM-REG-002', 'Registro protectores solares', 'ANMAT', 'Cosméticos', 'Registro',
 48000.00, '5101A', 'TAD', 75,
 ARRAY['Formulario', 'Fórmula', 'Rótulo', 'CFS', 'FPS in vitro/in vivo', 'Fotoestabilidad'],
 'alta', 48000.00),

('TT-COSM-REG-003', 'COSM-REG-003', 'Registro productos orales fluorados', 'ANMAT', 'Cosméticos', 'Registro',
 42000.00, '5102', 'TAD', 60,
 ARRAY['Formulario', 'Fórmula', 'Rótulo', 'CFS', 'Concentración flúor'],
 'alta', 42000.00),

('TT-COSM-IMP-001', 'COSM-IMP-001', 'Aviso Importación Operación Cosméticos', 'ANMAT', 'Cosméticos', 'Importación',
 0.00, '5402', 'VUCE', 1,
 ARRAY['Notif/Registro', 'Factura', 'BL'],
 'alta', 0.00),

('TT-COSM-IMP-002', 'COSM-IMP-002', 'Ingreso Muestras Sin Valor Cosméticos', 'ANMAT', 'Cosméticos', 'Importación',
 2000.00, '5401', 'TAD', 15,
 ARRAY['Nota finalidad', 'Invoice'],
 'alta', 2000.00),

('TT-COSM-CERT-001', 'COSM-CERT-001', 'Certificado Libre Comercialización Cosméticos', 'ANMAT', 'Cosméticos', 'Certificación',
 12000.00, '5600', 'TAD', 20,
 ARRAY['Solicitud', 'Notif/Registro vigente'],
 'alta', 12000.00),

('TT-COSM-CERT-002', 'COSM-CERT-002', 'Constancia Trazabilidad Cosméticos', 'ANMAT', 'Cosméticos', 'Certificación',
 3000.00, '5602', 'TAD', 10,
 ARRAY['Lote', 'Operación'],
 'alta', 3000.00)

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
-- ANMAT DOMISANITARIOS (15 trámites)
-- ============================================================================

INSERT INTO tramite_tipos (
  id, codigo, nombre, organismo_id, rubro, subcategoria,
  costo_base_2025, codigo_oficial, plataforma_gestion, sla_total_dias,
  documentacion_obligatoria, prioridad, costo_tasas_base
) VALUES
('TT-DOM-LEG-001', 'DOM-LEG-001', 'Legajo Digital Importador Domisanitarios', 'ANMAT', 'Domisanitarios', 'Legajo',
 45000.00, '6001', 'TAD', 60,
 ARRAY['AFIP vigente', 'Estatuto', 'Poder', 'DNI'],
 'alta', 45000.00),

('TT-DOM-LEG-002', 'DOM-LEG-002', 'Legajo + rubro Riesgo I', 'ANMAT', 'Domisanitarios', 'Legajo',
 48000.00, '6001A', 'TAD', 60,
 ARRAY['Docs legajo', 'Detalle rubro'],
 'alta', 48000.00),

('TT-DOM-LEG-003', 'DOM-LEG-003', 'Legajo + rubro Riesgo IIA/IIB', 'ANMAT', 'Domisanitarios', 'Legajo',
 52000.00, '6001B', 'TAD', 75,
 ARRAY['Docs legajo', 'Detalle rubro', 'RT especializado'],
 'alta', 52000.00),

('TT-DOM-HAB-001', 'DOM-HAB-001', 'Habilitación Depósito Domisanitarios', 'ANMAT', 'Domisanitarios', 'Habilitación',
 35000.00, '6002', 'TAD', 60,
 ARRAY['Habilitación municipal', 'Plano', 'POE', 'Medidas seguridad'],
 'alta', 35000.00),

('TT-DOM-RT-001', 'DOM-RT-001', 'Designación RT Domisanitarios', 'ANMAT', 'Domisanitarios', 'Personal',
 15000.00, '6003', 'TAD', 30,
 ARRAY['CV', 'Título', 'Matrícula', 'DDJJ', 'Capacitación específica'],
 'alta', 15000.00),

('TT-DOM-NOT-001', 'DOM-NOT-001', 'Notificación Riesgo I (desinfectantes uso general)', 'ANMAT', 'Domisanitarios', 'Notificación',
 32000.00, '6100', 'TAD', 45,
 ARRAY['Formulario', 'Fórmula cualicuantitativa', 'Rótulo', 'CFS', 'MSDS', 'Eficacia'],
 'alta', 32000.00),

('TT-DOM-NOT-002', 'DOM-NOT-002', 'Notificación insecticidas domésticos', 'ANMAT', 'Domisanitarios', 'Notificación',
 32000.00, '6100A', 'TAD', 45,
 ARRAY['Formulario', 'Fórmula', 'Rótulo', 'CFS', 'MSDS', 'Eficacia', 'Toxicología'],
 'alta', 32000.00),

('TT-DOM-REG-001', 'DOM-REG-001', 'Registro Riesgo IIA (desinfectantes hospitalarios)', 'ANMAT', 'Domisanitarios', 'Registro',
 55000.00, '6101', 'TAD', 75,
 ARRAY['Formulario', 'Fórmula', 'Rótulo', 'CFS', 'MSDS', 'Eficacia microbicida', 'Toxicología completa'],
 'alta', 55000.00),

('TT-DOM-REG-002', 'DOM-REG-002', 'Registro Riesgo IIB (rodenticidas/biocidas)', 'ANMAT', 'Domisanitarios', 'Registro',
 65000.00, '6101B', 'TAD', 90,
 ARRAY['Formulario', 'Fórmula', 'Rótulo', 'CFS', 'MSDS', 'Estudios eficacia', 'Toxicología completa', 'Ecotoxicología'],
 'alta', 65000.00),

('TT-DOM-REG-003', 'DOM-REG-003', 'Registro aerosoles domisanitarios', 'ANMAT', 'Domisanitarios', 'Registro',
 48000.00, '6102', 'TAD', 60,
 ARRAY['Formulario', 'Fórmula', 'Rótulo', 'CFS', 'MSDS', 'Envase aerosol', 'Seguridad propelente'],
 'alta', 48000.00),

('TT-DOM-MOD-001', 'DOM-MOD-001', 'Modificación Notificación Domisanitario', 'ANMAT', 'Domisanitarios', 'Modificación',
 15000.00, '6200', 'TAD', 45,
 ARRAY['Nota cambio', 'Docs respaldatorios'],
 'alta', 15000.00),

('TT-DOM-MOD-002', 'DOM-MOD-002', 'Modificación Registro Domisanitario', 'ANMAT', 'Domisanitarios', 'Modificación',
 22000.00, '6200A', 'TAD', 60,
 ARRAY['Nota cambio', 'Docs respaldatorios', 'Estudios si aplica'],
 'alta', 22000.00),

('TT-DOM-IMP-001', 'DOM-IMP-001', 'Aviso Importación Operación Domisanitarios', 'ANMAT', 'Domisanitarios', 'Importación',
 0.00, '6400', 'VUCE', 1,
 ARRAY['Notif/Registro', 'Factura', 'BL', 'MSDS'],
 'alta', 0.00),

('TT-DOM-CERT-001', 'DOM-CERT-001', 'Certificado Libre Comercialización Domisanitarios', 'ANMAT', 'Domisanitarios', 'Certificación',
 15000.00, '6600', 'TAD', 20,
 ARRAY['Solicitud', 'Notif/Registro vigente'],
 'alta', 15000.00),

('TT-DOM-CERT-002', 'DOM-CERT-002', 'Constancia Trazabilidad Domisanitarios', 'ANMAT', 'Domisanitarios', 'Certificación',
 3000.00, '6602', 'TAD', 10,
 ARRAY['Lote', 'Operación'],
 'alta', 3000.00)

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

-- Continúa en siguiente mensaje por límite de caracteres...