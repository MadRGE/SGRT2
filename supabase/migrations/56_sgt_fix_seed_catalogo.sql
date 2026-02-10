-- FIX: Re-insertar seed del catálogo de tramite_tipos
-- Los INSERT originales de la migración 53 no se ejecutaron por error de policy duplicada
-- Ejecutar en Supabase SQL Editor

INSERT INTO tramite_tipos (codigo, nombre, organismo, categoria, subcategoria, plataforma, plazo_dias, costo_organismo, honorarios, documentacion_obligatoria) VALUES
-- INAL
('INAL-001', 'Inscripción RNE Importador/Exportador', 'INAL', 'RNE', 'Inscripción', 'TADO', 120, 40000, 0, ARRAY['Formulario de Solicitud RNE','Habilitacion municipal/provincial','Plano del establecimiento','Manual de BPM','Plan HACCP']),
('INAL-002', 'Reinscripción RNE', 'INAL', 'RNE', 'Reinscripción', 'TADO', 60, 20000, 0, ARRAY['Formulario de Reinscripcion','Certificado vigente','CFS actualizado','Declaracion de cambios']),
('INAL-003', 'Modificación General RNE', 'INAL', 'RNE', 'Modificación', 'TADO', 60, 12000, 0, ARRAY['Formulario de Modificacion','Certificado vigente a modificar','Justificacion del cambio','Documentacion de soporte']),
('INAL-004', 'Designación Director Técnico', 'INAL', 'RNE', 'Personal', 'TADO', 30, 8000, 0, ARRAY['Nota de designacion','DNI del Director Tecnico','Titulo profesional','Matricula habilitante','DDJJ de incompatibilidad']),
('INAL-005', 'Ampliación Rubro RNE', 'INAL', 'RNE', 'Ampliación', 'TADO', 60, 15000, 0, ARRAY['Formulario de Solicitud RNE','Nota de rubros nuevos','POE ampliado','Habilitacion municipal actualizada','Manual de BPM actualizado']),
('INAL-006', 'Inscripción RNPA (alimentos, suplementos, APM)', 'INAL', 'RNPA', 'Inscripción', 'TADO', 90, 0, 0, ARRAY['Formulario de Solicitud INAL','Certificado de Libre Venta (CFS)','Analisis Bromatologico','Ficha Tecnica del producto','Rotulo nutricional propuesto','Habilitacion RNE vigente']),
('INAL-007', 'Inscripción RNPA Suplemento Dietario', 'INAL', 'RNPA', 'Inscripción', 'TADO', 150, 50000, 0, ARRAY['Formulario de Solicitud','Formula cualicuantitativa','Analisis de producto terminado','Estudios de estabilidad','GMP del fabricante','Rotulo propuesto']),
('INAL-008', 'Modificación RNPA (rótulo/fórmula)', 'INAL', 'RNPA', 'Modificación', 'TADO', 60, 12000, 0, ARRAY['Formulario de Modificacion','Certificado vigente a modificar','Nuevo rotulo propuesto','Nueva ficha tecnica','Justificacion del cambio']),
('INAL-009', 'Autorización/Transferencia Envases', 'INAL', 'Envases', 'Autorización', 'TADO', 90, 35000, 0, ARRAY['Formulario de Solicitud','Ficha tecnica del material','Ensayo de migracion','Certificado de aptitud alimentaria','Declaracion de composicion']),
('INAL-010', 'Autorización Importación Temporal', 'INAL', 'Importación', 'Temporal', 'TADO', 30, 10000, 0, ARRAY['Nota de solicitud con finalidad','Compromiso de reexportacion','Factura proforma','Certificado sanitario de origen']),
('INAL-011', 'Incorporación/Modificación Depósito', 'INAL', 'RNE', 'Depósito', 'TADO', 60, 20000, 0, ARRAY['Formulario de Solicitud','Habilitacion municipal del nuevo deposito','Plano del establecimiento','Contrato de alquiler o titulo de propiedad']),

