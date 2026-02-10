-- SGT: Catálogo COMPLETO de trámites regulatorios argentinos
-- Ejecutar en Supabase SQL Editor
-- Total objetivo: 535 tipos across 10 organismos
-- CAPA 1: INAL (52 tipos)

-- 1. Asegurar constraint UNIQUE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tramite_tipos_codigo_key'
  ) THEN
    ALTER TABLE tramite_tipos ADD CONSTRAINT tramite_tipos_codigo_key UNIQUE (codigo);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Limpiar tabla
DELETE FROM tramite_tipos;

-- =============================================
-- INAL - Instituto Nacional de Alimentos (52)
-- =============================================
INSERT INTO tramite_tipos (codigo, nombre, organismo, categoria, subcategoria, plataforma, plazo_dias, costo_organismo, honorarios, documentacion_obligatoria, activo) VALUES
-- RNE (12)
('INAL-001', 'Inscripcion RNE Importador/Exportador', 'INAL', 'RNE', 'Inscripcion', 'TADO', 120, 40000, 0, ARRAY['Habilitacion municipal','Plano del establecimiento','POE','Titulo Director Tecnico','Constancia CUIT','Estatuto social'], true),
('INAL-002', 'Inscripcion RNE + Rubro Alimentos Secos', 'INAL', 'RNE', 'Inscripcion', 'TADO', 120, 40000, 0, ARRAY['Habilitacion municipal','Plano del establecimiento','POE alimentos secos','Titulo Director Tecnico','Constancia CUIT'], true),
('INAL-003', 'Inscripcion RNE + Rubro Lacteos/Refrigerados', 'INAL', 'RNE', 'Inscripcion', 'TADO', 120, 45000, 0, ARRAY['Habilitacion municipal','Plano del establecimiento','POE cadena de frio','Titulo Director Tecnico','Registro temperaturas'], true),
('INAL-004', 'Inscripcion RNE + Rubro Suplementos Dietarios', 'INAL', 'RNE', 'Inscripcion', 'TADO', 150, 50000, 0, ARRAY['Habilitacion municipal','Plano del establecimiento','POE suplementos','Titulo Director Tecnico farmaceutico','BPM suplementos'], true),
('INAL-005', 'Inscripcion RNE + Rubro UPEI', 'INAL', 'RNE', 'Inscripcion', 'TADO', 120, 40000, 0, ARRAY['Habilitacion municipal','Plano del establecimiento','POE','Titulo Director Tecnico','Constancia CUIT'], true),
('INAL-006', 'Reinscripcion RNE', 'INAL', 'RNE', 'Reinscripcion', 'TADO', 60, 20000, 0, ARRAY['RNE vigente','Habilitacion municipal actualizada','Constancia CUIT','DDJJ sin cambios'], true),
('INAL-007', 'Modificacion General RNE', 'INAL', 'RNE', 'Modificacion', 'TADO', 60, 12000, 0, ARRAY['Nota de cambio','Documentacion respaldatoria','RNE vigente'], true),
('INAL-008', 'Designacion Director Tecnico', 'INAL', 'RNE', 'Personal', 'TADO', 30, 8000, 0, ARRAY['Nota de designacion','DNI del Director Tecnico','Titulo profesional','Matricula habilitante','DDJJ incompatibilidad','CV'], true),
('INAL-009', 'Designacion Co-DT Suplementos', 'INAL', 'RNE', 'Personal', 'TADO', 30, 8000, 0, ARRAY['Nota de designacion','DNI del Co-DT','Titulo farmaceutico','Matricula habilitante','DDJJ incompatibilidad'], true),
('INAL-010', 'Ampliacion Rubro RNE', 'INAL', 'RNE', 'Ampliacion', 'TADO', 60, 15000, 0, ARRAY['Nota rubros nuevos','POE ampliado','Habilitacion municipal actualizada','Manual BPM actualizado'], true),
('INAL-011', 'Modificacion Estructura Deposito', 'INAL', 'RNE', 'Modificacion', 'TADO', 90, 15000, 0, ARRAY['Planos nuevos','Fotos del deposito','Habilitacion municipal','Memoria descriptiva'], true),
('INAL-012', 'Incorporacion/Modificacion Deposito', 'INAL', 'RNE', 'Deposito', 'TADO', 60, 20000, 0, ARRAY['Habilitacion municipal nuevo deposito','Plano del establecimiento','Contrato alquiler o titulo propiedad'], true),
-- RNPA (12)
('INAL-013', 'Inscripcion RNPA Alimentos', 'INAL', 'RNPA', 'Inscripcion', 'TADO', 90, 32000, 0, ARRAY['Ficha tecnica','Analisis bromatologico','Rotulo en espanol','CFS origen','RNE vigente','DDJJ Director Tecnico'], true),
('INAL-014', 'Reinscripcion RNPA', 'INAL', 'RNPA', 'Reinscripcion', 'TADO', 60, 20000, 0, ARRAY['RNPA vigente','Ficha tecnica actualizada','Rotulo vigente','CFS actualizado'], true),
('INAL-015', 'Agotamiento Stock Rotulos RNPA', 'INAL', 'RNPA', 'Modificacion', 'TADO', 30, 5000, 0, ARRAY['Nota solicitud','RNPA vigente','Cantidad stock viejo','Nuevo rotulo propuesto'], true),
('INAL-016', 'RNPA Suplementos Dietarios', 'INAL', 'RNPA', 'Inscripcion', 'TADO', 120, 45000, 0, ARRAY['Formula cualicuantitativa','Analisis producto terminado','Estudios estabilidad','GMP fabricante','Rotulo propuesto','CFS origen'], true),
('INAL-017', 'RNPA Alimentos Medicos Especificos', 'INAL', 'RNPA', 'Inscripcion', 'TADO', 150, 50000, 0, ARRAY['Ficha tecnica','Estudios clinicos','Analisis bromatologico','Rotulo nutricional','CFS origen','Evidencia cientifica'], true),
('INAL-018', 'RNPA Bebidas No Alcoholicas', 'INAL', 'RNPA', 'Inscripcion', 'TADO', 90, 35000, 0, ARRAY['Ficha tecnica','Analisis bromatologico','Rotulo en espanol','CFS origen','RNE vigente'], true),
('INAL-019', 'Modificacion RNPA por Rubro (Agregar Sabor)', 'INAL', 'RNPA', 'Modificacion', 'TADO', 45, 12000, 0, ARRAY['Nota solicitud','RNPA vigente','Nuevo rotulo','Nueva ficha tecnica'], true),
('INAL-020', 'Modificacion RNPA Rotulo', 'INAL', 'RNPA', 'Modificacion', 'TADO', 45, 12000, 0, ARRAY['Nota solicitud','RNPA vigente','Nuevo rotulo propuesto','Justificacion del cambio'], true),
('INAL-021', 'Modificacion RNPA Formula', 'INAL', 'RNPA', 'Modificacion', 'TADO', 60, 15000, 0, ARRAY['Nota solicitud','RNPA vigente','Nueva ficha tecnica','Nuevo analisis bromatologico','Justificacion del cambio'], true),
('INAL-022', 'Transferencia RNPA', 'INAL', 'RNPA', 'Transferencia', 'TADO', 60, 20000, 0, ARRAY['Nota solicitud','RNPA vigente','RNE del nuevo titular','Acuerdo de transferencia'], true),
('INAL-023', 'Baja RNPA', 'INAL', 'RNPA', 'Baja', 'TADO', 15, 0, 0, ARRAY['Nota solicitud de baja','RNPA vigente'], true),
('INAL-024', 'RNPA Bebidas Alcoholicas', 'INAL', 'RNPA', 'Inscripcion', 'TADO', 90, 35000, 0, ARRAY['Ficha tecnica','Analisis bromatologico','Rotulo en espanol','CFS origen','Certificado de graduacion alcoholica'], true),
-- Envases (5)
('INAL-025', 'Autorizacion/Transferencia Envases', 'INAL', 'Envases', 'Autorizacion', 'TADO', 90, 35000, 0, ARRAY['Ficha tecnica del material','Ensayo de migracion','Certificado aptitud alimentaria','Declaracion composicion'], true),
('INAL-026', 'Autorizacion Envases Plasticos', 'INAL', 'Envases', 'Autorizacion', 'TADO', 90, 35000, 0, ARRAY['Ficha material plastico','Ensayo migracion global','Ensayo migracion especifica','Declaracion composicion polimeros'], true),
('INAL-027', 'Autorizacion Envases Metalicos', 'INAL', 'Envases', 'Autorizacion', 'TADO', 90, 35000, 0, ARRAY['Ficha material metalico','Ensayo migracion','Recubrimiento interno','Declaracion composicion'], true),
('INAL-028', 'Renovacion Autorizacion Envases', 'INAL', 'Envases', 'Renovacion', 'TADO', 60, 15000, 0, ARRAY['Autorizacion vigente','Ensayo migracion actualizado','DDJJ sin cambios'], true),
('INAL-029', 'Modificacion Autorizacion Envases', 'INAL', 'Envases', 'Modificacion', 'TADO', 60, 12000, 0, ARRAY['Autorizacion vigente','Justificacion del cambio','Nuevo ensayo si aplica'], true),
-- Importaciones (7)
('INAL-030', 'Autorizacion Importacion Temporal', 'INAL', 'Importacion', 'Temporal', 'TADO', 30, 10000, 0, ARRAY['Nota finalidad','Compromiso reexportacion','Factura proforma','Certificado sanitario origen'], true),
('INAL-031', 'Ingreso Muestra Sin Valor', 'INAL', 'Importacion', 'Muestra', 'TADO', 15, 2000, 0, ARRAY['Nota solicitud','Factura proforma','Detalle de productos'], true),
('INAL-032', 'Aviso Importacion Alimentos (por producto)', 'INAL', 'Importacion', 'Aviso', 'VUCE', 1, 0, 0, ARRAY['RNPA vigente','RNE vigente','Factura comercial','Packing list','Certificado sanitario origen'], true),
('INAL-033', 'Aviso Importacion Envases (por linea)', 'INAL', 'Importacion', 'Aviso', 'VUCE', 1, 0, 0, ARRAY['Autorizacion envase vigente','Factura comercial','Packing list'], true),
('INAL-034', 'Aviso Importacion UPEI', 'INAL', 'Importacion', 'Aviso', 'VUCE', 1, 0, 0, ARRAY['RNE vigente','Factura comercial','Packing list','Certificado origen'], true),
('INAL-035', 'Autorizacion Importacion Consolidada Alimentos', 'INAL', 'Importacion', 'Consolidada', 'TADO', 30, 15000, 0, ARRAY['RNE vigente','Listado productos','Factura proforma','Certificado sanitario'], true),
('INAL-036', 'Autorizacion Importacion Consolidada Envases', 'INAL', 'Importacion', 'Consolidada', 'TADO', 30, 15000, 0, ARRAY['Autorizacion envases','Listado materiales','Factura proforma'], true),
-- Inspecciones y Certificaciones (5)
('INAL-037', 'Inspeccion BPM Elaboradores', 'INAL', 'Inspeccion', 'BPM', 'TAD', 60, 444600, 0, ARRAY['RNE vigente','Manual BPM','Registros de produccion','POE actualizados'], true),
('INAL-038', 'Inspeccion HACCP', 'INAL', 'Inspeccion', 'HACCP', 'TAD', 60, 673200, 0, ARRAY['Plan HACCP','Registros PCC','Manual BPM','Procedimientos validacion'], true),
('INAL-039', 'Certificado Producto Exclusivo Exportar', 'INAL', 'Certificacion', 'Exportacion', 'TADO', 30, 15000, 0, ARRAY['RNPA vigente','Ficha tecnica','Requisitos pais destino'], true),
('INAL-040', 'Certificacion Export UE TRACES', 'INAL', 'Certificacion', 'Exportacion', 'TADO', 45, 20000, 0, ARRAY['RNPA vigente','RNE vigente','Requisitos UE','Analisis acreditado'], true),
('INAL-041', 'Inspeccion BPM Importadores', 'INAL', 'Inspeccion', 'BPM', 'TAD', 60, 300000, 0, ARRAY['RNE vigente','Manual BPM importador','Registros recepcion','Control temperatura'], true),
-- Autorizaciones Especiales (7)
('INAL-042', 'Autorizacion Probioticos/Prebioticos', 'INAL', 'Autorizacion', 'Especial', 'TADO', 90, 35000, 0, ARRAY['Formula cualicuantitativa','Identificacion cepas','Estudios eficacia','Rotulo propuesto','CFS origen'], true),
('INAL-043', 'Autorizacion Alimentos Nuevos', 'INAL', 'Autorizacion', 'Especial', 'TADO', 120, 50000, 0, ARRAY['Dossier tecnico completo','Estudios seguridad','Evaluacion riesgo','Antecedentes regulatorios internacionales'], true),
('INAL-044', 'Informe Encadre Normativo CAA', 'INAL', 'Autorizacion', 'Consulta', 'TADO', 60, 25000, 0, ARRAY['Descripcion del producto','Ficha tecnica','Consulta especifica'], true),
('INAL-045', 'Extension Certificacion Vegana', 'INAL', 'Certificacion', 'Especial', 'TADO', 30, 15000, 0, ARRAY['RNPA vigente','Declaracion ingredientes','Certificado vegano del fabricante'], true),
('INAL-046', 'Rotulo Monitoreo PMI Importados', 'INAL', 'Autorizacion', 'Monitoreo', 'TADO', 20, 8000, 0, ARRAY['RNPA vigente','Rotulo actual','Rotulo propuesto'], true),
('INAL-047', 'Autorizacion Declaraciones Saludables Publicidad', 'INAL', 'Autorizacion', 'Publicidad', 'TADO', 90, 40000, 0, ARRAY['RNPA vigente','Evidencia cientifica','Material publicitario propuesto','Estudios de respaldo'], true),
('INAL-048', 'Extension HACCP Suplementos', 'INAL', 'Certificacion', 'HACCP', 'TADO', 60, 30000, 0, ARRAY['Plan HACCP suplementos','Registros PCC','BPM vigente','Validacion procesos'], true),
-- Otros (4)
('INAL-049', 'Baja RNE', 'INAL', 'RNE', 'Baja', 'TADO', 15, 0, 0, ARRAY['Nota solicitud de baja','RNE vigente'], true),
('INAL-050', 'Transferencia RNE', 'INAL', 'RNE', 'Transferencia', 'TADO', 90, 25000, 0, ARRAY['RNE vigente','Documentacion nuevo titular','Habilitacion municipal','Acuerdo transferencia'], true),
('INAL-051', 'Certificado Libre Circulacion Alimentos', 'INAL', 'Certificacion', 'Libre Circulacion', 'TADO', 30, 10000, 0, ARRAY['RNPA vigente','RNE vigente','Constancia CUIT'], true),
('INAL-052', 'Consulta Tecnica INAL', 'INAL', 'Autorizacion', 'Consulta', 'TADO', 30, 5000, 0, ARRAY['Nota de consulta','Documentacion de soporte'], true);

-- Verificacion INAL
SELECT 'INAL' as organismo, count(*) as total FROM tramite_tipos WHERE organismo = 'INAL';
