-- =====================================================
-- Migration 68: Seed catálogo tramite_tipos (FINAL)
-- Uses actual columns: organismo, categoria, plataforma, plazo_dias, etc.
-- Run in Supabase SQL Editor
-- =====================================================

-- 1. Disable RLS
ALTER TABLE tramite_tipos DISABLE ROW LEVEL SECURITY;

-- 2. Clear existing data
DELETE FROM tramite_tipos;

-- 3. SEED: INAL (52 tipos)
INSERT INTO tramite_tipos (codigo, nombre, organismo, categoria, subcategoria, plataforma, plazo_dias, costo_organismo, honorarios, documentacion_obligatoria, activo) VALUES
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
('INAL-013', 'Inscripcion RNPA Alimentos', 'INAL', 'RNPA', 'Inscripcion', 'TADO', 90, 32000, 0, ARRAY['Ficha tecnica','Analisis bromatologico','Rotulo en espanol','CFS origen','RNE vigente','DDJJ Director Tecnico'], true),
('INAL-014', 'Reinscripcion RNPA', 'INAL', 'RNPA', 'Reinscripcion', 'TADO', 60, 20000, 0, ARRAY['RNPA vigente','Ficha tecnica actualizada','Rotulo vigente','CFS actualizado'], true),
('INAL-015', 'Agotamiento Stock Rotulos RNPA', 'INAL', 'RNPA', 'Modificacion', 'TADO', 30, 5000, 0, ARRAY['Nota solicitud','RNPA vigente','Cantidad stock viejo','Nuevo rotulo propuesto'], true),
('INAL-016', 'RNPA Suplementos Dietarios', 'INAL', 'RNPA', 'Inscripcion', 'TADO', 120, 45000, 0, ARRAY['Formula cualicuantitativa','Analisis producto terminado','Estudios estabilidad','GMP fabricante','Rotulo propuesto','CFS origen'], true),
('INAL-017', 'RNPA Alimentos Medicos Especificos', 'INAL', 'RNPA', 'Inscripcion', 'TADO', 150, 50000, 0, ARRAY['Ficha tecnica','Estudios clinicos','Analisis bromatologico','Rotulo nutricional','CFS origen','Evidencia cientifica'], true),
('INAL-018', 'RNPA Bebidas No Alcoholicas', 'INAL', 'RNPA', 'Inscripcion', 'TADO', 90, 35000, 0, ARRAY['Ficha tecnica','Analisis bromatologico','Rotulo en espanol','CFS origen','RNE vigente'], true),
('INAL-019', 'Modificacion RNPA Rubro/Sabor', 'INAL', 'RNPA', 'Modificacion', 'TADO', 45, 12000, 0, ARRAY['Nota solicitud','RNPA vigente','Nuevo rotulo','Nueva ficha tecnica'], true),
('INAL-020', 'Modificacion RNPA Rotulo', 'INAL', 'RNPA', 'Modificacion', 'TADO', 45, 12000, 0, ARRAY['Nota solicitud','RNPA vigente','Nuevo rotulo propuesto','Justificacion del cambio'], true),
('INAL-021', 'Modificacion RNPA Formula', 'INAL', 'RNPA', 'Modificacion', 'TADO', 60, 15000, 0, ARRAY['Nota solicitud','RNPA vigente','Nueva ficha tecnica','Nuevo analisis bromatologico','Justificacion del cambio'], true),
('INAL-022', 'Transferencia RNPA', 'INAL', 'RNPA', 'Transferencia', 'TADO', 60, 20000, 0, ARRAY['Nota solicitud','RNPA vigente','RNE del nuevo titular','Acuerdo de transferencia'], true),
('INAL-023', 'Baja RNPA', 'INAL', 'RNPA', 'Baja', 'TADO', 15, 0, 0, ARRAY['Nota solicitud de baja','RNPA vigente'], true),
('INAL-024', 'RNPA Bebidas Alcoholicas', 'INAL', 'RNPA', 'Inscripcion', 'TADO', 90, 35000, 0, ARRAY['Ficha tecnica','Analisis bromatologico','Rotulo en espanol','CFS origen','Certificado graduacion alcoholica'], true),
('INAL-025', 'Autorizacion Envases General', 'INAL', 'Envases', 'Autorizacion', 'TADO', 90, 35000, 0, ARRAY['Ficha tecnica del material','Ensayo de migracion','Certificado aptitud alimentaria','Declaracion composicion'], true),
('INAL-026', 'Autorizacion Envases Plasticos', 'INAL', 'Envases', 'Autorizacion', 'TADO', 90, 35000, 0, ARRAY['Ficha material plastico','Ensayo migracion global','Ensayo migracion especifica','Declaracion composicion polimeros'], true),
('INAL-027', 'Autorizacion Envases Metalicos', 'INAL', 'Envases', 'Autorizacion', 'TADO', 90, 35000, 0, ARRAY['Ficha material metalico','Ensayo migracion','Recubrimiento interno','Declaracion composicion'], true),
('INAL-028', 'Renovacion Autorizacion Envases', 'INAL', 'Envases', 'Renovacion', 'TADO', 60, 15000, 0, ARRAY['Autorizacion vigente','Ensayo migracion actualizado','DDJJ sin cambios'], true),
('INAL-029', 'Modificacion Autorizacion Envases', 'INAL', 'Envases', 'Modificacion', 'TADO', 60, 12000, 0, ARRAY['Autorizacion vigente','Justificacion del cambio','Nuevo ensayo si aplica'], true),
('INAL-030', 'Autorizacion Importacion Temporal', 'INAL', 'Importacion', 'Temporal', 'TADO', 30, 10000, 0, ARRAY['Nota finalidad','Compromiso reexportacion','Factura proforma','Certificado sanitario origen'], true),
('INAL-031', 'Ingreso Muestra Sin Valor', 'INAL', 'Importacion', 'Muestra', 'TADO', 15, 2000, 0, ARRAY['Nota solicitud','Factura proforma','Detalle de productos'], true),
('INAL-032', 'Aviso Importacion Alimentos', 'INAL', 'Importacion', 'Aviso', 'VUCE', 1, 0, 0, ARRAY['RNPA vigente','RNE vigente','Factura comercial','Packing list','Certificado sanitario origen'], true),
('INAL-033', 'Aviso Importacion Envases', 'INAL', 'Importacion', 'Aviso', 'VUCE', 1, 0, 0, ARRAY['Autorizacion envase vigente','Factura comercial','Packing list'], true),
('INAL-034', 'Aviso Importacion UPEI', 'INAL', 'Importacion', 'Aviso', 'VUCE', 1, 0, 0, ARRAY['RNE vigente','Factura comercial','Packing list','Certificado origen'], true),
('INAL-035', 'Importacion Consolidada Alimentos', 'INAL', 'Importacion', 'Consolidada', 'TADO', 30, 15000, 0, ARRAY['RNE vigente','Listado productos','Factura proforma','Certificado sanitario'], true),
('INAL-036', 'Importacion Consolidada Envases', 'INAL', 'Importacion', 'Consolidada', 'TADO', 30, 15000, 0, ARRAY['Autorizacion envases','Listado materiales','Factura proforma'], true),
('INAL-037', 'Inspeccion BPM Elaboradores', 'INAL', 'Inspeccion', 'BPM', 'TAD', 60, 444600, 0, ARRAY['RNE vigente','Manual BPM','Registros de produccion','POE actualizados'], true),
('INAL-038', 'Inspeccion HACCP', 'INAL', 'Inspeccion', 'HACCP', 'TAD', 60, 673200, 0, ARRAY['Plan HACCP','Registros PCC','Manual BPM','Procedimientos validacion'], true),
('INAL-039', 'Certificado Producto Exclusivo Exportar', 'INAL', 'Certificacion', 'Exportacion', 'TADO', 30, 15000, 0, ARRAY['RNPA vigente','Ficha tecnica','Requisitos pais destino'], true),
('INAL-040', 'Certificacion Export UE TRACES', 'INAL', 'Certificacion', 'Exportacion', 'TADO', 45, 20000, 0, ARRAY['RNPA vigente','RNE vigente','Requisitos UE','Analisis acreditado'], true),
('INAL-041', 'Inspeccion BPM Importadores', 'INAL', 'Inspeccion', 'BPM', 'TAD', 60, 300000, 0, ARRAY['RNE vigente','Manual BPM importador','Registros recepcion','Control temperatura'], true),
('INAL-042', 'Autorizacion Probioticos/Prebioticos', 'INAL', 'Autorizacion', 'Especial', 'TADO', 90, 35000, 0, ARRAY['Formula cualicuantitativa','Identificacion cepas','Estudios eficacia','Rotulo propuesto','CFS origen'], true),
('INAL-043', 'Autorizacion Alimentos Nuevos', 'INAL', 'Autorizacion', 'Especial', 'TADO', 120, 50000, 0, ARRAY['Dossier tecnico completo','Estudios seguridad','Evaluacion riesgo','Antecedentes regulatorios internacionales'], true),
('INAL-044', 'Informe Encadre Normativo CAA', 'INAL', 'Autorizacion', 'Consulta', 'TADO', 60, 25000, 0, ARRAY['Descripcion del producto','Ficha tecnica','Consulta especifica'], true),
('INAL-045', 'Extension Certificacion Vegana', 'INAL', 'Certificacion', 'Especial', 'TADO', 30, 15000, 0, ARRAY['RNPA vigente','Declaracion ingredientes','Certificado vegano del fabricante'], true),
('INAL-046', 'Rotulo Monitoreo PMI Importados', 'INAL', 'Autorizacion', 'Monitoreo', 'TADO', 20, 8000, 0, ARRAY['RNPA vigente','Rotulo actual','Rotulo propuesto'], true),
('INAL-047', 'Autorizacion Declaraciones Saludables', 'INAL', 'Autorizacion', 'Publicidad', 'TADO', 90, 40000, 0, ARRAY['RNPA vigente','Evidencia cientifica','Material publicitario propuesto','Estudios de respaldo'], true),
('INAL-048', 'Extension HACCP Suplementos', 'INAL', 'Certificacion', 'HACCP', 'TADO', 60, 30000, 0, ARRAY['Plan HACCP suplementos','Registros PCC','BPM vigente','Validacion procesos'], true),
('INAL-049', 'Baja RNE', 'INAL', 'RNE', 'Baja', 'TADO', 15, 0, 0, ARRAY['Nota solicitud de baja','RNE vigente'], true),
('INAL-050', 'Transferencia RNE', 'INAL', 'RNE', 'Transferencia', 'TADO', 90, 25000, 0, ARRAY['RNE vigente','Documentacion nuevo titular','Habilitacion municipal','Acuerdo transferencia'], true),
('INAL-051', 'Certificado Libre Circulacion Alimentos', 'INAL', 'Certificacion', 'Libre Circulacion', 'TADO', 30, 10000, 0, ARRAY['RNPA vigente','RNE vigente','Constancia CUIT'], true),
('INAL-052', 'Consulta Tecnica INAL', 'INAL', 'Autorizacion', 'Consulta', 'TADO', 30, 5000, 0, ARRAY['Nota de consulta','Documentacion de soporte'], true);