-- ANMAT - Productos Médicos
('ANMAT-PM-001', 'Inscripción Legajo Empresa PM', 'ANMAT', 'Productos Médicos', 'Legajo', 'TAD', 90, 50000, 0, ARRAY['Estatuto social','Poder del representante legal','Constancia de CUIT','DNI y titulo del Director Tecnico','Habilitacion del establecimiento','Certificado de domicilio']),
('ANMAT-PM-002', 'Registro PM Clase I', 'ANMAT', 'Productos Médicos', 'Registro', 'TAD', 60, 30000, 0, ARRAY['Formulario de Solicitud ANMAT','Certificado de Libre Venta (CFS)','Manual de Usuario en espanol','Rotulo propuesto','Declaracion Jurada de Fabricante','Poder del Importador']),
('ANMAT-PM-003', 'Registro PM Clase II', 'ANMAT', 'Productos Médicos', 'Registro', 'TAD', 120, 60000, 0, ARRAY['Formulario de Solicitud ANMAT','Certificado de Libre Venta (CFS)','Certificado ISO 13485','Manual de Usuario en espanol','Instrucciones de Uso (IFU)','Analisis de Riesgos','Ficha Tecnica']),
('ANMAT-PM-004', 'Registro PM Clase III', 'ANMAT', 'Productos Médicos', 'Registro', 'TAD', 180, 100000, 0, ARRAY['Formulario de Solicitud ANMAT','Certificado de Libre Venta (CFS)','Certificado ISO 13485','Certificado CE/FDA','Estudios Clinicos','Biocompatibilidad ISO 10993','Analisis de Riesgos ISO 14971']),
('ANMAT-PM-005', 'Registro PM Clase IV', 'ANMAT', 'Productos Médicos', 'Registro', 'TAD', 240, 150000, 0, ARRAY['Formulario de Solicitud ANMAT','Certificado de Libre Venta (CFS)','Certificado ISO 13485','Certificado CE/FDA','Estudios Clinicos','Biocompatibilidad ISO 10993','Analisis de Riesgos ISO 14971','Dossier tecnico completo']),
('ANMAT-PM-006', 'Modificación Registro PM', 'ANMAT', 'Productos Médicos', 'Modificación', 'TAD', 90, 40000, 0, ARRAY['Formulario de Modificacion','Certificado vigente a modificar','Justificacion del cambio','Documentacion de soporte']),
('ANMAT-PM-007', 'Renovación Registro PM', 'ANMAT', 'Productos Médicos', 'Renovación', 'TAD', 120, 50000, 0, ARRAY['Formulario de Reinscripcion','Certificado vigente','CFS actualizado','Declaracion de cambios','Certificado de vigencia del fabricante']),

-- ANMAT - Cosméticos
('ANMAT-COS-001', 'Inscripción Legajo Cosméticos', 'ANMAT', 'Cosméticos', 'Legajo', 'TAD', 60, 35000, 0, ARRAY['Estatuto social','Constancia de CUIT','DNI y titulo del Director Tecnico','Habilitacion del establecimiento','Certificado de domicilio']),
('ANMAT-COS-002', 'Notificación Producto Grado 1', 'ANMAT', 'Cosméticos', 'Notificación', 'TAD', 30, 15000, 0, ARRAY['Formulario de Solicitud','Formula cualicuantitativa','Metodo de elaboracion','Especificaciones de producto terminado','Rotulo propuesto']),
('ANMAT-COS-003', 'Registro Producto Grado 2', 'ANMAT', 'Cosméticos', 'Registro', 'TAD', 90, 45000, 0, ARRAY['Formulario de Solicitud','Formula cualicuantitativa','Estudios de Eficacia','Estudios de Seguridad','FPS si corresponde','Rotulo propuesto']),
('ANMAT-COS-004', 'Modificación Registro Cosmético', 'ANMAT', 'Cosméticos', 'Modificación', 'TAD', 60, 25000, 0, ARRAY['Formulario de Modificacion','Certificado vigente a modificar','Justificacion del cambio','Documentacion de soporte']),

-- ANMAT - Domisanitarios
('ANMAT-DOM-001', 'Inscripción Legajo Domisanitarios', 'ANMAT', 'Domisanitarios', 'Legajo', 'TAD', 60, 35000, 0, ARRAY['Estatuto social','Constancia de CUIT','DNI y titulo del Director Tecnico','Habilitacion del establecimiento','Certificado de domicilio']),
('ANMAT-DOM-002', 'Notificación Producto Riesgo I', 'ANMAT', 'Domisanitarios', 'Notificación', 'TAD', 30, 20000, 0, ARRAY['Formulario de Solicitud','Formula cualicuantitativa','Especificaciones fisico-quimicas','Hoja de Seguridad (MSDS)','Rotulo propuesto']),
('ANMAT-DOM-003', 'Registro Producto Riesgo IIA', 'ANMAT', 'Domisanitarios', 'Registro', 'TAD', 90, 50000, 0, ARRAY['Formulario de Solicitud','Formula cualicuantitativa','Especificaciones fisico-quimicas','Hoja de Seguridad (MSDS)','Ensayos de eficacia','Rotulo propuesto']),
('ANMAT-DOM-004', 'Registro Producto Riesgo IIB', 'ANMAT', 'Domisanitarios', 'Registro', 'TAD', 120, 60000, 0, ARRAY['Formulario de Solicitud','Formula cualicuantitativa','Especificaciones fisico-quimicas','Hoja de Seguridad (MSDS)','Ensayos de eficacia','Estudio toxicologico','Rotulo propuesto']),

