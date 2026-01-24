/*
  # Phase 3A: Medium Priority Procedures - INAL & ANMAT

  1. Purpose
    - Insert medium priority regulatory procedures from 2025 catalog
    - Focus on INAL and ANMAT (PM, Cosmetics, Domisanitarios) organisms
    - Part 1 of medium priority procedure insertion

  2. Procedures Added
    - **INAL Medium Priority** (10 procedures): CLV, modifications, inspections
    - **ANMAT PM Medium Priority** (12 procedures): Class II/III modifications, renewals
    - **ANMAT Cosmetics Medium Priority** (8 procedures): Grade 2 modifications
    - **ANMAT Domisanitarios Medium Priority** (8 procedures): Risk IIA/IIB modifications

  3. Total: 38 medium priority procedures across 4 organisms
*/

-- INAL MEDIUM PRIORITY (10)
INSERT INTO tramite_tipos (
  id, codigo, codigo_oficial, nombre, organismo_id, rubro, subcategoria,
  base_legal, sla_total_dias, costo_base_2025,
  plataforma_gestion, documentacion_obligatoria, logica_especial, prioridad
) VALUES
('TT-INAL-011', 'INAL-CERT-CLV', '4055', 'Certificado Libre Venta (CLV)', 'INAL', 'Certificaciones', 'Exportación',
  ARRAY['Disp INAL'], 15, 8000, 'TADO', ARRAY['RNPA vigente', 'Factura proforma', 'Nota destino'], 'Por producto', 'media'),
('TT-INAL-012', 'INAL-MOD-RS', '4056', 'Modificación razón social RNPA', 'INAL', 'RNPA', 'Modificación',
  ARRAY['CAA'], 45, NULL, 'TADO', ARRAY['Acta societaria', 'Publicación edictos', 'Inscripción IGJ/DPPJ'], 'Todos productos', 'media'),
('TT-INAL-013', 'INAL-MOD-DOM', '4057', 'Modificación domicilio legal RNPA', 'INAL', 'RNPA', 'Modificación',
  ARRAY['CAA'], 30, NULL, 'TADO', ARRAY['Nota nueva dirección', 'Constancia AFIP'], 'Sin inspección', 'media'),
('TT-INAL-014', 'INAL-BAJA-001', '4058', 'Baja producto RNPA', 'INAL', 'RNPA', 'Baja',
  ARRAY['CAA'], 20, NULL, 'TADO', ARRAY['Nota solicitud baja', 'Motivo'], 'Irreversible', 'media'),
('TT-INAL-015', 'INAL-MOD-ING', '4059', 'Modificación ingredientes menores RNPA', 'INAL', 'RNPA', 'Modificación',
  ARRAY['CAA'], 45, NULL, 'TADO', ARRAY['Ficha técnica actualizada', 'Declaración cambios', 'Análisis actualizado'], 'Sin cambio tech', 'media'),
('TT-INAL-016', 'INAL-INSP-RNE', '4060', 'Inspección programada RNE', 'INAL', 'RNE', 'Inspección',
  ARRAY['CAA'], NULL, 25000, 'Inspecciones', ARRAY['Disponibilidad personal', 'Documentación actualizada'], 'Cada 2-3 años', 'media'),
('TT-INAL-017', 'INAL-MOD-POE', '4061', 'Actualización POE RNE', 'INAL', 'RNE', 'Modificación',
  ARRAY['CAA'], 30, NULL, 'TADO', ARRAY['POE nuevos firmados DT', 'Nota cambios'], 'Sin cambio struct', 'media'),
('TT-INAL-018', 'INAL-RENOV-DT', '4062', 'Renovación matrícula DT', 'INAL', 'RNE', 'Personal',
  ARRAY['CAA'], 15, 5000, 'TADO', ARRAY['Matrícula vigente', 'Constancia colegio'], 'Anual', 'media'),
