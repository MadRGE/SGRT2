-- Tabla de requisitos de documentos por división ANMAT
-- Define qué documentos son necesarios para cada tipo de trámite

CREATE TABLE IF NOT EXISTS anmat_requisitos_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  es_obligatorio BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  categoria VARCHAR(50), -- LEGAL, TECNICO, COMERCIAL, SANITARIO
  aplica_importado BOOLEAN DEFAULT true,
  aplica_nacional BOOLEAN DEFAULT true,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_anmat_requisitos_division ON anmat_requisitos_documentos(division_codigo);

-- REQUISITOS PARA ALIMENTOS (RNPA)
INSERT INTO anmat_requisitos_documentos (division_codigo, nombre, descripcion, es_obligatorio, orden, categoria) VALUES
-- Documentos legales
('ALIMENTOS', 'Poder o autorización del titular', 'Poder notarial o carta de autorización firmada', true, 1, 'LEGAL'),
('ALIMENTOS', 'Contrato social o estatuto', 'Copia del contrato social vigente', true, 2, 'LEGAL'),
('ALIMENTOS', 'Constancia de CUIT', 'Constancia de inscripción en AFIP', true, 3, 'LEGAL'),
('ALIMENTOS', 'RNE (Registro Nacional de Establecimiento)', 'Número de RNE del elaborador', true, 4, 'LEGAL'),
-- Documentos técnicos
('ALIMENTOS', 'Rótulo/etiqueta del producto', 'Diseño de etiqueta con información nutricional', true, 10, 'TECNICO'),
('ALIMENTOS', 'Fórmula cuali-cuantitativa', 'Composición del producto en porcentajes', true, 11, 'TECNICO'),
('ALIMENTOS', 'Proceso de elaboración', 'Diagrama de flujo del proceso productivo', true, 12, 'TECNICO'),
('ALIMENTOS', 'Análisis microbiológicos', 'Ensayos de laboratorio habilitado', true, 13, 'TECNICO'),
('ALIMENTOS', 'Análisis físico-químicos', 'Ensayos de laboratorio habilitado', true, 14, 'TECNICO'),
('ALIMENTOS', 'Vida útil del producto', 'Estudio de estabilidad o declaración jurada', true, 15, 'TECNICO'),
-- Solo importados
('ALIMENTOS', 'Certificado de libre venta origen', 'Certificado del país de origen apostillado', true, 20, 'LEGAL'),
('ALIMENTOS', 'Certificado de análisis del fabricante', 'COA del lote a importar', false, 21, 'TECNICO');

-- REQUISITOS PARA ENVASES (contacto con alimentos)
INSERT INTO anmat_requisitos_documentos (division_codigo, nombre, descripcion, es_obligatorio, orden, categoria) VALUES
('ENVASES', 'Poder o autorización del titular', 'Poder notarial o carta de autorización firmada', true, 1, 'LEGAL'),
('ENVASES', 'Contrato social o estatuto', 'Copia del contrato social vigente', true, 2, 'LEGAL'),
('ENVASES', 'Constancia de CUIT', 'Constancia de inscripción en AFIP', true, 3, 'LEGAL'),
('ENVASES', 'Ficha técnica del envase', 'Especificaciones técnicas del material', true, 10, 'TECNICO'),
('ENVASES', 'Certificado de aptitud sanitaria', 'Del fabricante o laboratorio habilitado', true, 11, 'TECNICO'),
('ENVASES', 'Ensayos de migración global', 'Según Res. GMC 32/07', true, 12, 'TECNICO'),
('ENVASES', 'Ensayos de migración específica', 'Para materiales plásticos', false, 13, 'TECNICO'),
('ENVASES', 'Declaración de composición', 'Materiales y aditivos utilizados', true, 14, 'TECNICO'),
('ENVASES', 'Certificado de origen', 'Para envases importados', true, 20, 'LEGAL'),
('ENVASES', 'Lista positiva de componentes', 'Declaración de cumplimiento', true, 15, 'TECNICO');

