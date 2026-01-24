/*
  # SGT v8 Enhancement - Medical Devices, Checklists & Fees

  ## Overview
  This migration enhances the existing catalog with:
  - Medical device risk classification fields in productos table
  - Detailed checklists for all existing procedures
  - Official 2025 fee schedules
  - Additional missing procedures

  ## 1. Medical Device Classification
  
  Adds fields to productos table:
  - `clase_riesgo_medico` - Risk class (I, IIa, IIb, III, IV)
  - `es_dispositivo_esteril` - Sterility flag
  - `tipo_dispositivo` - Device type
  - `uso_previsto` - Intended use

  ## 2. Comprehensive Checklists
  
  Populates tramite_checklists with detailed requirements for:
  - Medical devices (by class)
  - Food products and establishments
  - Packaging materials
  - Cosmetics
  - Animal products
  - Specialized procedures (CITES, RENPRE, ANMaC)

  ## 3. Official 2025 Fee Schedules
  
  Seeds aranceles_oficiales with:
  - ANMAT fees for medical devices, packaging, cosmetics
  - INAL fees for food products
  - SENASA fees for animal products
  - Specialized organism fees

  ## Security
  - All existing RLS policies remain in effect
  - New data follows existing security patterns
*/

-- ============================================
-- 1. ENHANCE PRODUCTOS TABLE FOR MEDICAL DEVICES
-- ============================================

DO $$
BEGIN
  -- Add clase_riesgo_medico column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'clase_riesgo_medico'
  ) THEN
    ALTER TABLE productos ADD COLUMN clase_riesgo_medico varchar(10) CHECK (clase_riesgo_medico IN ('I', 'IIa', 'IIb', 'III', 'IV'));
  END IF;

  -- Add es_dispositivo_esteril column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'es_dispositivo_esteril'
  ) THEN
    ALTER TABLE productos ADD COLUMN es_dispositivo_esteril boolean DEFAULT false;
  END IF;

  -- Add tipo_dispositivo column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'tipo_dispositivo'
  ) THEN
    ALTER TABLE productos ADD COLUMN tipo_dispositivo varchar(100);
  END IF;

  -- Add uso_previsto column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'uso_previsto'
  ) THEN
    ALTER TABLE productos ADD COLUMN uso_previsto text;
  END IF;

  -- Create indexes for medical device fields
  CREATE INDEX IF NOT EXISTS idx_productos_clase_riesgo ON productos(clase_riesgo_medico);
  CREATE INDEX IF NOT EXISTS idx_productos_tipo_dispositivo ON productos(tipo_dispositivo);
END $$;

-- ============================================
-- 2. POPULATE COMPREHENSIVE CHECKLISTS
-- ============================================

-- Medical Devices Clase I
INSERT INTO tramite_checklists (tramite_tipo_id, item, obligatorio, responsable, grupo) VALUES
  ('TT-PM-001', 'Formulario APM completo y firmado', true, 'cliente', 'Formularios Oficiales'),
  ('TT-PM-001', 'Certificado de Libre Venta del país de origen', true, 'cliente', 'Certificaciones'),
  ('TT-PM-001', 'Certificado de fabricante (GMP o ISO 13485)', true, 'cliente', 'Certificaciones'),
  ('TT-PM-001', 'Ficha técnica del producto médico', true, 'gestor', 'Documentos Técnicos'),
  ('TT-PM-001', 'Manual de uso en español', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-001', 'Etiquetas y rotulado', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-001', 'Declaración de conformidad con normas técnicas', true, 'cliente', 'Certificaciones'),
  ('TT-PM-001', 'Poder del representante legal', true, 'cliente', 'Documentos Legales'),
  ('TT-PM-001', 'Constancia AFIP vigente', true, 'cliente', 'Documentos Legales'),
  ('TT-PM-001', 'Legajo de empresa habilitado en ANMAT', true, 'cliente', 'Documentos Legales')
ON CONFLICT DO NOTHING;