('TT-INAL-019', 'INAL-IMP-MUE', '4063', 'Autorización muestras sin valor comercial', 'INAL', 'Importación', 'Temporal',
  ARRAY['CAA'], 20, 5000, 'TADO', ARRAY['Nota finalidad', 'Declaración no comercialización', 'Factura proforma'], 'Max 100 unidades', 'media'),
('TT-INAL-020', 'INAL-CONS-001', '4064', 'Consulta pre-evaluación producto nuevo', 'INAL', 'Consultas', 'Técnica',
  ARRAY['CAA'], 30, NULL, 'TADO', ARRAY['Ficha técnica preliminar', 'Composición', 'Uso previsto'], 'No vinculante', 'media'),

-- ANMAT PM MEDIUM PRIORITY (12)
('TT-ANMAT-PM-011', 'PM-MOD-CL2', '4200', 'Registro Clase II modificación menor', 'ANMAT_PM', 'Productos Médicos', 'Mod Clase II',
  ARRAY['Disp 2318/2002'], 90, 45000, 'TADO', ARRAY['Registro vigente', 'Nota cambios', 'Evidencia técnica'], 'Sin cambio uso', 'media'),
('TT-ANMAT-PM-012', 'PM-MOD-CL3', '4201', 'Registro Clase III modificación menor', 'ANMAT_PM', 'Productos Médicos', 'Mod Clase III',
  ARRAY['Disp 2318/2002'], 120, 75000, 'TADO', ARRAY['Registro vigente', 'Nota cambios', 'Evidencia técnica', 'Evaluación riesgo'], 'Sin cambio uso', 'media'),
('TT-ANMAT-PM-013', 'PM-REN-CL1', '4202', 'Renovación registro Clase I', 'ANMAT_PM', 'Productos Médicos', 'Renov Clase I',
  ARRAY['Disp 2318/2002'], 60, 15000, 'TADO', ARRAY['Registro vigente', 'Declaración comercialización', 'Certificado vigencia fabricante'], 'Cada 5 años', 'media'),
('TT-ANMAT-PM-014', 'PM-REN-CL2', '4203', 'Renovación registro Clase II', 'ANMAT_PM', 'Productos Médicos', 'Renov Clase II',
  ARRAY['Disp 2318/2002'], 90, 35000, 'TADO', ARRAY['Registro vigente', 'Declaración comercialización', 'Certificado vigencia fabricante', 'Reportes PMS'], 'Cada 5 años', 'media'),
('TT-ANMAT-PM-015', 'PM-TRANS-001', '4204', 'Cambio titular registro PM', 'ANMAT_PM', 'Productos Médicos', 'Transferencia',
  ARRAY['Disp 2318/2002'], 120, 50000, 'TADO', ARRAY['Acuerdo transferencia', 'Legajo nuevo titular', 'Registro vigente'], 'Mantiene clase', 'media'),
('TT-ANMAT-PM-016', 'PM-IMP-EXC', '4205', 'Importación excepcional PM', 'ANMAT_PM', 'Productos Médicos', 'Importación',
  ARRAY['Disp 2318/2002'], 45, 20000, 'TADO', ARRAY['Nota médico tratante', 'Historia clínica', 'Justificación técnica', 'CFS origen'], 'Uso individual', 'media'),
('TT-ANMAT-PM-017', 'PM-CERT-EXP', '4206', 'Certificado exportación PM', 'ANMAT_PM', 'Productos Médicos', 'Certificación',
  ARRAY['Disp 2318/2002'], 30, 12000, 'TADO', ARRAY['Registro PM vigente', 'Factura proforma', 'Nota destino'], 'Por producto', 'media'),
('TT-ANMAT-PM-018', 'PM-MOD-ETI', '4207', 'Modificación etiquetado PM', 'ANMAT_PM', 'Productos Médicos', 'Modificación',
  ARRAY['Disp 2318/2002'], 60, 25000, 'TADO', ARRAY['Etiquetas nuevas', 'Justificación cambios', 'Registro vigente'], 'Req evaluación', 'media'),
