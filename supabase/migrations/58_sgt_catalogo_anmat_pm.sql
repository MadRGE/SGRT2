-- CAPA 2: ANMAT - Productos Medicos (52 tipos)
-- Ejecutar en Supabase SQL Editor

INSERT INTO tramite_tipos (codigo, nombre, organismo, categoria, subcategoria, plataforma, plazo_dias, costo_organismo, honorarios, documentacion_obligatoria, activo) VALUES
-- Legajos de Empresa (4)
('ANMAT-PM-001', 'Legajo Digital Importador/Elaborador PM', 'ANMAT', 'Productos Medicos', 'Legajo', 'TAD', 90, 60000, 0, ARRAY['Estatuto social','Poder representante legal','Constancia CUIT','DNI y titulo Director Tecnico','Habilitacion establecimiento','Certificado domicilio'], true),
('ANMAT-PM-002', 'Legajo + Ampliacion Rubro Clase I', 'ANMAT', 'Productos Medicos', 'Legajo', 'TAD', 90, 65000, 0, ARRAY['Estatuto social','Poder representante legal','Constancia CUIT','DNI y titulo Director Tecnico','Listado rubros Clase I'], true),
('ANMAT-PM-003', 'Legajo + Ampliacion Rubro Clase II', 'ANMAT', 'Productos Medicos', 'Legajo', 'TAD', 90, 70000, 0, ARRAY['Estatuto social','Poder representante legal','Constancia CUIT','DNI y titulo Director Tecnico','Listado rubros Clase II'], true),
('ANMAT-PM-004', 'Legajo + Ampliacion Rubro Clase III/IV', 'ANMAT', 'Productos Medicos', 'Legajo', 'TAD', 120, 80000, 0, ARRAY['Estatuto social','Poder representante legal','Constancia CUIT','DNI y titulo Director Tecnico','Listado rubros Clase III/IV','Justificacion tecnica'], true),
-- Habilitaciones Deposito (3)
('ANMAT-PM-005', 'Habilitacion Deposito PM', 'ANMAT', 'Productos Medicos', 'Habilitacion', 'TAD', 60, 40000, 0, ARRAY['Plano del deposito','Habilitacion municipal','Procedimientos almacenamiento','Control ambiental'], true),
('ANMAT-PM-006', 'Habilitacion Deposito Clase I/II', 'ANMAT', 'Productos Medicos', 'Habilitacion', 'TAD', 60, 40000, 0, ARRAY['Plano del deposito','Habilitacion municipal','POE almacenamiento','Control temperatura'], true),
('ANMAT-PM-007', 'Habilitacion Deposito Clase III/IV', 'ANMAT', 'Productos Medicos', 'Habilitacion', 'TAD', 90, 50000, 0, ARRAY['Plano del deposito','Habilitacion municipal','POE almacenamiento','Control temperatura y humedad','Trazabilidad','Cuarentena'], true),
-- Responsables Tecnicos (3)
('ANMAT-PM-008', 'Designacion RT', 'ANMAT', 'Productos Medicos', 'Personal', 'TAD', 30, 15000, 0, ARRAY['DNI del RT','Titulo profesional','Matricula habilitante','CV','DDJJ incompatibilidad'], true),
('ANMAT-PM-009', 'Cambio RT Clase I/II', 'ANMAT', 'Productos Medicos', 'Personal', 'TAD', 30, 15000, 0, ARRAY['DNI del nuevo RT','Titulo profesional','Matricula','Nota renuncia RT anterior'], true),
('ANMAT-PM-010', 'Cambio RT Clase III/IV', 'ANMAT', 'Productos Medicos', 'Personal', 'TAD', 45, 20000, 0, ARRAY['DNI del nuevo RT','Titulo profesional','Matricula','Nota renuncia RT anterior','CV con experiencia PM III/IV'], true),
-- Registros por Clase (9)
('ANMAT-PM-011', 'Registro PM Clase I', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 90, 45000, 0, ARRAY['Formulario Solicitud ANMAT','Certificado Libre Venta (CFS)','Manual Usuario en espanol','Rotulo propuesto','Declaracion Jurada Fabricante','Poder del Importador'], true),
('ANMAT-PM-012', 'Registro PM Clase Im (medicion)', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 120, 50000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','Manual Usuario','Rotulo','Certificado calibracion','Trazabilidad metrologica'], true),
('ANMAT-PM-013', 'Registro PM Clase Is (esteril)', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 120, 55000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','Manual Usuario','Rotulo','Validacion esterilizacion','ISO 11135 o ISO 11137'], true),
('ANMAT-PM-014', 'Registro PM Clase IIa', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 120, 75000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','Certificado ISO 13485','Manual Usuario en espanol','Instrucciones de Uso (IFU)','Analisis de Riesgos','Ficha Tecnica'], true),
('ANMAT-PM-015', 'Registro PM Clase IIa con Software', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 150, 80000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','ISO 13485','IEC 62304 ciclo vida software','Validacion software','Manual Usuario','Analisis Riesgos'], true),
('ANMAT-PM-016', 'Registro PM Clase IIb', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 150, 120000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','ISO 13485','Certificado CE/FDA','Estudios pre-clinicos','Manual Usuario','Analisis Riesgos ISO 14971'], true),
('ANMAT-PM-017', 'Registro PM Clase III', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 180, 180000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','ISO 13485','Certificado CE/FDA','Estudios Clinicos','Biocompatibilidad ISO 10993','Analisis Riesgos ISO 14971'], true),
('ANMAT-PM-018', 'Registro PM Clase III Implantes', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 210, 210000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','ISO 13485','CE/FDA','Estudios Clinicos implante','Biocompatibilidad','Fatiga y degradacion','Seguimiento post-implante'], true),
('ANMAT-PM-019', 'Registro PM Clase IV', 'ANMAT', 'Productos Medicos', 'Registro', 'TAD', 240, 220000, 0, ARRAY['Formulario Solicitud ANMAT','CFS','ISO 13485','CE/FDA','Estudios Clinicos','Biocompatibilidad ISO 10993','Analisis Riesgos ISO 14971','Dossier tecnico completo'], true),
-- Modificaciones y Renovaciones (8)
('ANMAT-PM-020', 'Modificacion Registro PM', 'ANMAT', 'Productos Medicos', 'Modificacion', 'TAD', 60, 29850, 0, ARRAY['Formulario Modificacion','Registro vigente','Justificacion del cambio','Documentacion de soporte'], true),
('ANMAT-PM-021', 'Modificacion Formula Clase I/II', 'ANMAT', 'Productos Medicos', 'Modificacion', 'TAD', 60, 29850, 0, ARRAY['Registro vigente','Nueva ficha tecnica','Justificacion del cambio','Analisis riesgos actualizado'], true),
('ANMAT-PM-022', 'Modificacion Clase III/IV', 'ANMAT', 'Productos Medicos', 'Modificacion', 'TAD', 90, 40000, 0, ARRAY['Registro vigente','Dossier actualizado','Justificacion del cambio','Estudios complementarios si aplica'], true),
('ANMAT-PM-023', 'Cambio BPF Fabricante', 'ANMAT', 'Productos Medicos', 'Modificacion', 'TAD', 90, 50000, 0, ARRAY['Registro vigente','Nuevo certificado BPF','Validacion transferencia','Estudios equivalencia'], true),
('ANMAT-PM-024', 'Renovacion Legajo Importador', 'ANMAT', 'Productos Medicos', 'Renovacion', 'TAD', 60, 30000, 0, ARRAY['Legajo vigente','Documentacion actualizada','Constancia CUIT vigente','DDJJ sin cambios'], true),
('ANMAT-PM-025', 'Renovacion Deposito', 'ANMAT', 'Productos Medicos', 'Renovacion', 'TAD', 45, 20000, 0, ARRAY['Habilitacion vigente','Inspeccion satisfactoria','DDJJ sin cambios estructurales'], true),
('ANMAT-PM-026', 'Revalidacion Registro Clase I/II', 'ANMAT', 'Productos Medicos', 'Renovacion', 'TAD', 60, 22500, 0, ARRAY['Registro vigente','CFS actualizado','DDJJ sin cambios','Declaracion conformidad vigente'], true),
('ANMAT-PM-027', 'Revalidacion Registro Clase III/IV', 'ANMAT', 'Productos Medicos', 'Renovacion', 'TAD', 90, 35000, 0, ARRAY['Registro vigente','CFS actualizado','Informe vigilancia posmercado','Certificado ISO 13485 vigente'], true),
-- Importaciones (5)
('ANMAT-PM-028', 'Autorizacion Importacion Temporal PM', 'ANMAT', 'Productos Medicos', 'Importacion', 'TAD', 30, 15000, 0, ARRAY['Nota finalidad','Compromiso reexportacion','Factura proforma','Registro vigente si aplica'], true),
('ANMAT-PM-029', 'Ingreso Muestra Sin Valor PM', 'ANMAT', 'Productos Medicos', 'Importacion', 'TAD', 15, 3000, 0, ARRAY['Nota solicitud','Factura proforma','Detalle productos','Finalidad uso'], true),
('ANMAT-PM-030', 'Aviso Importacion por Operacion', 'ANMAT', 'Productos Medicos', 'Importacion', 'VUCE', 1, 0, 0, ARRAY['Registro vigente','Factura comercial','Packing list','Certificado lote'], true),
('ANMAT-PM-031', 'Importacion Clase I Sin Prescripcion', 'ANMAT', 'Productos Medicos', 'Importacion', 'TAD', 20, 10000, 0, ARRAY['Registro vigente','Factura comercial','Certificado lote','Rotulo aprobado'], true),
('ANMAT-PM-032', 'Autorizacion Lote Especifico Clase III/IV', 'ANMAT', 'Productos Medicos', 'Importacion', 'TAD', 45, 25000, 0, ARRAY['Registro vigente','Certificado lote fabricante','Protocolo analisis','Liberacion lote'], true),
-- Inspecciones y Auditorias (6)
('ANMAT-PM-033', 'Inspeccion Fabricante Extranjero', 'ANMAT', 'Productos Medicos', 'Inspeccion', 'TAD', 180, 800000, 0, ARRAY['Solicitud inspeccion','Dossier BPF fabricante','ISO 13485 vigente','Programa auditoria'], true),
('ANMAT-PM-034', 'Inspeccion Deposito Local', 'ANMAT', 'Productos Medicos', 'Inspeccion', 'TAD', 60, 200000, 0, ARRAY['Habilitacion vigente','POE actualizados','Registros trazabilidad','Control ambiental'], true),
('ANMAT-PM-035', 'Auditoria BPF Importador', 'ANMAT', 'Productos Medicos', 'Inspeccion', 'TAD', 90, 300000, 0, ARRAY['Legajo vigente','POE importacion','Registros recepcion','Sistema calidad'], true),
('ANMAT-PM-036', 'Habilitacion Establecimiento Fabricante Nacional PM', 'ANMAT', 'Productos Medicos', 'Habilitacion', 'TAD', 180, 500000, 0, ARRAY['Plano completo','Manual calidad','ISO 13485','BPF implementado','Validacion procesos','Sala limpia si aplica'], true),
('ANMAT-PM-037', 'Ampliacion Rubro Fabricante Clase I', 'ANMAT', 'Productos Medicos', 'Habilitacion', 'TAD', 90, 100000, 0, ARRAY['Habilitacion vigente','Descripcion nuevo rubro','Validacion procesos','POE actualizados'], true),
('ANMAT-PM-038', 'Certificado BPF Fabricante Extranjero', 'ANMAT', 'Productos Medicos', 'Certificacion', 'TAD', 180, 1200000, 0, ARRAY['Solicitud certificacion','Dossier BPF completo','ISO 13485','Historial inspecciones','Programa auditoria remota'], true),
-- Certificaciones (4)
('ANMAT-PM-039', 'Certificado Libre Comercializacion', 'ANMAT', 'Productos Medicos', 'Certificacion', 'TAD', 30, 20000, 0, ARRAY['Registro vigente','Nota solicitud','Constancia CUIT'], true),
('ANMAT-PM-040', 'Certificado BPF Exportacion', 'ANMAT', 'Productos Medicos', 'Certificacion', 'TAD', 60, 50000, 0, ARRAY['Habilitacion vigente','Ultima inspeccion BPF','Listado productos','Pais destino'], true),
('ANMAT-PM-041', 'Constancia Trazabilidad PM', 'ANMAT', 'Productos Medicos', 'Certificacion', 'TAD', 15, 5000, 0, ARRAY['Registro vigente','Numero serie/lote','Sistema trazabilidad Helena'], true),
('ANMAT-PM-042', 'Testimonio Exportacion PM', 'ANMAT', 'Productos Medicos', 'Certificacion', 'TAD', 30, 15000, 0, ARRAY['Registro vigente','Factura exportacion','Pais destino','Datos del producto'], true),
-- Otros Tramites (10)
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

-- Verificacion
SELECT organismo, categoria, count(*) as total FROM tramite_tipos WHERE organismo = 'ANMAT' GROUP BY organismo, categoria;