-- SENASA
('SENASA-001', 'Autorización Importación Alimentos (Food)', 'SENASA', 'Food', 'Importación', 'VUCE', 30, 15000, 0, ARRAY['Formulario SENASA','Certificado Sanitario de origen','Habilitacion del establecimiento origen','Protocolo de analisis','Ficha tecnica','Rotulo propuesto']),
('SENASA-002', 'Autorización Importación Feed', 'SENASA', 'Feed', 'Importación', 'VUCE', 30, 15000, 0, ARRAY['Formulario SENASA','Certificado Sanitario de origen','Composicion del producto','Protocolo de analisis','Ficha tecnica']),
('SENASA-003', 'Inscripción Establecimiento SENASA', 'SENASA', 'Establecimiento', 'Inscripción', 'SIGSA', 120, 40000, 0, ARRAY['Formulario de Habilitacion','Estatuto social','CUIT/Constancia AFIP','Habilitacion municipal','Plano del establecimiento','Manual de BPM']),
('SENASA-004', 'Registro Producto Veterinario (RPV)', 'SENASA', 'RPV', 'Registro', 'TAD', 180, 80000, 0, ARRAY['Formulario SENASA','Certificado Sanitario de origen','Formula cualicuantitativa','Ensayos de eficacia y seguridad','GMP del fabricante','Certificado de Libre Venta','Rotulo propuesto']),
('SENASA-005', 'Inscripción RENSPA', 'SENASA', 'RENSPA', 'Inscripción', 'SIGSA', 60, 0, 0, ARRAY['Formulario de Habilitacion','Estatuto social','CUIT/Constancia AFIP','Documentacion productiva','Ubicacion georeferenciada']),
('SENASA-006', 'Registro Fertilizante/Enmienda', 'SENASA', 'Fertilizantes', 'Registro', 'TAD', 90, 30000, 0, ARRAY['Formulario SENASA','Composicion del producto','Protocolo de analisis','Rotulo propuesto','Certificado de origen']),
('SENASA-007', 'Certificado Exportación Productos Origen Animal', 'SENASA', 'Exportación', 'Certificación', 'SIGSA', 15, 5000, 0, ARRAY['Formulario SENASA','Habilitacion del establecimiento','Documentacion sanitaria','Factura de exportacion','Certificado de calidad']),

-- INTI
('INTI-001', 'Verificación Metrología Legal', 'INTI', 'Metrología', 'Verificación', 'TAD', 30, 50000, 0, ARRAY['Solicitud de Certificacion','Especificaciones Tecnicas del instrumento','Muestras para ensayo','Documentacion tecnica del fabricante']),
('INTI-002', 'Aprobación de Modelo', 'INTI', 'Metrología', 'Aprobación', 'TAD', 90, 150000, 0, ARRAY['Solicitud de Certificacion','Especificaciones Tecnicas','Muestras para ensayo','Certificados de origen','Documentacion tecnica completa']),
('INTI-003', 'Certificación Producto RT', 'INTI', 'Certificación', 'Reglamento Técnico', 'TAD', 60, 80000, 0, ARRAY['Solicitud de Certificacion','Informe de ensayo acreditado','Especificaciones Tecnicas','Certificados de origen','Declaracion de conformidad']),
('INTI-004', 'Ensayo de Laboratorio', 'INTI', 'Ensayos', 'Laboratorio', 'TAD', 30, 100000, 0, ARRAY['Solicitud de Ensayo','Muestras para ensayo','Protocolo de ensayo requerido','Especificaciones Tecnicas']),