-- REQUISITOS PARA MEDICAMENTOS
INSERT INTO anmat_requisitos_documentos (division_codigo, nombre, descripcion, es_obligatorio, orden, categoria) VALUES
('MEDICAMENTOS', 'Poder o autorización del titular', 'Poder notarial o carta de autorización firmada', true, 1, 'LEGAL'),
('MEDICAMENTOS', 'Habilitación de droguería', 'Certificado de habilitación vigente', true, 2, 'LEGAL'),
('MEDICAMENTOS', 'Director técnico', 'Designación y matrícula profesional', true, 3, 'LEGAL'),
('MEDICAMENTOS', 'Certificado de BPM', 'Buenas Prácticas de Manufactura del elaborador', true, 10, 'TECNICO'),
('MEDICAMENTOS', 'Dossier técnico (CTD)', 'Documentación técnica en formato CTD', true, 11, 'TECNICO'),
('MEDICAMENTOS', 'Estudios de estabilidad', 'Zona IV o equivalente', true, 12, 'TECNICO'),
('MEDICAMENTOS', 'Especificaciones de materia prima', 'Farmacopea de referencia', true, 13, 'TECNICO'),
('MEDICAMENTOS', 'Especificaciones de producto terminado', 'Métodos analíticos validados', true, 14, 'TECNICO'),
('MEDICAMENTOS', 'Estudios de bioequivalencia', 'Si aplica según categoría', false, 15, 'TECNICO'),
('MEDICAMENTOS', 'Certificado de libre venta', 'Del país de origen apostillado', true, 20, 'LEGAL'),
('MEDICAMENTOS', 'Proyecto de rótulo y prospecto', 'Según normativa vigente', true, 16, 'TECNICO');

-- REQUISITOS PARA PRODUCTOS MÉDICOS
INSERT INTO anmat_requisitos_documentos (division_codigo, nombre, descripcion, es_obligatorio, orden, categoria) VALUES
('PROD_MEDICOS', 'Poder o autorización del titular', 'Poder notarial o carta de autorización firmada', true, 1, 'LEGAL'),
('PROD_MEDICOS', 'Habilitación de la empresa', 'Como importador/fabricante de PM', true, 2, 'LEGAL'),
('PROD_MEDICOS', 'Director técnico', 'Designación y matrícula profesional', true, 3, 'LEGAL'),
('PROD_MEDICOS', 'Certificado de libre venta', 'Del país de origen apostillado', true, 10, 'LEGAL'),
('PROD_MEDICOS', 'Certificado ISO 13485', 'Del fabricante vigente', true, 11, 'TECNICO'),
('PROD_MEDICOS', 'Declaración de conformidad CE', 'Si tiene marcado CE', false, 12, 'TECNICO'),
('PROD_MEDICOS', 'Manual de uso/instrucciones', 'En español', true, 13, 'TECNICO'),
('PROD_MEDICOS', 'Especificaciones técnicas', 'Ficha técnica del producto', true, 14, 'TECNICO'),
('PROD_MEDICOS', 'Análisis de riesgo', 'Según ISO 14971', true, 15, 'TECNICO'),
('PROD_MEDICOS', 'Validación de esterilización', 'Si aplica', false, 16, 'TECNICO'),
('PROD_MEDICOS', 'Biocompatibilidad', 'Ensayos según ISO 10993', false, 17, 'TECNICO'),
('PROD_MEDICOS', 'Proyecto de rótulo', 'Según Disp. ANMAT 2318/02', true, 18, 'TECNICO');

-- REQUISITOS PARA COSMÉTICOS
INSERT INTO anmat_requisitos_documentos (division_codigo, nombre, descripcion, es_obligatorio, orden, categoria) VALUES
('COSMETICOS', 'Poder o autorización del titular', 'Poder notarial o carta de autorización firmada', true, 1, 'LEGAL'),
('COSMETICOS', 'Contrato social o estatuto', 'Copia del contrato social vigente', true, 2, 'LEGAL'),
('COSMETICOS', 'Constancia de CUIT', 'Constancia de inscripción en AFIP', true, 3, 'LEGAL'),
('COSMETICOS', 'Habilitación de establecimiento', 'RNE cosmético vigente', true, 4, 'LEGAL'),
('COSMETICOS', 'Fórmula cuali-cuantitativa', 'Con INCI names', true, 10, 'TECNICO'),
('COSMETICOS', 'Especificaciones del producto', 'Físico-químicas y microbiológicas', true, 11, 'TECNICO'),
('COSMETICOS', 'Proyecto de rótulo', 'Según Res. GMC 36/04', true, 12, 'TECNICO'),
('COSMETICOS', 'Evaluación de seguridad', 'Para Grado 2', false, 13, 'TECNICO'),
('COSMETICOS', 'Ensayo de estabilidad', 'Preliminar o acelerado', true, 14, 'TECNICO'),
('COSMETICOS', 'Certificado de libre venta', 'Para importados', true, 20, 'LEGAL');

