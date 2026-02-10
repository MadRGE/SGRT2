-- SGT v7: Enriquecer documentacion_obligatoria con datos detallados del seed
-- Ejecutar en Supabase SQL Editor (después de la migración 54)
-- Fuente: seed_documentacion_final.py → DOCS_BASE

-- =============================================
-- INAL - RNE (Establecimientos)
-- =============================================

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud RNE',
  'Habilitacion municipal/provincial',
  'Plano del establecimiento',
  'Manual de BPM',
  'Plan HACCP'
] WHERE codigo = 'INAL-001';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Reinscripcion',
  'Certificado vigente',
  'CFS actualizado',
  'Declaracion de cambios'
] WHERE codigo = 'INAL-002';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Modificacion',
  'Certificado vigente a modificar',
  'Justificacion del cambio',
  'Documentacion de soporte'
] WHERE codigo = 'INAL-003';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Nota de designacion',
  'DNI del Director Tecnico',
  'Titulo profesional',
  'Matricula habilitante',
  'DDJJ de incompatibilidad'
] WHERE codigo = 'INAL-004';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud RNE',
  'Nota de rubros nuevos',
  'POE ampliado',
  'Habilitacion municipal actualizada',
  'Manual de BPM actualizado'
] WHERE codigo = 'INAL-005';

-- =============================================
-- INAL - RNPA (Productos Alimenticios)
-- =============================================

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud INAL',
  'Certificado de Libre Venta (CFS)',
  'Analisis Bromatologico',
  'Ficha Tecnica del producto',
  'Rotulo nutricional propuesto',
  'Habilitacion RNE vigente'
] WHERE codigo = 'INAL-006';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud',
  'Formula cualicuantitativa',
  'Analisis de producto terminado',
  'Estudios de estabilidad',
  'GMP del fabricante',
  'Rotulo propuesto'
] WHERE codigo = 'INAL-007';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Modificacion',
  'Certificado vigente a modificar',
  'Nuevo rotulo propuesto',
  'Nueva ficha tecnica',
  'Justificacion del cambio'
] WHERE codigo = 'INAL-008';

-- INAL-009: Envases (specific)
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud',
  'Ficha tecnica del material',
  'Ensayo de migracion',
  'Certificado de aptitud alimentaria',
  'Declaracion de composicion'
] WHERE codigo = 'INAL-009';

-- INAL-010: Importación temporal
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Nota de solicitud con finalidad',
  'Compromiso de reexportacion',
  'Factura proforma',
  'Certificado sanitario de origen'
] WHERE codigo = 'INAL-010';

-- INAL-011: Depósito
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud',
  'Habilitacion municipal del nuevo deposito',
  'Plano del establecimiento',
  'Contrato de alquiler o titulo de propiedad'
] WHERE codigo = 'INAL-011';

-- =============================================
-- ANMAT - Productos Médicos
-- =============================================

-- Legajo empresa (administrativo)
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Estatuto social',
  'Poder del representante legal',
  'Constancia de CUIT',
  'DNI y titulo del Director Tecnico',
  'Habilitacion del establecimiento',
  'Certificado de domicilio'
] WHERE codigo = 'ANMAT-PM-001';

-- PM Clase I
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud ANMAT',
  'Certificado de Libre Venta (CFS)',
  'Manual de Usuario en espanol',
  'Rotulo propuesto',
  'Declaracion Jurada de Fabricante',
  'Poder del Importador'
] WHERE codigo = 'ANMAT-PM-002';

-- PM Clase II
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud ANMAT',
  'Certificado de Libre Venta (CFS)',
  'Certificado ISO 13485',
  'Manual de Usuario en espanol',
  'Instrucciones de Uso (IFU)',
  'Analisis de Riesgos',
  'Ficha Tecnica'
] WHERE codigo = 'ANMAT-PM-003';

-- PM Clase III
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud ANMAT',
  'Certificado de Libre Venta (CFS)',
  'Certificado ISO 13485',
  'Certificado CE/FDA',
  'Estudios Clinicos',
  'Biocompatibilidad ISO 10993',
  'Analisis de Riesgos ISO 14971'
] WHERE codigo = 'ANMAT-PM-004';

-- PM Clase IV
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud ANMAT',
  'Certificado de Libre Venta (CFS)',
  'Certificado ISO 13485',
  'Certificado CE/FDA',
  'Estudios Clinicos',
  'Biocompatibilidad ISO 10993',
  'Analisis de Riesgos ISO 14971',
  'Dossier tecnico completo'
] WHERE codigo = 'ANMAT-PM-005';

