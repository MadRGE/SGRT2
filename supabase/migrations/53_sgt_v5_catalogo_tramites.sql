-- SGT v5: Catálogo de tipos de trámites + honorarios de gestión
-- Ejecutar en Supabase SQL Editor (después de la migración 52)

-- Catálogo maestro de tipos de trámites por organismo
create table if not exists tramite_tipos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  organismo text not null,
  categoria text,
  subcategoria text,
  plataforma text, -- TAD, TADO, VUCE, SIGSA
  plazo_dias integer,
  costo_organismo numeric(12,2) default 0, -- tasa oficial del organismo
  honorarios numeric(12,2) default 0, -- tu fee de gestión
  documentacion_obligatoria text[], -- array de docs requeridos
  observaciones text,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Agregar tramite_tipo_id a tramites
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='tramites' and column_name='tramite_tipo_id') then
    alter table tramites add column tramite_tipo_id uuid references tramite_tipos(id) on delete set null;
  end if;
end $$;

-- Indexes
create index if not exists idx_tramite_tipos_organismo on tramite_tipos(organismo);
create index if not exists idx_tramite_tipos_codigo on tramite_tipos(codigo);
create index if not exists idx_tramite_tipos_activo on tramite_tipos(activo);
create index if not exists idx_tramites_tipo on tramites(tramite_tipo_id);

-- RLS
alter table tramite_tipos enable row level security;
create policy "Allow all for authenticated" on tramite_tipos for all using (auth.role() = 'authenticated');

-- =============================================
-- SEED DATA: Catálogo de trámites por organismo
-- =============================================

-- INAL - Instituto Nacional de Alimentos
insert into tramite_tipos (codigo, nombre, organismo, categoria, subcategoria, plataforma, plazo_dias, costo_organismo, honorarios, documentacion_obligatoria) values
('INAL-001', 'Inscripción RNE Importador/Exportador', 'INAL', 'RNE', 'Inscripción', 'TADO', 120, 40000, 0, ARRAY['Habilitación municipal', 'Plano', 'POE', 'Título DT']),
('INAL-002', 'Reinscripción RNE', 'INAL', 'RNE', 'Reinscripción', 'TADO', 60, 20000, 0, ARRAY['RNE vigente', 'Habilitación municipal', 'Constancia CUIT']),
('INAL-003', 'Modificación General RNE', 'INAL', 'RNE', 'Modificación', 'TADO', 60, 12000, 0, ARRAY['Nota cambio', 'Docs respaldatorios']),
('INAL-004', 'Designación Director Técnico', 'INAL', 'RNE', 'Personal', 'TADO', 30, 8000, 0, ARRAY['Nota', 'DNI/título/matrícula', 'CV', 'DDJJ']),
('INAL-005', 'Ampliación Rubro RNE', 'INAL', 'RNE', 'Ampliación', 'TADO', 60, 15000, 0, ARRAY['Nota rubros nuevos', 'POE ampliado']),
('INAL-006', 'Inscripción RNPA (alimentos, suplementos, APM)', 'INAL', 'RNPA', 'Inscripción', 'TADO', 90, 0, 0, ARRAY['Ficha técnica', 'Análisis bromatológico', 'Rótulo español', 'CFS origen', 'RNE', 'DDJJ DT']),
('INAL-007', 'Inscripción RNPA Suplemento Dietario', 'INAL', 'RNPA', 'Inscripción', 'TADO', 150, 50000, 0, ARRAY['Ficha técnica', 'Análisis', 'Rótulo', 'Certificado libre venta origen']),
('INAL-008', 'Modificación RNPA (rótulo/fórmula)', 'INAL', 'RNPA', 'Modificación', 'TADO', 60, 12000, 0, ARRAY['Nuevo rótulo', 'Nueva ficha técnica']),
('INAL-009', 'Autorización/Transferencia Envases', 'INAL', 'Envases', 'Autorización', 'TADO', 90, 35000, 0, ARRAY['Ficha material', 'Ensayo migración']),
('INAL-010', 'Autorización Importación Temporal', 'INAL', 'Importación', 'Temporal', 'TADO', 30, 10000, 0, ARRAY['Nota finalidad', 'Compromiso reexport']),
('INAL-011', 'Incorporación/Modificación Depósito', 'INAL', 'RNE', 'Depósito', 'TADO', 60, 20000, 0, ARRAY['Habilitación municipal nuevo']),

