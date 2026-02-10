-- FIX v2: Forzar carga del catálogo de tramite_tipos
-- Primero asegurar que la tabla tenga el constraint UNIQUE en codigo
-- Luego borrar e insertar todo de cero

-- 1. Asegurar constraint UNIQUE en codigo
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tramite_tipos_codigo_key'
    AND conrelid = 'tramite_tipos'::regclass
  ) THEN
    ALTER TABLE tramite_tipos ADD CONSTRAINT tramite_tipos_codigo_key UNIQUE (codigo);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. Borrar datos existentes (si los hay)
DELETE FROM tramite_tipos;

-- 3. Insertar catálogo completo con documentación detallada
INSERT INTO tramite_tipos (codigo, nombre, organismo, categoria, subcategoria, plataforma, plazo_dias, costo_organismo, honorarios, documentacion_obligatoria, activo) VALUES
-- INAL (11 tipos)
('INAL-001', 'Inscripción RNE Importador/Exportador', 'INAL', 'RNE', 'Inscripción', 'TADO', 120, 40000, 0, ARRAY['Formulario de Solicitud RNE','Habilitacion municipal/provincial','Plano del establecimiento','Manual de BPM','Plan HACCP'], true),
('INAL-002', 'Reinscripción RNE', 'INAL', 'RNE', 'Reinscripción', 'TADO', 60, 20000, 0, ARRAY['Formulario de Reinscripcion','Certificado vigente','CFS actualizado','Declaracion de cambios'], true),
('INAL-003', 'Modificación General RNE', 'INAL', 'RNE', 'Modificación', 'TADO', 60, 12000, 0, ARRAY['Formulario de Modificacion','Certificado vigente a modificar','Justificacion del cambio','Documentacion de soporte'], true),
('INAL-004', 'Designación Director Técnico', 'INAL', 'RNE', 'Personal', 'TADO', 30, 8000, 0, ARRAY['Nota de designacion','DNI del Director Tecnico','Titulo profesional','Matricula habilitante','DDJJ de incompatibilidad'], true),
('INAL-005', 'Ampliación Rubro RNE', 'INAL', 'RNE', 'Ampliación', 'TADO', 60, 15000, 0, ARRAY['Formulario de Solicitud RNE','Nota de rubros nuevos','POE ampliado','Habilitacion municipal actualizada','Manual de BPM actualizado'], true),
('INAL-006', 'Inscripción RNPA (alimentos, suplementos, APM)', 'INAL', 'RNPA', 'Inscripción', 'TADO', 90, 0, 0, ARRAY['Formulario de Solicitud INAL','Certificado de Libre Venta (CFS)','Analisis Bromatologico','Ficha Tecnica del producto','Rotulo nutricional propuesto','Habilitacion RNE vigente'], true),
('INAL-007', 'Inscripción RNPA Suplemento Dietario', 'INAL', 'RNPA', 'Inscripción', 'TADO', 150, 50000, 0, ARRAY['Formulario de Solicitud','Formula cualicuantitativa','Analisis de producto terminado','Estudios de estabilidad','GMP del fabricante','Rotulo propuesto'], true),
('INAL-008', 'Modificación RNPA (rótulo/fórmula)', 'INAL', 'RNPA', 'Modificación', 'TADO', 60, 12000, 0, ARRAY['Formulario de Modificacion','Certificado vigente a modificar','Nuevo rotulo propuesto','Nueva ficha tecnica','Justificacion del cambio'], true),
('INAL-009', 'Autorización/Transferencia Envases', 'INAL', 'Envases', 'Autorización', 'TADO', 90, 35000, 0, ARRAY['Formulario de Solicitud','Ficha tecnica del material','Ensayo de migracion','Certificado de aptitud alimentaria','Declaracion de composicion'], true),
('INAL-010', 'Autorización Importación Temporal', 'INAL', 'Importación', 'Temporal', 'TADO', 30, 10000, 0, ARRAY['Nota de solicitud con finalidad','Compromiso de reexportacion','Factura proforma','Certificado sanitario de origen'], true),
('INAL-011', 'Incorporación/Modificación Depósito', 'INAL', 'RNE', 'Depósito', 'TADO', 60, 20000, 0, ARRAY['Formulario de Solicitud','Habilitacion municipal del nuevo deposito','Plano del establecimiento','Contrato de alquiler o titulo de propiedad'], true),

