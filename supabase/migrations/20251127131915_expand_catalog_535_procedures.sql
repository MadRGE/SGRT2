/*
  # Expansión del Catálogo a 535 Trámites - Fase 1: Nuevos Campos

  ## Resumen
  Primera fase: Agregar nuevos campos a tramite_tipos y actualizar trámites existentes

  ## Nuevos Campos
  - codigo_oficial - Código oficial del trámite
  - plataforma_gestion - Plataforma de gestión
  - subcategoria - Subcategoría del trámite
  - costo_base_2025 - Costo actualizado Nov 2025
  - documentacion_obligatoria - Documentos requeridos
  - prioridad - Nivel de prioridad

  ## Security
  - Mantiene todas las políticas RLS existentes
*/

-- Agregar nuevos campos
ALTER TABLE tramite_tipos ADD COLUMN IF NOT EXISTS codigo_oficial varchar(20);
ALTER TABLE tramite_tipos ADD COLUMN IF NOT EXISTS plataforma_gestion varchar(50);
ALTER TABLE tramite_tipos ADD COLUMN IF NOT EXISTS subcategoria varchar(100);
ALTER TABLE tramite_tipos ADD COLUMN IF NOT EXISTS costo_base_2025 decimal(12,2);
ALTER TABLE tramite_tipos ADD COLUMN IF NOT EXISTS documentacion_obligatoria text[] DEFAULT ARRAY[]::text[];
ALTER TABLE tramite_tipos ADD COLUMN IF NOT EXISTS prioridad varchar(20) DEFAULT 'media' CHECK (prioridad IN ('alta', 'media', 'baja'));

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_tramite_tipos_codigo_oficial ON tramite_tipos(codigo_oficial);
CREATE INDEX IF NOT EXISTS idx_tramite_tipos_prioridad ON tramite_tipos(prioridad);

-- Actualizar trámites existentes con nueva información
UPDATE tramite_tipos SET
  codigo_oficial = '4047',
  plataforma_gestion = 'TADO',
  subcategoria = 'Inscripción',
  costo_base_2025 = 40000,
  prioridad = 'alta',
  documentacion_obligatoria = ARRAY['Habilitación municipal', 'Plano', 'POE', 'Título DT']
WHERE id = 'TT-INAL-001';

UPDATE tramite_tipos SET
  codigo_oficial = '4045',
  plataforma_gestion = 'TADO',
  subcategoria = 'Producto',
  costo_base_2025 = 32000,
  prioridad = 'alta',
  documentacion_obligatoria = ARRAY['Ficha técnica', 'Análisis bromatológico', 'Rótulo español', 'CFS origen', 'RNE']
WHERE id = 'TT-INAL-002';

UPDATE tramite_tipos SET
  codigo_oficial = '4069',
  plataforma_gestion = 'TADO',
  subcategoria = 'Simplificado',
  costo_base_2025 = 20000,
  prioridad = 'alta',
  documentacion_obligatoria = ARRAY['DDJJ equivalencia', 'CFS país Anexo III', 'Ficha técnica']
WHERE id = 'TT-INAL-003';

UPDATE tramite_tipos SET
  codigo_oficial = '4053',
  plataforma_gestion = 'TADO',
  subcategoria = 'Autorización',
  costo_base_2025 = 35000,
  prioridad = 'alta',
  documentacion_obligatoria = ARRAY['Ficha material', 'Ensayo migración']
WHERE id = 'TT-INAL-005';

UPDATE tramite_tipos SET
  codigo_oficial = '2318',
  plataforma_gestion = 'TAD/Gemha',
  subcategoria = 'Registro Clase I',
  costo_base_2025 = 45000,
  prioridad = 'alta',
  documentacion_obligatoria = ARRAY['Formulario APM', 'CFS/CE/FDA', 'Ficha técnica', 'Manual español']
WHERE id = 'TT-PM-001';

UPDATE tramite_tipos SET
  codigo_oficial = '2319',
  plataforma_gestion = 'TAD',
  subcategoria = 'Registro Clase IIa',
  costo_base_2025 = 75000,
  prioridad = 'alta',
  documentacion_obligatoria = ARRAY['Formulario PM', 'CFS/CE', 'ISO 13485', 'Biocompatibilidad']
WHERE id = 'TT-PM-002';

UPDATE tramite_tipos SET
  codigo_oficial = '2319B',
  plataforma_gestion = 'TAD',
  subcategoria = 'Registro Clase IIb',
  costo_base_2025 = 120000,
  prioridad = 'alta',
  documentacion_obligatoria = ARRAY['Formulario PM', 'ISO 13485', 'ISO 14971']
WHERE id = 'TT-PM-003';

UPDATE tramite_tipos SET
  codigo_oficial = '2320B',
  plataforma_gestion = 'TAD',
  subcategoria = 'Registro Clase IV',
  costo_base_2025 = 220000,
  prioridad = 'alta',
  documentacion_obligatoria = ARRAY['Formulario PM', 'CE/FDA PMA', 'Estudios clínicos']
WHERE id = 'TT-PM-004';

UPDATE tramite_tipos SET
  codigo_oficial = '5100',
  plataforma_gestion = 'TAD',
  subcategoria = 'Notificación Grado 1',
  costo_base_2025 = 28000,
  prioridad = 'alta',
  documentacion_obligatoria = ARRAY['Formulario cosmético', 'Lista INCI', 'Rótulo', 'FISPQ']
WHERE id = 'TT-COSM-001';

UPDATE tramite_tipos SET
  codigo_oficial = '3000',
  plataforma_gestion = 'SIGSA/VUCE',
  subcategoria = 'Importación Food',
  costo_base_2025 = 15000,
  prioridad = 'alta',
  documentacion_obligatoria = ARRAY['Factura', 'CSI origen', 'RENSPA']
WHERE id = 'TT-SENASA-001';

UPDATE tramite_tipos SET
  codigo_oficial = 'CITES-01',
  plataforma_gestion = 'Portal Fauna',
  subcategoria = 'Certificado Importación',
  costo_base_2025 = 10000,
  prioridad = 'media',
  documentacion_obligatoria = ARRAY['Formulario CITES', 'Permiso exportación origen']
WHERE id = 'TT-FAUNA-001';

UPDATE tramite_tipos SET
  codigo_oficial = 'CITES-04',
  plataforma_gestion = 'Portal Fauna',
  subcategoria = 'Certificado Exportación',
  costo_base_2025 = 8000,
  prioridad = 'media',
  documentacion_obligatoria = ARRAY['Formulario CITES', 'CITES destino']
WHERE id = 'TT-FAUNA-002';

UPDATE tramite_tipos SET
  codigo_oficial = 'F01',
  plataforma_gestion = 'TAD/RENPRE',
  subcategoria = 'Inscripción',
  costo_base_2025 = 25000,
  prioridad = 'alta',
  documentacion_obligatoria = ARRAY['F01 certificado', 'DNI/CUIT', 'DDJJ usos']
WHERE id = 'TT-RENPRE-001';

UPDATE tramite_tipos SET
  codigo_oficial = 'F03',
  plataforma_gestion = 'VUCEA/TAD',
  subcategoria = 'Autorización Import',
  costo_base_2025 = 250000,
  prioridad = 'alta',
  documentacion_obligatoria = ARRAY['F03', 'CSI', 'MSDS', 'DDJJ destino']
WHERE id = 'TT-RENPRE-003';