-- ANMAT - Productos Médicos
('ANMAT-PM-001', 'Inscripción Legajo Empresa PM', 'ANMAT', 'Productos Médicos', 'Legajo', 'TAD', 90, 50000, 0, ARRAY['Estatuto', 'Poder', 'CUIT', 'Director Técnico', 'Habilitación']),
('ANMAT-PM-002', 'Registro PM Clase I', 'ANMAT', 'Productos Médicos', 'Registro', 'TAD', 60, 30000, 0, ARRAY['Legajo vigente', 'Ficha técnica', 'Manual uso', 'Certificado origen']),
('ANMAT-PM-003', 'Registro PM Clase II', 'ANMAT', 'Productos Médicos', 'Registro', 'TAD', 120, 60000, 0, ARRAY['Legajo vigente', 'Ficha técnica', 'Ensayos', 'CE/FDA', 'Manual uso']),
('ANMAT-PM-004', 'Registro PM Clase III', 'ANMAT', 'Productos Médicos', 'Registro', 'TAD', 180, 100000, 0, ARRAY['Legajo vigente', 'Dossier técnico', 'Estudios clínicos', 'CE/FDA']),
('ANMAT-PM-005', 'Registro PM Clase IV', 'ANMAT', 'Productos Médicos', 'Registro', 'TAD', 240, 150000, 0, ARRAY['Legajo vigente', 'Dossier completo', 'Estudios clínicos', 'Certificación internacional']),
('ANMAT-PM-006', 'Modificación Registro PM', 'ANMAT', 'Productos Médicos', 'Modificación', 'TAD', 90, 40000, 0, ARRAY['Registro vigente', 'Documentación cambio']),
('ANMAT-PM-007', 'Renovación Registro PM', 'ANMAT', 'Productos Médicos', 'Renovación', 'TAD', 120, 50000, 0, ARRAY['Registro vigente', 'Certificado vigencia fabricante']),

-- ANMAT - Cosméticos
('ANMAT-COS-001', 'Inscripción Legajo Cosméticos', 'ANMAT', 'Cosméticos', 'Legajo', 'TAD', 60, 35000, 0, ARRAY['Estatuto', 'CUIT', 'Director Técnico', 'Habilitación']),
('ANMAT-COS-002', 'Notificación Producto Grado 1', 'ANMAT', 'Cosméticos', 'Notificación', 'TAD', 30, 15000, 0, ARRAY['Legajo vigente', 'Fórmula', 'Rótulo', 'Certificado origen']),
('ANMAT-COS-003', 'Registro Producto Grado 2', 'ANMAT', 'Cosméticos', 'Registro', 'TAD', 90, 45000, 0, ARRAY['Legajo vigente', 'Fórmula', 'Ensayos seguridad', 'Rótulo', 'Certificado origen']),
('ANMAT-COS-004', 'Modificación Registro Cosmético', 'ANMAT', 'Cosméticos', 'Modificación', 'TAD', 60, 25000, 0, ARRAY['Registro vigente', 'Documentación cambio']),

-- ANMAT - Domisanitarios
('ANMAT-DOM-001', 'Inscripción Legajo Domisanitarios', 'ANMAT', 'Domisanitarios', 'Legajo', 'TAD', 60, 35000, 0, ARRAY['Estatuto', 'CUIT', 'Director Técnico', 'Habilitación']),
('ANMAT-DOM-002', 'Notificación Producto Riesgo I', 'ANMAT', 'Domisanitarios', 'Notificación', 'TAD', 30, 20000, 0, ARRAY['Legajo vigente', 'Fórmula', 'Ficha seguridad']),
('ANMAT-DOM-003', 'Registro Producto Riesgo IIA', 'ANMAT', 'Domisanitarios', 'Registro', 'TAD', 90, 50000, 0, ARRAY['Legajo vigente', 'Fórmula', 'Ensayos eficacia', 'Ficha seguridad']),
('ANMAT-DOM-004', 'Registro Producto Riesgo IIB', 'ANMAT', 'Domisanitarios', 'Registro', 'TAD', 120, 60000, 0, ARRAY['Legajo vigente', 'Fórmula', 'Ensayos eficacia', 'Toxicología', 'Ficha seguridad']),

-- SENASA
('SENASA-001', 'Autorización Importación Alimentos (Food)', 'SENASA', 'Food', 'Importación', 'VUCE', 30, 15000, 0, ARRAY['Certificado sanitario origen', 'Factura', 'Packing list', 'Permiso fitosanitario']),
('SENASA-002', 'Autorización Importación Feed', 'SENASA', 'Feed', 'Importación', 'VUCE', 30, 15000, 0, ARRAY['Certificado sanitario origen', 'Composición', 'Análisis']),
('SENASA-003', 'Inscripción Establecimiento SENASA', 'SENASA', 'Establecimiento', 'Inscripción', 'SIGSA', 120, 40000, 0, ARRAY['Habilitación', 'Plano', 'POE', 'Director Técnico']),
('SENASA-004', 'Registro Producto Veterinario (RPV)', 'SENASA', 'RPV', 'Registro', 'TAD', 180, 80000, 0, ARRAY['Fórmula', 'Ensayos', 'GMP', 'Certificado libre venta']),
('SENASA-005', 'Inscripción RENSPA', 'SENASA', 'RENSPA', 'Inscripción', 'SIGSA', 60, 0, 0, ARRAY['Documentación productiva', 'Ubicación']),
('SENASA-006', 'Registro Fertilizante/Enmienda', 'SENASA', 'Fertilizantes', 'Registro', 'TAD', 90, 30000, 0, ARRAY['Composición', 'Análisis', 'Rótulo']),
('SENASA-007', 'Certificado Exportación Productos Origen Animal', 'SENASA', 'Exportación', 'Certificación', 'SIGSA', 15, 5000, 0, ARRAY['Habilitación establecimiento', 'Documentación sanitaria']),