-- ANMAT - Productos Médicos (7 tipos)
('ANMAT-PM-001', 'Inscripción Legajo Empresa PM', 'ANMAT', 'Productos Médicos', 'Legajo', 'TAD', 90, 50000, 0, ARRAY['Estatuto social','Poder del representante legal','Constancia de CUIT','DNI y titulo del Director Tecnico','Habilitacion del establecimiento','Certificado de domicilio'], true),
('ANMAT-PM-002', 'Registro PM Clase I', 'ANMAT', 'Productos Médicos', 'Registro', 'TAD', 60, 30000, 0, ARRAY['Formulario de Solicitud ANMAT','Certificado de Libre Venta (CFS)','Manual de Usuario en espanol','Rotulo propuesto','Declaracion Jurada de Fabricante','Poder del Importador'], true),
('ANMAT-PM-003', 'Registro PM Clase II', 'ANMAT', 'Productos Médicos', 'Registro', 'TAD', 120, 60000, 0, ARRAY['Formulario de Solicitud ANMAT','Certificado de Libre Venta (CFS)','Certificado ISO 13485','Manual de Usuario en espanol','Instrucciones de Uso (IFU)','Analisis de Riesgos','Ficha Tecnica'], true),
('ANMAT-PM-004', 'Registro PM Clase III', 'ANMAT', 'Productos Médicos', 'Registro', 'TAD', 180, 100000, 0, ARRAY['Formulario de Solicitud ANMAT','Certificado de Libre Venta (CFS)','Certificado ISO 13485','Certificado CE/FDA','Estudios Clinicos','Biocompatibilidad ISO 10993','Analisis de Riesgos ISO 14971'], true),
('ANMAT-PM-005', 'Registro PM Clase IV', 'ANMAT', 'Productos Médicos', 'Registro', 'TAD', 240, 150000, 0, ARRAY['Formulario de Solicitud ANMAT','Certificado de Libre Venta (CFS)','Certificado ISO 13485','Certificado CE/FDA','Estudios Clinicos','Biocompatibilidad ISO 10993','Analisis de Riesgos ISO 14971','Dossier tecnico completo'], true),
('ANMAT-PM-006', 'Modificación Registro PM', 'ANMAT', 'Productos Médicos', 'Modificación', 'TAD', 90, 40000, 0, ARRAY['Formulario de Modificacion','Certificado vigente a modificar','Justificacion del cambio','Documentacion de soporte'], true),
('ANMAT-PM-007', 'Renovación Registro PM', 'ANMAT', 'Productos Médicos', 'Renovación', 'TAD', 120, 50000, 0, ARRAY['Formulario de Reinscripcion','Certificado vigente','CFS actualizado','Declaracion de cambios','Certificado de vigencia del fabricante'], true),

-- ANMAT - Cosméticos (4 tipos)
('ANMAT-COS-001', 'Inscripción Legajo Cosméticos', 'ANMAT', 'Cosméticos', 'Legajo', 'TAD', 60, 35000, 0, ARRAY['Estatuto social','Constancia de CUIT','DNI y titulo del Director Tecnico','Habilitacion del establecimiento','Certificado de domicilio'], true),
('ANMAT-COS-002', 'Notificación Producto Grado 1', 'ANMAT', 'Cosméticos', 'Notificación', 'TAD', 30, 15000, 0, ARRAY['Formulario de Solicitud','Formula cualicuantitativa','Metodo de elaboracion','Especificaciones de producto terminado','Rotulo propuesto'], true),
('ANMAT-COS-003', 'Registro Producto Grado 2', 'ANMAT', 'Cosméticos', 'Registro', 'TAD', 90, 45000, 0, ARRAY['Formulario de Solicitud','Formula cualicuantitativa','Estudios de Eficacia','Estudios de Seguridad','FPS si corresponde','Rotulo propuesto'], true),
('ANMAT-COS-004', 'Modificación Registro Cosmético', 'ANMAT', 'Cosméticos', 'Modificación', 'TAD', 60, 25000, 0, ARRAY['Formulario de Modificacion','Certificado vigente a modificar','Justificacion del cambio','Documentacion de soporte'], true),