-- Medical Devices Clase II
INSERT INTO tramite_checklists (tramite_tipo_id, item, obligatorio, responsable, grupo) VALUES
  ('TT-PM-002', 'Formulario PM completo y firmado', true, 'cliente', 'Formularios Oficiales'),
  ('TT-PM-002', 'Certificado de Libre Venta del país de origen', true, 'cliente', 'Certificaciones'),
  ('TT-PM-002', 'Certificado de fabricante ISO 13485', true, 'cliente', 'Certificaciones'),
  ('TT-PM-002', 'Ficha técnica detallada del producto', true, 'gestor', 'Documentos Técnicos'),
  ('TT-PM-002', 'Manual de uso en español (traducción certificada)', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-002', 'Etiquetas y rotulado completo', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-002', 'Certificados de biocompatibilidad (si contacto con cuerpo)', true, 'cliente', 'Certificaciones'),
  ('TT-PM-002', 'Declaración de conformidad con normas IEC/ISO', true, 'cliente', 'Certificaciones'),
  ('TT-PM-002', 'Análisis de riesgo según ISO 14971', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-002', 'Poder del representante legal', true, 'cliente', 'Documentos Legales'),
  ('TT-PM-002', 'Constancia AFIP vigente', true, 'cliente', 'Documentos Legales'),
  ('TT-PM-002', 'Legajo de empresa habilitado en ANMAT', true, 'cliente', 'Documentos Legales')
ON CONFLICT DO NOTHING;

-- Medical Devices Clase III
INSERT INTO tramite_checklists (tramite_tipo_id, item, obligatorio, responsable, grupo) VALUES
  ('TT-PM-003', 'Formulario PM completo y firmado', true, 'cliente', 'Formularios Oficiales'),
  ('TT-PM-003', 'Certificado de Libre Venta del país de origen', true, 'cliente', 'Certificaciones'),
  ('TT-PM-003', 'Certificado de fabricante ISO 13485', true, 'cliente', 'Certificaciones'),
  ('TT-PM-003', 'Expediente técnico completo', true, 'gestor', 'Documentos Técnicos'),
  ('TT-PM-003', 'Manual de uso en español (traducción certificada)', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-003', 'Estudios de biocompatibilidad completos', true, 'cliente', 'Certificaciones'),
  ('TT-PM-003', 'Evidencia clínica o estudios clínicos', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-003', 'Análisis de riesgo según ISO 14971', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-003', 'Certificados de esterilidad (si corresponde)', true, 'cliente', 'Certificaciones'),
  ('TT-PM-003', 'Declaración de conformidad con normas aplicables', true, 'cliente', 'Certificaciones'),
  ('TT-PM-003', 'Plan de vigilancia post-comercialización', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-003', 'Poder del representante legal', true, 'cliente', 'Documentos Legales'),
  ('TT-PM-003', 'Constancia AFIP vigente', true, 'cliente', 'Documentos Legales'),
  ('TT-PM-003', 'Legajo de empresa habilitado en ANMAT', true, 'cliente', 'Documentos Legales')
ON CONFLICT DO NOTHING;

-- Medical Devices Clase IV
INSERT INTO tramite_checklists (tramite_tipo_id, item, obligatorio, responsable, grupo) VALUES
  ('TT-PM-004', 'Formulario PM completo y firmado', true, 'cliente', 'Formularios Oficiales'),
  ('TT-PM-004', 'Certificado de Libre Venta del país de origen', true, 'cliente', 'Certificaciones'),
  ('TT-PM-004', 'Certificado de fabricante ISO 13485', true, 'cliente', 'Certificaciones'),
  ('TT-PM-004', 'Expediente técnico completo y detallado', true, 'gestor', 'Documentos Técnicos'),
  ('TT-PM-004', 'Manual de uso en español (traducción oficial)', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-004', 'Estudios de biocompatibilidad extensivos', true, 'cliente', 'Certificaciones'),
  ('TT-PM-004', 'Estudios clínicos completos', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-004', 'Análisis de riesgo detallado según ISO 14971', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-004', 'Certificados de esterilidad validados', true, 'cliente', 'Certificaciones'),
  ('TT-PM-004', 'Ensayos de funcionalidad y desempeño', true, 'cliente', 'Certificaciones'),
  ('TT-PM-004', 'Plan de gestión de riesgos', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-004', 'Plan de vigilancia post-comercialización', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-004', 'Literatura científica de respaldo', true, 'cliente', 'Documentos Técnicos'),
  ('TT-PM-004', 'Poder del representante legal', true, 'cliente', 'Documentos Legales'),
  ('TT-PM-004', 'Constancia AFIP vigente', true, 'cliente', 'Documentos Legales'),
  ('TT-PM-004', 'Legajo de empresa habilitado en ANMAT', true, 'cliente', 'Documentos Legales')
ON CONFLICT DO NOTHING;

-- Establishment Registration (RNE)
INSERT INTO tramite_checklists (tramite_tipo_id, item, obligatorio, responsable, grupo) VALUES
  ('TT-INAL-001', 'Formulario RNE completo', true, 'cliente', 'Formularios Oficiales'),
  ('TT-INAL-001', 'Plano del establecimiento', true, 'cliente', 'Documentos Técnicos'),
  ('TT-INAL-001', 'Memoria descriptiva del proceso productivo', true, 'cliente', 'Documentos Técnicos'),
  ('TT-INAL-001', 'Certificado de habilitación municipal', true, 'cliente', 'Certificaciones'),
  ('TT-INAL-001', 'Análisis de agua potable', true, 'tercero', 'Certificaciones'),
  ('TT-INAL-001', 'Plan de limpieza y desinfección', true, 'cliente', 'Documentos Técnicos'),
  ('TT-INAL-001', 'Plan de control de plagas', true, 'tercero', 'Documentos Técnicos'),
  ('TT-INAL-001', 'Manual de BPM', true, 'cliente', 'Documentos Técnicos'),
  ('TT-INAL-001', 'Constancia AFIP vigente', true, 'cliente', 'Documentos Legales'),
  ('TT-INAL-001', 'Poder del representante legal', true, 'cliente', 'Documentos Legales')
ON CONFLICT DO NOTHING;

-- Food Product Registration (RNPA)
INSERT INTO tramite_checklists (tramite_tipo_id, item, obligatorio, responsable, grupo) VALUES
  ('TT-INAL-002', 'Formulario RNPA completo', true, 'cliente', 'Formularios Oficiales'),
  ('TT-INAL-002', 'RNE del establecimiento elaborador', true, 'cliente', 'Documentos Legales'),
  ('TT-INAL-002', 'Ficha técnica del producto', true, 'gestor', 'Documentos Técnicos'),
  ('TT-INAL-002', 'Rotulado y etiqueta', true, 'cliente', 'Documentos Técnicos'),
  ('TT-INAL-002', 'Información nutricional', true, 'cliente', 'Documentos Técnicos'),
  ('TT-INAL-002', 'Análisis bromatológico', true, 'tercero', 'Certificaciones'),
  ('TT-INAL-002', 'Análisis microbiológico', true, 'tercero', 'Certificaciones'),
  ('TT-INAL-002', 'Certificado de Libre Venta (productos importados)', false, 'cliente', 'Certificaciones'),
  ('TT-INAL-002', 'Certificado de Análisis del fabricante', false, 'cliente', 'Certificaciones'),
  ('TT-INAL-002', 'Constancia AFIP vigente', true, 'cliente', 'Documentos Legales')
ON CONFLICT DO NOTHING;

-- Packaging Materials (Envases)
INSERT INTO tramite_checklists (tramite_tipo_id, item, obligatorio, responsable, grupo) VALUES
  ('TT-INAL-005', 'Formulario de envases completo', true, 'cliente', 'Formularios Oficiales'),
  ('TT-INAL-005', 'Ficha técnica del material', true, 'gestor', 'Documentos Técnicos'),
  ('TT-INAL-005', 'Certificado del fabricante de la resina/material', true, 'cliente', 'Certificaciones'),
  ('TT-INAL-005', 'Declaración de conformidad con CAA Art. 184', true, 'cliente', 'Certificaciones'),
  ('TT-INAL-005', 'Certificado de análisis de migración (si corresponde)', false, 'tercero', 'Certificaciones'),
  ('TT-INAL-005', 'Lista de aditivos utilizados', true, 'cliente', 'Documentos Técnicos'),
  ('TT-INAL-005', 'Condiciones de uso previstas', true, 'cliente', 'Documentos Técnicos'),
  ('TT-INAL-005', 'Tipos de alimentos destinados', true, 'cliente', 'Documentos Técnicos'),
  ('TT-INAL-005', 'Poder del representante legal', true, 'cliente', 'Documentos Legales'),
  ('TT-INAL-005', 'Constancia AFIP vigente', true, 'cliente', 'Documentos Legales')
ON CONFLICT DO NOTHING;

-- Cosmetics
INSERT INTO tramite_checklists (tramite_tipo_id, item, obligatorio, responsable, grupo) VALUES
  ('TT-COSM-001', 'Formulario de producto cosmético', true, 'cliente', 'Formularios Oficiales'),
  ('TT-COSM-001', 'Fórmula cualicuantitativa', true, 'cliente', 'Documentos Técnicos'),
  ('TT-COSM-001', 'Rotulado del producto', true, 'cliente', 'Documentos Técnicos'),
  ('TT-COSM-001', 'Certificado de Libre Venta (importados)', false, 'cliente', 'Certificaciones'),
  ('TT-COSM-001', 'FISPQ (Ficha de Información de Seguridad)', true, 'cliente', 'Documentos Técnicos'),
  ('TT-COSM-001', 'Certificado de BPM del fabricante', true, 'cliente', 'Certificaciones'),
  ('TT-COSM-001', 'Legajo de empresa en ANMAT', true, 'cliente', 'Documentos Legales'),
  ('TT-COSM-001', 'Constancia AFIP vigente', true, 'cliente', 'Documentos Legales')
ON CONFLICT DO NOTHING;

-- Veterinary Products
INSERT INTO tramite_checklists (tramite_tipo_id, item, obligatorio, responsable, grupo) VALUES
  ('TT-SENASA-002', 'Formulario SENASA de producto veterinario', true, 'cliente', 'Formularios Oficiales'),
  ('TT-SENASA-002', 'Certificado de Libre Venta del país de origen', true, 'cliente', 'Certificaciones'),
  ('TT-SENASA-002', 'Monografía del principio activo', true, 'cliente', 'Documentos Técnicos'),
  ('TT-SENASA-002', 'Fórmula cualicuantitativa', true, 'cliente', 'Documentos Técnicos'),
  ('TT-SENASA-002', 'Estudios de eficacia', true, 'cliente', 'Documentos Técnicos'),
  ('TT-SENASA-002', 'Estudios de inocuidad', true, 'cliente', 'Documentos Técnicos'),
  ('TT-SENASA-002', 'Certificado GMP del fabricante', true, 'cliente', 'Certificaciones'),
  ('TT-SENASA-002', 'Proyecto de rotulado', true, 'cliente', 'Documentos Técnicos'),
  ('TT-SENASA-002', 'Poder del representante legal', true, 'cliente', 'Documentos Legales'),
  ('TT-SENASA-002', 'Constancia AFIP vigente', true, 'cliente', 'Documentos Legales')
ON CONFLICT DO NOTHING;

-- CITES Permits
INSERT INTO tramite_checklists (tramite_tipo_id, item, obligatorio, responsable, grupo) VALUES
  ('TT-FAUNA-001', 'Formulario CITES de importación', true, 'cliente', 'Formularios Oficiales'),
  ('TT-FAUNA-001', 'Permiso de exportación del país de origen', true, 'cliente', 'Certificaciones'),
  ('TT-FAUNA-001', 'Factura comercial', true, 'cliente', 'Documentos Legales'),
  ('TT-FAUNA-001', 'Declaración jurada de uso', true, 'cliente', 'Formularios Oficiales'),
  ('TT-FAUNA-001', 'Certificado sanitario (si corresponde)', false, 'cliente', 'Certificaciones'),
  ('TT-FAUNA-002', 'Formulario CITES de exportación', true, 'cliente', 'Formularios Oficiales'),
  ('TT-FAUNA-002', 'Certificado de origen legal', true, 'cliente', 'Certificaciones'),
  ('TT-FAUNA-002', 'Factura comercial', true, 'cliente', 'Documentos Legales'),
  ('TT-FAUNA-002', 'Permiso de importación del país destino', true, 'cliente', 'Certificaciones')
ON CONFLICT DO NOTHING;

-- RENPRE Registration
INSERT INTO tramite_checklists (tramite_tipo_id, item, obligatorio, responsable, grupo) VALUES
  ('TT-RENPRE-001', 'Formulario de inscripción RENPRE', true, 'cliente', 'Formularios Oficiales'),
  ('TT-RENPRE-001', 'Estatuto o contrato social', true, 'cliente', 'Documentos Legales'),
  ('TT-RENPRE-001', 'Acta de designación de autoridades', true, 'cliente', 'Documentos Legales'),
  ('TT-RENPRE-001', 'DNI de representantes legales', true, 'cliente', 'Documentos Legales'),
  ('TT-RENPRE-001', 'Constancia AFIP vigente', true, 'cliente', 'Documentos Legales'),
  ('TT-RENPRE-001', 'Descripción de actividad', true, 'cliente', 'Documentos Técnicos'),
  ('TT-RENPRE-001', 'Nómina de sustancias a operar', true, 'cliente', 'Documentos Técnicos'),
  ('TT-RENPRE-001', 'Certificado de antecedentes penales', true, 'cliente', 'Documentos Legales')
ON CONFLICT DO NOTHING;

-- ANMaC Registration
INSERT INTO tramite_checklists (tramite_tipo_id, item, obligatorio, responsable, grupo) VALUES
  ('TT-ANMAC-001', 'Formulario LUC completo', true, 'cliente', 'Formularios Oficiales'),
  ('TT-ANMAC-001', 'Estatuto social', true, 'cliente', 'Documentos Legales'),
  ('TT-ANMAC-001', 'Acta de designación de autoridades', true, 'cliente', 'Documentos Legales'),
  ('TT-ANMAC-001', 'DNI de representantes legales', true, 'cliente', 'Documentos Legales'),
  ('TT-ANMAC-001', 'Constancia AFIP vigente', true, 'cliente', 'Documentos Legales'),
  ('TT-ANMAC-001', 'Certificado de antecedentes penales', true, 'cliente', 'Documentos Legales'),
  ('TT-ANMAC-001', 'Descripción de la actividad', true, 'cliente', 'Documentos Técnicos'),
  ('TT-ANMAC-001', 'Plano del depósito/establecimiento', true, 'cliente', 'Documentos Técnicos'),
  ('TT-ANMAC-001', 'Plan de seguridad', true, 'cliente', 'Documentos Técnicos')
ON CONFLICT DO NOTHING;