('TT-ANMAT-PM-019', 'PM-AMP-PRES', '4208', 'Ampliación presentaciones PM', 'ANMAT_PM', 'Productos Médicos', 'Modificación',
  ARRAY['Disp 2318/2002'], 90, 30000, 'TADO', ARRAY['Registro vigente', 'Especificaciones nuevas presentaciones', 'Etiquetas'], 'Mismo fabricante', 'media'),
('TT-ANMAT-PM-020', 'PM-INSP-001', '4209', 'Inspección establecimiento PM', 'ANMAT_PM', 'Productos Médicos', 'Inspección',
  ARRAY['Disp 2318/2002'], NULL, 80000, 'Inspecciones', ARRAY['Personal disponible', 'Documentación BPF', 'Sistema calidad'], 'Programada/trámite', 'media'),
('TT-ANMAT-PM-021', 'PM-BAJA-001', '4210', 'Baja registro PM', 'ANMAT_PM', 'Productos Médicos', 'Baja',
  ARRAY['Disp 2318/2002'], 30, NULL, 'TADO', ARRAY['Nota solicitud', 'Registro vigente', 'Declaración stock'], 'Irreversible', 'media'),
('TT-ANMAT-PM-022', 'PM-CONS-001', '4211', 'Consulta técnica PM', 'ANMAT_PM', 'Productos Médicos', 'Consulta',
  ARRAY['Disp 2318/2002'], 45, NULL, 'TADO', ARRAY['Descripción técnica', 'Uso previsto', 'Documentación técnica'], 'Orientativa', 'media'),

-- ANMAT COSMETICS MEDIUM PRIORITY (8)
('TT-ANMAT-COSM-011', 'COSM-MOD-G2', '4300', 'Modificación Grado 2 menor', 'ANMAT', 'Cosméticos', 'Mod Grado 2',
  ARRAY['Disp 3773/2004'], 60, 20000, 'TADO', ARRAY['Registro vigente', 'Nota cambios', 'Documentación técnica actualizada'], 'Sin cambio formula', 'media'),
('TT-ANMAT-COSM-012', 'COSM-REN-G2', '4301', 'Renovación Grado 2', 'ANMAT', 'Cosméticos', 'Renov Grado 2',
  ARRAY['Disp 3773/2004'], 60, 25000, 'TADO', ARRAY['Registro vigente', 'Declaración comercialización', 'Certificado fabricante'], 'Cada 5 años', 'media'),
('TT-ANMAT-COSM-013', 'COSM-CERT-EXP', '4302', 'Certificado exportación cosméticos', 'ANMAT', 'Cosméticos', 'Certificación',
  ARRAY['Disp 3773/2004'], 20, 8000, 'TADO', ARRAY['Registro/notificación vigente', 'Factura proforma', 'Nota destino'], 'Grado 1 y 2', 'media'),
('TT-ANMAT-COSM-014', 'COSM-TRANS', '4303', 'Cambio titular cosméticos', 'ANMAT', 'Cosméticos', 'Transferencia',
  ARRAY['Disp 3773/2004'], 90, 30000, 'TADO', ARRAY['Acuerdo transferencia', 'Legajo nuevo titular', 'Producto vigente'], 'Grado 1 y 2', 'media'),
('TT-ANMAT-COSM-015', 'COSM-BAJA', '4304', 'Baja producto cosmético', 'ANMAT', 'Cosméticos', 'Baja',
  ARRAY['Disp 3773/2004'], 20, NULL, 'TADO', ARRAY['Nota solicitud', 'Producto vigente'], 'Irreversible', 'media'),
('TT-ANMAT-COSM-016', 'COSM-INSP', '4305', 'Inspección establecimiento cosméticos', 'ANMAT', 'Cosméticos', 'Inspección',
  ARRAY['Disp 3773/2004'], NULL, 45000, 'Inspecciones', ARRAY['Personal disponible', 'BPF', 'Control calidad'], 'Programada', 'media'),