-- ANMAT - Domisanitarios (4 tipos)
('ANMAT-DOM-001', 'Inscripción Legajo Domisanitarios', 'ANMAT', 'Domisanitarios', 'Legajo', 'TAD', 60, 35000, 0, ARRAY['Estatuto social','Constancia de CUIT','DNI y titulo del Director Tecnico','Habilitacion del establecimiento','Certificado de domicilio'], true),
('ANMAT-DOM-002', 'Notificación Producto Riesgo I', 'ANMAT', 'Domisanitarios', 'Notificación', 'TAD', 30, 20000, 0, ARRAY['Formulario de Solicitud','Formula cualicuantitativa','Especificaciones fisico-quimicas','Hoja de Seguridad (MSDS)','Rotulo propuesto'], true),
('ANMAT-DOM-003', 'Registro Producto Riesgo IIA', 'ANMAT', 'Domisanitarios', 'Registro', 'TAD', 90, 50000, 0, ARRAY['Formulario de Solicitud','Formula cualicuantitativa','Especificaciones fisico-quimicas','Hoja de Seguridad (MSDS)','Ensayos de eficacia','Rotulo propuesto'], true),
('ANMAT-DOM-004', 'Registro Producto Riesgo IIB', 'ANMAT', 'Domisanitarios', 'Registro', 'TAD', 120, 60000, 0, ARRAY['Formulario de Solicitud','Formula cualicuantitativa','Especificaciones fisico-quimicas','Hoja de Seguridad (MSDS)','Ensayos de eficacia','Estudio toxicologico','Rotulo propuesto'], true),

-- SENASA (7 tipos)
('SENASA-001', 'Autorización Importación Alimentos (Food)', 'SENASA', 'Food', 'Importación', 'VUCE', 30, 15000, 0, ARRAY['Formulario SENASA','Certificado Sanitario de origen','Habilitacion del establecimiento origen','Protocolo de analisis','Ficha tecnica','Rotulo propuesto'], true),
('SENASA-002', 'Autorización Importación Feed', 'SENASA', 'Feed', 'Importación', 'VUCE', 30, 15000, 0, ARRAY['Formulario SENASA','Certificado Sanitario de origen','Composicion del producto','Protocolo de analisis','Ficha tecnica'], true),
('SENASA-003', 'Inscripción Establecimiento SENASA', 'SENASA', 'Establecimiento', 'Inscripción', 'SIGSA', 120, 40000, 0, ARRAY['Formulario de Habilitacion','Estatuto social','CUIT/Constancia AFIP','Habilitacion municipal','Plano del establecimiento','Manual de BPM'], true),
('SENASA-004', 'Registro Producto Veterinario (RPV)', 'SENASA', 'RPV', 'Registro', 'TAD', 180, 80000, 0, ARRAY['Formulario SENASA','Certificado Sanitario de origen','Formula cualicuantitativa','Ensayos de eficacia y seguridad','GMP del fabricante','Certificado de Libre Venta','Rotulo propuesto'], true),
('SENASA-005', 'Inscripción RENSPA', 'SENASA', 'RENSPA', 'Inscripción', 'SIGSA', 60, 0, 0, ARRAY['Formulario de Habilitacion','Estatuto social','CUIT/Constancia AFIP','Documentacion productiva','Ubicacion georeferenciada'], true),
('SENASA-006', 'Registro Fertilizante/Enmienda', 'SENASA', 'Fertilizantes', 'Registro', 'TAD', 90, 30000, 0, ARRAY['Formulario SENASA','Composicion del producto','Protocolo de analisis','Rotulo propuesto','Certificado de origen'], true),
('SENASA-007', 'Certificado Exportación Productos Origen Animal', 'SENASA', 'Exportación', 'Certificación', 'SIGSA', 15, 5000, 0, ARRAY['Formulario SENASA','Habilitacion del establecimiento','Documentacion sanitaria','Factura de exportacion','Certificado de calidad'], true),

-- INTI (4 tipos)
('INTI-001', 'Verificación Metrología Legal', 'INTI', 'Metrología', 'Verificación', 'TAD', 30, 50000, 0, ARRAY['Solicitud de Certificacion','Especificaciones Tecnicas del instrumento','Muestras para ensayo','Documentacion tecnica del fabricante'], true),
('INTI-002', 'Aprobación de Modelo', 'INTI', 'Metrología', 'Aprobación', 'TAD', 90, 150000, 0, ARRAY['Solicitud de Certificacion','Especificaciones Tecnicas','Muestras para ensayo','Certificados de origen','Documentacion tecnica completa'], true),
('INTI-003', 'Certificación Producto RT', 'INTI', 'Certificación', 'Reglamento Técnico', 'TAD', 60, 80000, 0, ARRAY['Solicitud de Certificacion','Informe de ensayo acreditado','Especificaciones Tecnicas','Certificados de origen','Declaracion de conformidad'], true),
('INTI-004', 'Ensayo de Laboratorio', 'INTI', 'Ensayos', 'Laboratorio', 'TAD', 30, 100000, 0, ARRAY['Solicitud de Ensayo','Muestras para ensayo','Protocolo de ensayo requerido','Especificaciones Tecnicas'], true),