-- SEDRONAR / RENPRE
('RENPRE-001', 'Inscripción RENPRE', 'SEDRONAR', 'RENPRE', 'Inscripción', 'TAD', 60, 10000, 0, ARRAY['Formulario de Inscripcion RENPRE','Estatuto social','DNI de representantes','Habilitacion municipal','Listado de sustancias a operar','Antecedentes penales de responsables']),
('RENPRE-002', 'Autorización Importación Precursores', 'SEDRONAR', 'RENPRE', 'Autorización', 'TAD', 30, 8000, 0, ARRAY['Solicitud de Autorizacion','Certificado RENPRE vigente','Factura Proforma','Certificado de uso final']),
('RENPRE-003', 'Formulario F01 Compraventa', 'SEDRONAR', 'RENPRE', 'Formulario', 'TAD', 15, 2000, 0, ARRAY['Solicitud de Autorizacion','Certificado RENPRE vigente','Factura Proforma','Datos de la operacion']),
('RENPRE-004', 'Informe Semestral RENPRE', 'SEDRONAR', 'RENPRE', 'Informe', 'TAD', 15, 0, 0, ARRAY['Certificado RENPRE vigente','Libro de registro actualizado','Detalle de movimientos del semestre']),

-- CITES
('CITES-001', 'Certificado CITES Importación', 'CITES', 'CITES', 'Importación', 'TAD', 30, 5000, 0, ARRAY['Formulario de Solicitud CITES','Permiso CITES del pais origen/destino','Documentacion del origen legal','Fotos de los especimenes','Factura comercial']),
('CITES-002', 'Certificado CITES Exportación', 'CITES', 'CITES', 'Exportación', 'TAD', 30, 5000, 0, ARRAY['Formulario de Solicitud CITES','Guia de transito','Documentacion del origen legal','Fotos de los especimenes','Factura de exportacion']),
('CITES-003', 'Inscripción RUOFS', 'CITES', 'RUOFS', 'Inscripción', 'TAD', 45, 8000, 0, ARRAY['Formulario de Inscripcion RUOFS','Documentacion de la empresa','Listado de especies a operar','Habilitacion correspondiente']),

-- INASE
('INASE-001', 'Inscripción RNCyFS', 'INASE', 'Semillas', 'Inscripción', 'TAD', 60, 50000, 0, ARRAY['Formulario de Inscripcion','Documentacion de la empresa','Descripcion de infraestructura','Director Tecnico habilitado']),
('INASE-002', 'Registro de Cultivar', 'INASE', 'Cultivares', 'Registro', 'TAD', 180, 200000, 0, ARRAY['Solicitud de Registro','Descripcion varietal completa','Ensayos DHE (Distincion, Homogeneidad, Estabilidad)','Documentacion de origen genetico','Muestra viva']),
('INASE-003', 'Importación Material de Propagación', 'INASE', 'Semillas', 'Importación', 'TAD', 30, 15000, 0, ARRAY['Solicitud de Permiso Fitosanitario','Certificado Fitosanitario de origen','Certificado de calidad de semillas','Factura Proforma']),

-- SIC
('SIC-001', 'Certificación Reglamento Técnico', 'SIC', 'Seguridad', 'Certificación', 'TAD', 60, 30000, 0, ARRAY['Solicitud de Certificacion','Informe de Ensayos IRAM/acreditado','Documentacion tecnica del producto','Especificaciones Tecnicas','Declaracion de conformidad']),
('SIC-002', 'LCM Vehículos/Autopartes', 'SIC', 'Vehículos', 'Licencia', 'TAD', 90, 80000, 0, ARRAY['Formulario SIMI','Homologacion internacional','Informe de ensayos','Ficha tecnica del vehiculo','Factura Proforma']),
('SIC-003', 'Eficiencia Energética - Etiquetado', 'SIC', 'Eficiencia', 'Etiquetado', 'TAD', 45, 25000, 0, ARRAY['Solicitud de Certificacion','Ensayo de eficiencia energetica','Ficha tecnica del producto','Especificaciones Tecnicas','Etiqueta propuesta'])

ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  organismo = EXCLUDED.organismo,
  categoria = EXCLUDED.categoria,
  subcategoria = EXCLUDED.subcategoria,
  plataforma = EXCLUDED.plataforma,
  plazo_dias = EXCLUDED.plazo_dias,
  costo_organismo = EXCLUDED.costo_organismo,
  honorarios = EXCLUDED.honorarios,
  documentacion_obligatoria = EXCLUDED.documentacion_obligatoria;