('TT-ANMAT-COSM-017', 'COSM-MOD-ETI', '4306', 'Modificación etiquetado cosméticos', 'ANMAT', 'Cosméticos', 'Modificación',
  ARRAY['Disp 3773/2004'], 45, 15000, 'TADO', ARRAY['Etiquetas nuevas', 'Producto vigente', 'Justificación'], 'Sin cambio formula', 'media'),
('TT-ANMAT-COSM-018', 'COSM-AMP-PRES', '4307', 'Ampliación presentaciones cosméticos', 'ANMAT', 'Cosméticos', 'Modificación',
  ARRAY['Disp 3773/2004'], 60, 18000, 'TADO', ARRAY['Producto vigente', 'Especificaciones presentaciones', 'Etiquetas'], 'Mismo fabricante', 'media'),

-- ANMAT DOMISANITARIOS MEDIUM PRIORITY (8)
('TT-ANMAT-DOM-011', 'DOM-MOD-IIA', '4400', 'Modificación Riesgo IIA menor', 'ANMAT', 'Domisanitarios', 'Mod Riesgo IIA',
  ARRAY['Disp 4731/2005'], 60, 22000, 'TADO', ARRAY['Registro vigente', 'Nota cambios', 'Documentación técnica'], 'Sin cambio PA', 'media'),
('TT-ANMAT-DOM-012', 'DOM-MOD-IIB', '4401', 'Modificación Riesgo IIB menor', 'ANMAT', 'Domisanitarios', 'Mod Riesgo IIB',
  ARRAY['Disp 4731/2005'], 90, 35000, 'TADO', ARRAY['Registro vigente', 'Nota cambios', 'Documentación técnica', 'Estudios eficacia'], 'Sin cambio PA', 'media'),
('TT-ANMAT-DOM-013', 'DOM-REN-R1', '4402', 'Renovación Riesgo I', 'ANMAT', 'Domisanitarios', 'Renov Riesgo I',
  ARRAY['Disp 4731/2005'], 30, 10000, 'TADO', ARRAY['Notificación vigente', 'Declaración comercialización'], 'Cada 5 años', 'media'),
('TT-ANMAT-DOM-014', 'DOM-REN-R2A', '4403', 'Renovación Riesgo IIA', 'ANMAT', 'Domisanitarios', 'Renov Riesgo IIA',
  ARRAY['Disp 4731/2005'], 60, 20000, 'TADO', ARRAY['Registro vigente', 'Declaración comercialización', 'Certificado fabricante'], 'Cada 5 años', 'media'),
('TT-ANMAT-DOM-015', 'DOM-CERT-EXP', '4404', 'Certificado exportación domisanitarios', 'ANMAT', 'Domisanitarios', 'Certificación',
  ARRAY['Disp 4731/2005'], 20, 8000, 'TADO', ARRAY['Registro/notificación vigente', 'Factura proforma', 'Nota destino'], 'Todos riesgos', 'media'),
('TT-ANMAT-DOM-016', 'DOM-TRANS', '4405', 'Cambio titular domisanitarios', 'ANMAT', 'Domisanitarios', 'Transferencia',
  ARRAY['Disp 4731/2005'], 90, 30000, 'TADO', ARRAY['Acuerdo transferencia', 'Legajo nuevo titular', 'Producto vigente'], 'Todos riesgos', 'media'),
('TT-ANMAT-DOM-017', 'DOM-BAJA', '4406', 'Baja producto domisanitario', 'ANMAT', 'Domisanitarios', 'Baja',
  ARRAY['Disp 4731/2005'], 20, NULL, 'TADO', ARRAY['Nota solicitud', 'Producto vigente'], 'Irreversible', 'media'),
('TT-ANMAT-DOM-018', 'DOM-INSP', '4407', 'Inspección establecimiento domisanitarios', 'ANMAT', 'Domisanitarios', 'Inspección',
  ARRAY['Disp 4731/2005'], NULL, 50000, 'Inspecciones', ARRAY['Personal disponible', 'BPF', 'Control calidad'], 'Programada', 'media');