-- SEDRONAR / RENPRE (4 tipos)
('RENPRE-001', 'Inscripción RENPRE', 'SEDRONAR', 'RENPRE', 'Inscripción', 'TAD', 60, 10000, 0, ARRAY['Formulario de Inscripcion RENPRE','Estatuto social','DNI de representantes','Habilitacion municipal','Listado de sustancias a operar','Antecedentes penales de responsables'], true),
('RENPRE-002', 'Autorización Importación Precursores', 'SEDRONAR', 'RENPRE', 'Autorización', 'TAD', 30, 8000, 0, ARRAY['Solicitud de Autorizacion','Certificado RENPRE vigente','Factura Proforma','Certificado de uso final'], true),
('RENPRE-003', 'Formulario F01 Compraventa', 'SEDRONAR', 'RENPRE', 'Formulario', 'TAD', 15, 2000, 0, ARRAY['Solicitud de Autorizacion','Certificado RENPRE vigente','Factura Proforma','Datos de la operacion'], true),
('RENPRE-004', 'Informe Semestral RENPRE', 'SEDRONAR', 'RENPRE', 'Informe', 'TAD', 15, 0, 0, ARRAY['Certificado RENPRE vigente','Libro de registro actualizado','Detalle de movimientos del semestre'], true),

-- CITES (3 tipos)
('CITES-001', 'Certificado CITES Importación', 'CITES', 'CITES', 'Importación', 'TAD', 30, 5000, 0, ARRAY['Formulario de Solicitud CITES','Permiso CITES del pais origen/destino','Documentacion del origen legal','Fotos de los especimenes','Factura comercial'], true),
('CITES-002', 'Certificado CITES Exportación', 'CITES', 'CITES', 'Exportación', 'TAD', 30, 5000, 0, ARRAY['Formulario de Solicitud CITES','Guia de transito','Documentacion del origen legal','Fotos de los especimenes','Factura de exportacion'], true),
('CITES-003', 'Inscripción RUOFS', 'CITES', 'RUOFS', 'Inscripción', 'TAD', 45, 8000, 0, ARRAY['Formulario de Inscripcion RUOFS','Documentacion de la empresa','Listado de especies a operar','Habilitacion correspondiente'], true),

-- INASE (3 tipos)
('INASE-001', 'Inscripción RNCyFS', 'INASE', 'Semillas', 'Inscripción', 'TAD', 60, 50000, 0, ARRAY['Formulario de Inscripcion','Documentacion de la empresa','Descripcion de infraestructura','Director Tecnico habilitado'], true),
('INASE-002', 'Registro de Cultivar', 'INASE', 'Cultivares', 'Registro', 'TAD', 180, 200000, 0, ARRAY['Solicitud de Registro','Descripcion varietal completa','Ensayos DHE (Distincion, Homogeneidad, Estabilidad)','Documentacion de origen genetico','Muestra viva'], true),
('INASE-003', 'Importación Material de Propagación', 'INASE', 'Semillas', 'Importación', 'TAD', 30, 15000, 0, ARRAY['Solicitud de Permiso Fitosanitario','Certificado Fitosanitario de origen','Certificado de calidad de semillas','Factura Proforma'], true),

-- SIC (3 tipos)
('SIC-001', 'Certificación Reglamento Técnico', 'SIC', 'Seguridad', 'Certificación', 'TAD', 60, 30000, 0, ARRAY['Solicitud de Certificacion','Informe de Ensayos IRAM/acreditado','Documentacion tecnica del producto','Especificaciones Tecnicas','Declaracion de conformidad'], true),
('SIC-002', 'LCM Vehículos/Autopartes', 'SIC', 'Vehículos', 'Licencia', 'TAD', 90, 80000, 0, ARRAY['Formulario SIMI','Homologacion internacional','Informe de ensayos','Ficha tecnica del vehiculo','Factura Proforma'], true),
('SIC-003', 'Eficiencia Energética - Etiquetado', 'SIC', 'Eficiencia', 'Etiquetado', 'TAD', 45, 25000, 0, ARRAY['Solicitud de Certificacion','Ensayo de eficiencia energetica','Ficha tecnica del producto','Especificaciones Tecnicas','Etiqueta propuesta'], true);

-- Verificación
SELECT organismo, count(*) as tipos FROM tramite_tipos GROUP BY organismo ORDER BY organismo;