-- INTI
('INTI-001', 'Verificación Metrología Legal', 'INTI', 'Metrología', 'Verificación', 'TAD', 30, 50000, 0, ARRAY['Instrumento', 'Documentación técnica']),
('INTI-002', 'Aprobación de Modelo', 'INTI', 'Metrología', 'Aprobación', 'TAD', 90, 150000, 0, ARRAY['Documentación técnica', 'Muestras', 'Certificados origen']),
('INTI-003', 'Certificación Producto RT', 'INTI', 'Certificación', 'Reglamento Técnico', 'TAD', 60, 80000, 0, ARRAY['Informe ensayo', 'Documentación técnica', 'Certificados origen']),
('INTI-004', 'Ensayo de Laboratorio', 'INTI', 'Ensayos', 'Laboratorio', 'TAD', 30, 100000, 0, ARRAY['Muestras', 'Protocolo ensayo']),

-- SEDRONAR / RENPRE
('RENPRE-001', 'Inscripción RENPRE', 'SEDRONAR', 'RENPRE', 'Inscripción', 'TAD', 60, 10000, 0, ARRAY['Estatuto', 'CUIT', 'Responsable técnico', 'Listado sustancias']),
('RENPRE-002', 'Autorización Importación Precursores', 'SEDRONAR', 'RENPRE', 'Autorización', 'TAD', 30, 8000, 0, ARRAY['Inscripción vigente', 'Factura proforma', 'Certificado origen']),
('RENPRE-003', 'Formulario F01 Compraventa', 'SEDRONAR', 'RENPRE', 'Formulario', 'TAD', 15, 2000, 0, ARRAY['Inscripción vigente', 'Datos operación']),
('RENPRE-004', 'Informe Semestral RENPRE', 'SEDRONAR', 'RENPRE', 'Informe', 'TAD', 15, 0, 0, ARRAY['Inscripción vigente', 'Libro de registro']),

-- CITES / Fauna
('CITES-001', 'Certificado CITES Importación', 'CITES', 'CITES', 'Importación', 'TAD', 30, 5000, 0, ARRAY['Permiso CITES exportador', 'Factura', 'Datos especie']),
('CITES-002', 'Certificado CITES Exportación', 'CITES', 'CITES', 'Exportación', 'TAD', 30, 5000, 0, ARRAY['Guía de tránsito', 'Datos especie', 'Factura']),
('CITES-003', 'Inscripción RUOFS', 'CITES', 'RUOFS', 'Inscripción', 'TAD', 45, 8000, 0, ARRAY['Documentación empresa', 'Listado especies']),

-- INASE
('INASE-001', 'Inscripción RNCyFS', 'INASE', 'Semillas', 'Inscripción', 'TAD', 60, 50000, 0, ARRAY['Documentación empresa', 'Infraestructura']),
('INASE-002', 'Registro de Cultivar', 'INASE', 'Cultivares', 'Registro', 'TAD', 180, 200000, 0, ARRAY['Descripción varietal', 'Ensayos DHE', 'Origen genético']),
('INASE-003', 'Importación Material de Propagación', 'INASE', 'Semillas', 'Importación', 'TAD', 30, 15000, 0, ARRAY['Certificado fitosanitario', 'Certificado calidad']),

-- SIC - Industria y Comercio
('SIC-001', 'Certificación Reglamento Técnico', 'SIC', 'Seguridad', 'Certificación', 'TAD', 60, 30000, 0, ARRAY['Informe ensayo acreditado', 'Documentación técnica']),
('SIC-002', 'LCM Vehículos/Autopartes', 'SIC', 'Vehículos', 'Licencia', 'TAD', 90, 80000, 0, ARRAY['Homologación internacional', 'Ensayos', 'Ficha técnica']),
('SIC-003', 'Eficiencia Energética - Etiquetado', 'SIC', 'Eficiencia', 'Etiquetado', 'TAD', 45, 25000, 0, ARRAY['Ensayo eficiencia', 'Ficha producto'])

on conflict (codigo) do nothing;