-- Modificación PM
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Modificacion',
  'Certificado vigente a modificar',
  'Justificacion del cambio',
  'Documentacion de soporte'
] WHERE codigo = 'ANMAT-PM-006';

-- Renovación PM
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Reinscripcion',
  'Certificado vigente',
  'CFS actualizado',
  'Declaracion de cambios',
  'Certificado de vigencia del fabricante'
] WHERE codigo = 'ANMAT-PM-007';

-- =============================================
-- ANMAT - Cosméticos
-- =============================================

-- Legajo Cosméticos
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Estatuto social',
  'Constancia de CUIT',
  'DNI y titulo del Director Tecnico',
  'Habilitacion del establecimiento',
  'Certificado de domicilio'
] WHERE codigo = 'ANMAT-COS-001';

-- Grado 1
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud',
  'Formula cualicuantitativa',
  'Metodo de elaboracion',
  'Especificaciones de producto terminado',
  'Rotulo propuesto'
] WHERE codigo = 'ANMAT-COS-002';

-- Grado 2
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud',
  'Formula cualicuantitativa',
  'Estudios de Eficacia',
  'Estudios de Seguridad',
  'FPS si corresponde',
  'Rotulo propuesto'
] WHERE codigo = 'ANMAT-COS-003';

-- Modificación Cosmético
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Modificacion',
  'Certificado vigente a modificar',
  'Justificacion del cambio',
  'Documentacion de soporte'
] WHERE codigo = 'ANMAT-COS-004';

-- =============================================
-- ANMAT - Domisanitarios
-- =============================================

-- Legajo Domisanitarios
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Estatuto social',
  'Constancia de CUIT',
  'DNI y titulo del Director Tecnico',
  'Habilitacion del establecimiento',
  'Certificado de domicilio'
] WHERE codigo = 'ANMAT-DOM-001';

-- Riesgo I
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud',
  'Formula cualicuantitativa',
  'Especificaciones fisico-quimicas',
  'Hoja de Seguridad (MSDS)',
  'Rotulo propuesto'
] WHERE codigo = 'ANMAT-DOM-002';

-- Riesgo IIA
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud',
  'Formula cualicuantitativa',
  'Especificaciones fisico-quimicas',
  'Hoja de Seguridad (MSDS)',
  'Ensayos de eficacia',
  'Rotulo propuesto'
] WHERE codigo = 'ANMAT-DOM-003';

-- Riesgo IIB
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud',
  'Formula cualicuantitativa',
  'Especificaciones fisico-quimicas',
  'Hoja de Seguridad (MSDS)',
  'Ensayos de eficacia',
  'Estudio toxicologico',
  'Rotulo propuesto'
] WHERE codigo = 'ANMAT-DOM-004';

-- =============================================
-- SENASA
-- =============================================

-- Autorización Importación Alimentos
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario SENASA',
  'Certificado Sanitario de origen',
  'Habilitacion del establecimiento origen',
  'Protocolo de analisis',
  'Ficha tecnica',
  'Rotulo propuesto'
] WHERE codigo = 'SENASA-001';

-- Autorización Importación Feed
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario SENASA',
  'Certificado Sanitario de origen',
  'Composicion del producto',
  'Protocolo de analisis',
  'Ficha tecnica'
] WHERE codigo = 'SENASA-002';

-- Inscripción Establecimiento
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Habilitacion',
  'Estatuto social',
  'CUIT/Constancia AFIP',
  'Habilitacion municipal',
  'Plano del establecimiento',
  'Manual de BPM'
] WHERE codigo = 'SENASA-003';

-- Registro Producto Veterinario
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario SENASA',
  'Certificado Sanitario de origen',
  'Formula cualicuantitativa',
  'Ensayos de eficacia y seguridad',
  'GMP del fabricante',
  'Certificado de Libre Venta',
  'Rotulo propuesto'
] WHERE codigo = 'SENASA-004';

-- Inscripción RENSPA
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Habilitacion',
  'Estatuto social',
  'CUIT/Constancia AFIP',
  'Documentacion productiva',
  'Ubicacion georeferenciada'
] WHERE codigo = 'SENASA-005';