-- REQUISITOS PARA DOMISANITARIOS
INSERT INTO anmat_requisitos_documentos (division_codigo, nombre, descripcion, es_obligatorio, orden, categoria) VALUES
('USO_DOMESTICO', 'Poder o autorización del titular', 'Poder notarial o carta de autorización firmada', true, 1, 'LEGAL'),
('USO_DOMESTICO', 'Contrato social o estatuto', 'Copia del contrato social vigente', true, 2, 'LEGAL'),
('USO_DOMESTICO', 'Constancia de CUIT', 'Constancia de inscripción en AFIP', true, 3, 'LEGAL'),
('USO_DOMESTICO', 'Habilitación de establecimiento', 'Certificado de la autoridad sanitaria', true, 4, 'LEGAL'),
('USO_DOMESTICO', 'Fórmula cuali-cuantitativa', 'Composición del producto', true, 10, 'TECNICO'),
('USO_DOMESTICO', 'Especificaciones técnicas', 'Físico-químicas del producto', true, 11, 'TECNICO'),
('USO_DOMESTICO', 'Proyecto de rótulo', 'Con advertencias de seguridad', true, 12, 'TECNICO'),
('USO_DOMESTICO', 'Ensayos de eficacia', 'Para desinfectantes/insecticidas', false, 13, 'TECNICO'),
('USO_DOMESTICO', 'Hoja de seguridad (MSDS)', 'Ficha de datos de seguridad', true, 14, 'TECNICO'),
('USO_DOMESTICO', 'Certificado de libre venta', 'Para importados', true, 20, 'LEGAL');

-- REQUISITOS PARA SUPLEMENTOS DIETARIOS
INSERT INTO anmat_requisitos_documentos (division_codigo, nombre, descripcion, es_obligatorio, orden, categoria) VALUES
('SUPLEMENTOS', 'Poder o autorización del titular', 'Poder notarial o carta de autorización firmada', true, 1, 'LEGAL'),
('SUPLEMENTOS', 'Contrato social o estatuto', 'Copia del contrato social vigente', true, 2, 'LEGAL'),
('SUPLEMENTOS', 'Constancia de CUIT', 'Constancia de inscripción en AFIP', true, 3, 'LEGAL'),
('SUPLEMENTOS', 'RNE del elaborador', 'Registro Nacional de Establecimiento', true, 4, 'LEGAL'),
('SUPLEMENTOS', 'Fórmula cuali-cuantitativa', 'Con ingredientes y dosis por porción', true, 10, 'TECNICO'),
('SUPLEMENTOS', 'Proyecto de rótulo', 'Con información nutricional', true, 11, 'TECNICO'),
('SUPLEMENTOS', 'Especificaciones de materias primas', 'Certificados de los ingredientes activos', true, 12, 'TECNICO'),
('SUPLEMENTOS', 'Análisis del producto terminado', 'Microbiológico y de identidad', true, 13, 'TECNICO'),
('SUPLEMENTOS', 'Bibliografía de seguridad', 'De ingredientes no tradicionales', false, 14, 'TECNICO'),
('SUPLEMENTOS', 'Certificado de libre venta', 'Para importados', true, 20, 'LEGAL');

-- REQUISITOS PARA REACTIVOS DE DIAGNÓSTICO
INSERT INTO anmat_requisitos_documentos (division_codigo, nombre, descripcion, es_obligatorio, orden, categoria) VALUES
('REACTIVOS', 'Poder o autorización del titular', 'Poder notarial o carta de autorización firmada', true, 1, 'LEGAL'),
('REACTIVOS', 'Habilitación de la empresa', 'Como importador de reactivos', true, 2, 'LEGAL'),
('REACTIVOS', 'Director técnico', 'Bioquímico con matrícula', true, 3, 'LEGAL'),
('REACTIVOS', 'Certificado de libre venta', 'Del país de origen', true, 10, 'LEGAL'),
('REACTIVOS', 'Inserto/prospecto', 'Instrucciones de uso en español', true, 11, 'TECNICO'),
('REACTIVOS', 'Especificaciones técnicas', 'Sensibilidad, especificidad, etc.', true, 12, 'TECNICO'),
('REACTIVOS', 'Estudios de validación', 'Del fabricante', true, 13, 'TECNICO'),
('REACTIVOS', 'Certificado ISO 13485', 'Del fabricante', false, 14, 'TECNICO'),
('REACTIVOS', 'Proyecto de rótulo', 'Según normativa', true, 15, 'TECNICO');

-- RLS
ALTER TABLE anmat_requisitos_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read" ON anmat_requisitos_documentos FOR SELECT TO authenticated USING (true);

-- Tabla para tracking de documentos recibidos por caso
CREATE TABLE IF NOT EXISTS anmat_caso_documentos_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES anmat_casos(id) ON DELETE CASCADE,
  requisito_id UUID NOT NULL REFERENCES anmat_requisitos_documentos(id),
  estado VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, RECIBIDO, APROBADO, RECHAZADO, NO_APLICA
  documento_id UUID REFERENCES anmat_documentos(id),
  notas TEXT,
  fecha_recepcion DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES usuarios(id),
  UNIQUE(caso_id, requisito_id)
);

CREATE INDEX idx_caso_docs_checklist_caso ON anmat_caso_documentos_checklist(caso_id);

ALTER TABLE anmat_caso_documentos_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_read" ON anmat_caso_documentos_checklist FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON anmat_caso_documentos_checklist FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON anmat_caso_documentos_checklist FOR UPDATE TO authenticated USING (true);