-- 4. SEED: ANMAT Productos Medicos (52 tipos)
INSERT INTO tramite_tipos (codigo, nombre, organismo, categoria, subcategoria, plataforma, plazo_dias, costo_organismo, honorarios, documentacion_obligatoria, activo) VALUES
('ANMAT-PM-001', 'Legajo Digital Importador/Elaborador PM', 'ANMAT', 'Productos Medicos', 'Legajo', 'TAD', 90, 60000, 0, ARRAY['Estatuto social','Poder representante legal','Constancia CUIT','DNI y titulo Director Tecnico','Habilitacion establecimiento','Certificado domicilio'], true),
('ANMAT-PM-002', 'Legajo + Ampliacion Rubro Clase I', 'ANMAT', 'Productos Medicos', 'Legajo', 'TAD', 90, 65000, 0, ARRAY['Estatuto social','Poder representante legal','Constancia CUIT','DNI y titulo Director Tecnico','Listado rubros Clase I'], true),
('ANMAT-PM-003', 'Legajo + Ampliacion Rubro Clase II', 'ANMAT', 'Productos Medicos', 'Legajo', 'TAD', 90, 70000, 0, ARRAY['Estatuto social','Poder representante legal','Constancia CUIT','DNI y titulo Director Tecnico','Listado rubros Clase II'], true),
('ANMAT-PM-004', 'Legajo + Ampliacion Rubro Clase III/IV', 'ANMAT', 'Productos Medicos', 'Legajo', 'TAD', 120, 80000, 0, ARRAY['Estatuto social','Poder representante legal','Constancia CUIT','DNI y titulo Director Tecnico','Listado rubros Clase III/IV','Justificacion tecnica'], true),
('ANMAT-PM-005', 'Habilitacion Deposito PM', 'ANMAT', 'Productos Medicos', 'Habilitacion', 'TAD', 60, 40000, 0, ARRAY['Plano del deposito','Habilitacion municipal','Procedimientos almacenamiento','Control ambiental'], true),
('ANMAT-PM-006', 'Habilitacion Deposito Clase I/II', 'ANMAT', 'Productos Medicos', 'Habilitacion', 'TAD', 60, 40000, 0, ARRAY['Plano del deposito','Habilitacion municipal','POE almacenamiento','Control temperatura'], true),
('ANMAT-PM-007', 'Habilitacion Deposito Clase III/IV', 'ANMAT', 'Productos Medicos', 'Habilitacion', 'TAD', 90, 50000, 0, ARRAY['Plano del deposito','Habilitacion municipal','POE almacenamiento','Control temperatura y humedad','Trazabilidad','Cuarentena'], true),
('ANMAT-PM-008', 'Designacion RT', 'ANMAT', 'Productos Medicos', 'Personal', 'TAD', 30, 15000, 0, ARRAY['DNI del RT','Titulo profesional','Matricula habilitante','CV','DDJJ incompatibilidad'], true),
('ANMAT-PM-009', 'Cambio RT Clase I/II', 'ANMAT', 'Productos Medicos', 'Personal', 'TAD', 30, 15000, 0, ARRAY['DNI del nuevo RT','Titulo profesional','Matricula','Nota renuncia RT anterior'], true),
('ANMAT-PM-010', 'Cambio RT Clase III/IV', 'ANMAT', 'Productos Medicos', 'Personal', 'TAD', 45, 20000, 0, ARRAY['DNI del nuevo RT','Titulo profesional','Matricula','Nota renuncia RT anterior','CV con experiencia PM III/IV'], true),
('ANMAT-PM-011', 'Registro PM Clase I', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 90, 45000, 0, ARRAY['Formulario Solicitud ANMAT','Certificado Libre Venta','Manual Usuario en espanol','Rotulo propuesto','DDJJ Fabricante','Poder del Importador'], true),
('ANMAT-PM-012', 'Registro PM Clase Im (medicion)', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 120, 50000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','Manual Usuario','Rotulo','Certificado calibracion','Trazabilidad metrologica'], true),
('ANMAT-PM-013', 'Registro PM Clase Is (esteril)', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 120, 55000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','Manual Usuario','Rotulo','Validacion esterilizacion','ISO 11135 o ISO 11137'], true),
('ANMAT-PM-014', 'Registro PM Clase IIa', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 120, 75000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','Certificado ISO 13485','Manual Usuario en espanol','IFU','Analisis de Riesgos','Ficha Tecnica'], true),
('ANMAT-PM-015', 'Registro PM Clase IIa con Software', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 150, 80000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','ISO 13485','IEC 62304','Validacion software','Manual Usuario','Analisis Riesgos'], true),
('ANMAT-PM-016', 'Registro PM Clase IIb', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 150, 120000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','ISO 13485','Certificado CE/FDA','Estudios pre-clinicos','Manual Usuario','Analisis Riesgos ISO 14971'], true),
('ANMAT-PM-017', 'Registro PM Clase III', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 180, 180000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','ISO 13485','Certificado CE/FDA','Estudios Clinicos','Biocompatibilidad ISO 10993','Analisis Riesgos ISO 14971'], true),
('ANMAT-PM-018', 'Registro PM Clase III Implantes', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 210, 210000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','ISO 13485','CE/FDA','Estudios Clinicos implante','Biocompatibilidad','Fatiga y degradacion','Seguimiento post-implante'], true),
('ANMAT-PM-019', 'Registro PM Clase IV', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 240, 220000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','ISO 13485','CE/FDA','Estudios Clinicos','Biocompatibilidad ISO 10993','Analisis Riesgos ISO 14971','Dossier tecnico completo'], true),
('ANMAT-PM-020', 'Modificacion Registro PM', 'ANMAT', 'Productos Medicos', 'Modificacion', 'TAD', 60, 29850, 0, ARRAY['Formulario Modificacion','Registro vigente','Justificacion del cambio','Documentacion de soporte'], true),
('ANMAT-PM-021', 'Modificacion Formula Clase I/II', 'ANMAT', 'Productos Medicos', 'Modificacion', 'TAD', 60, 29850, 0, ARRAY['Registro vigente','Nueva ficha tecnica','Justificacion del cambio','Analisis riesgos actualizado'], true),
('ANMAT-PM-022', 'Modificacion Clase III/IV', 'ANMAT', 'Productos Medicos', 'Modificacion', 'TAD', 90, 40000, 0, ARRAY['Registro vigente','Dossier actualizado','Justificacion del cambio','Estudios complementarios si aplica'], true),
('ANMAT-PM-023', 'Cambio BPF Fabricante', 'ANMAT', 'Productos Medicos', 'Modificacion', 'TAD', 90, 50000, 0, ARRAY['Registro vigente','Nuevo certificado BPF','Validacion transferencia','Estudios equivalencia'], true),
('ANMAT-PM-024', 'Renovacion Legajo Importador', 'ANMAT', 'Productos Medicos', 'Renovacion', 'TAD', 60, 30000, 0, ARRAY['Legajo vigente','Documentacion actualizada','Constancia CUIT vigente','DDJJ sin cambios'], true),
('ANMAT-PM-025', 'Renovacion Deposito', 'ANMAT', 'Productos Medicos', 'Renovacion', 'TAD', 45, 20000, 0, ARRAY['Habilitacion vigente','Inspeccion satisfactoria','DDJJ sin cambios estructurales'], true),
('ANMAT-PM-026', 'Revalidacion Registro Clase I/II', 'ANMAT', 'Productos Medicos', 'Renovacion', 'TAD', 60, 22500, 0, ARRAY['Registro vigente','CFS actualizado','DDJJ sin cambios','Declaracion conformidad vigente'], true),
('ANMAT-PM-027', 'Revalidacion Registro Clase III/IV', 'ANMAT', 'Productos Medicos', 'Renovacion', 'TAD', 90, 35000, 0, ARRAY['Registro vigente','CFS actualizado','Informe vigilancia posmercado','Certificado ISO 13485 vigente'], true),
('ANMAT-PM-028', 'Importacion Temporal PM', 'ANMAT', 'Productos Medicos', 'Importacion', 'TAD', 30, 15000, 0, ARRAY['Nota finalidad','Compromiso reexportacion','Factura proforma','Registro vigente si aplica'], true),
('ANMAT-PM-029', 'Ingreso Muestra Sin Valor PM', 'ANMAT', 'Productos Medicos', 'Importacion', 'TAD', 15, 3000, 0, ARRAY['Nota solicitud','Factura proforma','Detalle productos','Finalidad uso'], true),
('ANMAT-PM-030', 'Aviso Importacion por Operacion', 'ANMAT', 'Productos Medicos', 'Importacion', 'VUCE', 1, 0, 0, ARRAY['Registro vigente','Factura comercial','Packing list','Certificado lote'], true),
('ANMAT-PM-031', 'Importacion Clase I Sin Prescripcion', 'ANMAT', 'Productos Medicos', 'Importacion', 'TAD', 20, 10000, 0, ARRAY['Registro vigente','Factura comercial','Certificado lote','Rotulo aprobado'], true),
('ANMAT-PM-032', 'Lote Especifico Clase III/IV', 'ANMAT', 'Productos Medicos', 'Importacion', 'TAD', 45, 25000, 0, ARRAY['Registro vigente','Certificado lote fabricante','Protocolo analisis','Liberacion lote'], true),
('ANMAT-PM-033', 'Inspeccion Fabricante Extranjero', 'ANMAT', 'Productos Medicos', 'Inspeccion', 'TAD', 180, 800000, 0, ARRAY['Solicitud inspeccion','Dossier BPF fabricante','ISO 13485 vigente','Programa auditoria'], true),
('ANMAT-PM-034', 'Inspeccion Deposito Local', 'ANMAT', 'Productos Medicos', 'Inspeccion', 'TAD', 60, 200000, 0, ARRAY['Habilitacion vigente','POE actualizados','Registros trazabilidad','Control ambiental'], true),
('ANMAT-PM-035', 'Auditoria BPF Importador', 'ANMAT', 'Productos Medicos', 'Inspeccion', 'TAD', 90, 300000, 0, ARRAY['Legajo vigente','POE importacion','Registros recepcion','Sistema calidad'], true),
('ANMAT-PM-036', 'Habilitacion Fabricante Nacional PM', 'ANMAT', 'Productos Medicos', 'Habilitacion', 'TAD', 180, 500000, 0, ARRAY['Plano completo','Manual calidad','ISO 13485','BPF implementado','Validacion procesos','Sala limpia si aplica'], true),
('ANMAT-PM-037', 'Ampliacion Rubro Fabricante Clase I', 'ANMAT', 'Productos Medicos', 'Habilitacion', 'TAD', 90, 100000, 0, ARRAY['Habilitacion vigente','Descripcion nuevo rubro','Validacion procesos','POE actualizados'], true),
('ANMAT-PM-038', 'Certificado BPF Fabricante Extranjero', 'ANMAT', 'Productos Medicos', 'Certificacion', 'TAD', 180, 1200000, 0, ARRAY['Solicitud certificacion','Dossier BPF completo','ISO 13485','Historial inspecciones','Programa auditoria remota'], true),
('ANMAT-PM-039', 'Certificado Libre Comercializacion', 'ANMAT', 'Productos Medicos', 'Certificacion', 'TAD', 30, 20000, 0, ARRAY['Registro vigente','Nota solicitud','Constancia CUIT'], true),
('ANMAT-PM-040', 'Certificado BPF Exportacion', 'ANMAT', 'Productos Medicos', 'Certificacion', 'TAD', 60, 50000, 0, ARRAY['Habilitacion vigente','Ultima inspeccion BPF','Listado productos','Pais destino'], true),
('ANMAT-PM-041', 'Constancia Trazabilidad PM', 'ANMAT', 'Productos Medicos', 'Certificacion', 'TAD', 15, 5000, 0, ARRAY['Registro vigente','Numero serie/lote','Sistema trazabilidad Helena'], true),
('ANMAT-PM-042', 'Testimonio Exportacion PM', 'ANMAT', 'Productos Medicos', 'Certificacion', 'TAD', 30, 15000, 0, ARRAY['Registro vigente','Factura exportacion','Pais destino','Datos del producto'], true),
('ANMAT-PM-043', 'Transferencia Titularidad Registro', 'ANMAT', 'Productos Medicos', 'Transferencia', 'TAD', 60, 115000, 0, ARRAY['Registro vigente','Legajo nuevo titular','Acuerdo transferencia','Poder representante'], true),
('ANMAT-PM-044', 'Transferencia Fusion/Empresa', 'ANMAT', 'Productos Medicos', 'Transferencia', 'TAD', 90, 150000, 0, ARRAY['Registro vigente','Acta fusion','Nuevo estatuto','Legajo empresa resultante'], true),
('ANMAT-PM-045', 'Notificacion Evento Adverso PM', 'ANMAT', 'Productos Medicos', 'Tecnovigilancia', 'TAD', 3, 0, 0, ARRAY['Formulario evento adverso','Descripcion del evento','Datos del producto','Datos del paciente anonimizados'], true),
('ANMAT-PM-046', 'Plan Vigilancia Posmercado Clase III', 'ANMAT', 'Productos Medicos', 'Tecnovigilancia', 'TAD', 365, 30000, 0, ARRAY['Registro vigente','Plan vigilancia','Informe periodico','Analisis tendencias'], true),
('ANMAT-PM-047', 'Retiro/Correccion Mercado PM', 'ANMAT', 'Productos Medicos', 'Tecnovigilancia', 'TAD', 1, 0, 0, ARRAY['Notificacion retiro','Evaluacion riesgo','Plan comunicacion','Listado lotes afectados'], true),
('ANMAT-PM-048', 'Consulta Previa Registro', 'ANMAT', 'Productos Medicos', 'Consulta', 'TAD', 30, 10000, 0, ARRAY['Descripcion del producto','Clasificacion propuesta','Documentacion preliminar'], true),
('ANMAT-PM-049', 'Modificacion Codigo QR Prospecto PM', 'ANMAT', 'Productos Medicos', 'Modificacion', 'TAD', 20, 8000, 0, ARRAY['Registro vigente','Nuevo QR propuesto','Contenido digital actualizado'], true),
('ANMAT-PM-050', 'Autorizacion Donacion PM Usados', 'ANMAT', 'Productos Medicos', 'Autorizacion', 'TAD', 15, 5000, 0, ARRAY['Nota solicitud','Listado equipos','Estado funcional','Entidad receptora'], true),
('ANMAT-PM-051', 'Cancelacion Registro PM', 'ANMAT', 'Productos Medicos', 'Baja', 'TAD', 30, 10000, 0, ARRAY['Nota solicitud baja','Registro vigente','Justificacion'], true),
('ANMAT-PM-052', 'Registro PM IVD Diagnostico In Vitro', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 150, 90000, 0, ARRAY['Formulario Solicitud ANMAT IVD','CFS','ISO 13485','Estudios Performance Analitica','Estudios Estabilidad','Instrucciones de Uso'], true);

-- 5. Verify
SELECT organismo, count(*) as total FROM tramite_tipos GROUP BY organismo ORDER BY organismo;

-- 6. Reload schema cache
NOTIFY pgrst, 'reload schema';