-- Registro Fertilizante
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario SENASA',
  'Composicion del producto',
  'Protocolo de analisis',
  'Rotulo propuesto',
  'Certificado de origen'
] WHERE codigo = 'SENASA-006';

-- Certificado Exportación
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario SENASA',
  'Habilitacion del establecimiento',
  'Documentacion sanitaria',
  'Factura de exportacion',
  'Certificado de calidad'
] WHERE codigo = 'SENASA-007';

-- =============================================
-- INTI
-- =============================================

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Solicitud de Certificacion',
  'Especificaciones Tecnicas del instrumento',
  'Muestras para ensayo',
  'Documentacion tecnica del fabricante'
] WHERE codigo = 'INTI-001';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Solicitud de Certificacion',
  'Especificaciones Tecnicas',
  'Muestras para ensayo',
  'Certificados de origen',
  'Documentacion tecnica completa'
] WHERE codigo = 'INTI-002';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Solicitud de Certificacion',
  'Informe de ensayo acreditado',
  'Especificaciones Tecnicas',
  'Certificados de origen',
  'Declaracion de conformidad'
] WHERE codigo = 'INTI-003';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Solicitud de Ensayo',
  'Muestras para ensayo',
  'Protocolo de ensayo requerido',
  'Especificaciones Tecnicas'
] WHERE codigo = 'INTI-004';

-- =============================================
-- SEDRONAR / RENPRE
-- =============================================

-- Inscripción RENPRE
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Inscripcion RENPRE',
  'Estatuto social',
  'DNI de representantes',
  'Habilitacion municipal',
  'Listado de sustancias a operar',
  'Antecedentes penales de responsables'
] WHERE codigo = 'RENPRE-001';

-- Autorización Importación Precursores
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Solicitud de Autorizacion',
  'Certificado RENPRE vigente',
  'Factura Proforma',
  'Certificado de uso final'
] WHERE codigo = 'RENPRE-002';

-- Formulario F01
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Solicitud de Autorizacion',
  'Certificado RENPRE vigente',
  'Factura Proforma',
  'Datos de la operacion'
] WHERE codigo = 'RENPRE-003';

-- Informe Semestral
UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Certificado RENPRE vigente',
  'Libro de registro actualizado',
  'Detalle de movimientos del semestre'
] WHERE codigo = 'RENPRE-004';

-- =============================================
-- CITES
-- =============================================

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud CITES',
  'Permiso CITES del pais origen/destino',
  'Documentacion del origen legal',
  'Fotos de los especimenes',
  'Factura comercial'
] WHERE codigo = 'CITES-001';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Solicitud CITES',
  'Guia de transito',
  'Documentacion del origen legal',
  'Fotos de los especimenes',
  'Factura de exportacion'
] WHERE codigo = 'CITES-002';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Inscripcion RUOFS',
  'Documentacion de la empresa',
  'Listado de especies a operar',
  'Habilitacion correspondiente'
] WHERE codigo = 'CITES-003';

-- =============================================
-- INASE
-- =============================================

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario de Inscripcion',
  'Documentacion de la empresa',
  'Descripcion de infraestructura',
  'Director Tecnico habilitado'
] WHERE codigo = 'INASE-001';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Solicitud de Registro',
  'Descripcion varietal completa',
  'Ensayos DHE (Distincion, Homogeneidad, Estabilidad)',
  'Documentacion de origen genetico',
  'Muestra viva'
] WHERE codigo = 'INASE-002';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Solicitud de Permiso Fitosanitario',
  'Certificado Fitosanitario de origen',
  'Certificado de calidad de semillas',
  'Factura Proforma'
] WHERE codigo = 'INASE-003';

-- =============================================
-- SIC - Industria y Comercio
-- =============================================

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Solicitud de Certificacion',
  'Informe de Ensayos IRAM/acreditado',
  'Documentacion tecnica del producto',
  'Especificaciones Tecnicas',
  'Declaracion de conformidad'
] WHERE codigo = 'SIC-001';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Formulario SIMI',
  'Homologacion internacional',
  'Informe de ensayos',
  'Ficha tecnica del vehiculo',
  'Factura Proforma'
] WHERE codigo = 'SIC-002';

UPDATE tramite_tipos SET documentacion_obligatoria = ARRAY[
  'Solicitud de Certificacion',
  'Ensayo de eficiencia energetica',
  'Ficha tecnica del producto',
  'Especificaciones Tecnicas',
  'Etiqueta propuesta'
] WHERE codigo = 'SIC-003';
