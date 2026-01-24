/*
  # Phase 3B: Medium Priority Procedures - SENASA, INTI, Others

  1. Purpose
    - Insert medium priority regulatory procedures from 2025 catalog
    - Focus on SENASA, INTI, SEDRONAR, CITES, INASE, SIC organisms
    - Part 2 of medium priority procedure insertion

  2. Procedures Added
    - **SENASA Medium Priority** (25 procedures): Feed registrations, inspections, certifications
    - **INTI Medium Priority** (15 procedures): Metrological verifications, technical certifications
    - **SEDRONAR Medium Priority** (5 procedures): RENPRE modifications, reports
    - **CITES Medium Priority** (4 procedures): Authorizations, permits
    - **INASE Medium Priority** (5 procedures): Seed certifications
    - **SIC Medium Priority** (6 procedures): Safety certificates, LCM

  3. Total: 60 medium priority procedures across 6 organisms
*/

-- SENASA MEDIUM PRIORITY (25)
INSERT INTO tramite_tipos (
  id, codigo, codigo_oficial, nombre, organismo_id, rubro, subcategoria,
  base_legal, sla_total_dias, costo_base_2025,
  plataforma_gestion, documentacion_obligatoria, logica_especial, prioridad
) VALUES
('TT-SENASA-011', 'SENASA-FEED-01', '5100', 'Registro producto Feed nacional', 'SENASA', 'Feed Animal', 'Registro Nacional',
  ARRAY['Res SENASA'], 90, 35000, 'VUCE', ARRAY['Ficha técnica', 'Análisis', 'Certificado fabricante'], 'Producto local', 'media'),
('TT-SENASA-012', 'SENASA-FEED-02', '5101', 'Registro producto Feed importado', 'SENASA', 'Feed Animal', 'Registro Importado',
  ARRAY['Res SENASA'], 120, 45000, 'VUCE', ARRAY['Ficha técnica', 'Análisis', 'CFS origen', 'RPA'], 'Producto externo', 'media'),
('TT-SENASA-013', 'SENASA-FEED-03', '5102', 'Renovación registro Feed', 'SENASA', 'Feed Animal', 'Renovación',
  ARRAY['Res SENASA'], 60, 25000, 'VUCE', ARRAY['Registro vigente', 'Declaración comercialización'], 'Cada 5 años', 'media'),
('TT-SENASA-014', 'SENASA-SUPL-01', '5103', 'Registro suplemento dietario animal', 'SENASA', 'Suplementos', 'Registro',
  ARRAY['Res SENASA'], 90, 40000, 'VUCE', ARRAY['Ficha técnica', 'Análisis', 'Estudios seguridad'], 'Con principios', 'media'),
('TT-SENASA-015', 'SENASA-FERT-01', '5104', 'Registro fertilizante', 'SENASA', 'Fertilizantes', 'Registro',
  ARRAY['Res SENASA'], 90, 38000, 'VUCE', ARRAY['Ficha técnica', 'Análisis composición', 'Certificado fabricante'], 'Agrícola', 'media'),
('TT-SENASA-016', 'SENASA-RPV-01', '5105', 'Inscripción RPV Importador', 'SENASA', 'RPV', 'Inscripción',
  ARRAY['Res SENASA'], 60, 30000, 'VUCE', ARRAY['Documentación empresa', 'DT', 'Infraestructura'], 'Primera vez', 'media'),
('TT-SENASA-017', 'SENASA-RPV-02', '5106', 'Ampliación rubro RPV', 'SENASA', 'RPV', 'Ampliación',
  ARRAY['Res SENASA'], 45, 20000, 'VUCE', ARRAY['Nota solicitud', 'RPV vigente', 'Justificación'], 'Nuevo rubro', 'media'),
('TT-SENASA-018', 'SENASA-RPV-03', '5107', 'Modificación RPV datos', 'SENASA', 'RPV', 'Modificación',
  ARRAY['Res SENASA'], 30, 12000, 'VUCE', ARRAY['Nota cambio', 'Documentación nueva'], 'Sin cambio rubro', 'media'),
('TT-SENASA-019', 'SENASA-RENSP-01', '5108', 'Inscripción RENSPA establecimiento', 'SENASA', 'RENSPA', 'Inscripción',
  ARRAY['Res SENASA'], 90, 35000, 'VUCE', ARRAY['Planos', 'Habilitación', 'POE', 'DT'], 'Establec pecuario', 'media'),
('TT-SENASA-020', 'SENASA-RENSP-02', '5109', 'Modificación RENSPA', 'SENASA', 'RENSPA', 'Modificación',
  ARRAY['Res SENASA'], 45, 18000, 'VUCE', ARRAY['Nota cambio', 'RENSPA vigente', 'Docs respaldo'], 'Sin ampliación', 'media'),
('TT-SENASA-021', 'SENASA-INSP-01', '5110', 'Inspección establecimiento productivo', 'SENASA', 'Inspecciones', 'Productivo',
  ARRAY['Res SENASA'], NULL, 50000, 'Sistema inspección', ARRAY['Disponibilidad', 'Documentación actualizada'], 'En sitio', 'media'),
('TT-SENASA-022', 'SENASA-INSP-02', '5111', 'Inspección depósito productos', 'SENASA', 'Inspecciones', 'Depósito',
  ARRAY['Res SENASA'], NULL, 35000, 'Sistema inspección', ARRAY['Disponibilidad', 'Inventario actualizado'], 'En sitio', 'media'),
('TT-SENASA-023', 'SENASA-CERT-01', '5112', 'Certificado exportación productos', 'SENASA', 'Certificaciones', 'Exportación',
  ARRAY['Res SENASA'], 15, 12000, 'VUCE', ARRAY['Producto registrado', 'Factura comercial', 'Destino'], 'Por embarque', 'media'),
('TT-SENASA-024', 'SENASA-CERT-02', '5113', 'Certificado fitosanitario', 'SENASA', 'Certificaciones', 'Fitosanitario',
  ARRAY['Res SENASA'], 10, 8000, 'VUCE', ARRAY['Análisis', 'Origen', 'Destino'], 'Vegetales', 'media'),
('TT-SENASA-025', 'SENASA-CERT-03', '5114', 'Certificado zoosanitario', 'SENASA', 'Certificaciones', 'Zoosanitario',
  ARRAY['Res SENASA'], 10, 8000, 'VUCE', ARRAY['Análisis', 'Origen', 'Destino', 'Vacunación'], 'Animales', 'media'),
('TT-SENASA-026', 'SENASA-TRANS-01', '5115', 'Transferencia registro producto', 'SENASA', 'Modificaciones', 'Transferencia',
  ARRAY['Res SENASA'], 90, 35000, 'VUCE', ARRAY['Acuerdo transferencia', 'Registro vigente', 'Legajo nuevo titular'], 'Cambio titular', 'media'),
('TT-SENASA-027', 'SENASA-MOD-FORM', '5116', 'Modificación formulación menor', 'SENASA', 'Modificaciones', 'Formulación',
  ARRAY['Res SENASA'], 60, 25000, 'VUCE', ARRAY['Ficha técnica nueva', 'Análisis', 'Justificación'], 'Menor a 10%', 'media'),
('TT-SENASA-028', 'SENASA-MOD-ROT', '5117', 'Modificación rótulo', 'SENASA', 'Modificaciones', 'Rotulado',
  ARRAY['Res SENASA'], 45, 18000, 'VUCE', ARRAY['Rótulo nuevo', 'Justificación', 'Registro vigente'], 'Sin cambio tech', 'media'),
('TT-SENASA-029', 'SENASA-BAJA-01', '5118', 'Baja producto registrado', 'SENASA', 'Bajas', 'Voluntaria',
  ARRAY['Res SENASA'], 30, NULL, 'VUCE', ARRAY['Nota solicitud', 'Registro vigente', 'Declaración stock'], 'Irreversible', 'media'),
('TT-SENASA-030', 'SENASA-CONS-01', '5119', 'Consulta técnica', 'SENASA', 'Consultas', 'Técnica',
  ARRAY['Res SENASA'], 45, NULL, 'VUCE', ARRAY['Descripción producto', 'Uso previsto', 'Composición'], 'Orientativa', 'media'),
('TT-SENASA-031', 'SENASA-AUT-IMP', '5120', 'Autorización importación excepcional', 'SENASA', 'Autorizaciones', 'Importación',
  ARRAY['Res SENASA'], 30, 15000, 'VUCE', ARRAY['Justificación', 'CFS origen', 'Análisis', 'Uso específico'], 'Excepcional', 'media'),
('TT-SENASA-032', 'SENASA-HAB-LAB', '5121', 'Habilitación laboratorio análisis', 'SENASA', 'Habilitaciones', 'Laboratorio',
  ARRAY['Res SENASA'], 120, 60000, 'Sistema inspección', ARRAY['Planos', 'Equipamiento', 'Personal', 'Procedimientos'], 'BPL requeridas', 'media'),
('TT-SENASA-033', 'SENASA-RENOV-HAB', '5122', 'Renovación habilitación', 'SENASA', 'Habilitaciones', 'Renovación',
  ARRAY['Res SENASA'], 60, 30000, 'VUCE', ARRAY['Habilitación vigente', 'Auditorías cumplidas', 'Actualización docs'], 'Cada 3 años', 'media'),
('TT-SENASA-034', 'SENASA-TRAZ-01', '5123', 'Inscripción sistema trazabilidad', 'SENASA', 'Trazabilidad', 'Inscripción',
  ARRAY['Res SENASA'], 45, 25000, 'VUCE', ARRAY['Sistema implementado', 'Procedimientos', 'Capacitación'], 'Obligatorio', 'media'),
('TT-SENASA-035', 'SENASA-ACUER-01', '5124', 'Certificado cumplimiento acuerdos', 'SENASA', 'Certificaciones', 'Acuerdos',
  ARRAY['Res SENASA'], 20, 10000, 'VUCE', ARRAY['Registro vigente', 'Cumplimiento requisitos destino'], 'Por destino', 'media'),

-- INTI MEDIUM PRIORITY (15)
('TT-INTI-011', 'INTI-METRO-01', '6100', 'Verificación primitiva instrumento', 'INTI', 'Metrología', 'Verificación',
  ARRAY['Ley 19511'], 60, 30000, 'Web INTI', ARRAY['Instrumento', 'Documentación técnica', 'Certificado fabricante'], 'Primera vez', 'media'),
('TT-INTI-012', 'INTI-METRO-02', '6101', 'Verificación periódica instrumento', 'INTI', 'Metrología', 'Periódica',
  ARRAY['Ley 19511'], 30, 15000, 'Web INTI', ARRAY['Instrumento', 'Verificación previa'], 'Anual/bianual', 'media'),
('TT-INTI-013', 'INTI-METRO-03', '6102', 'Reparación y reverificación', 'INTI', 'Metrología', 'Reparación',
  ARRAY['Ley 19511'], 45, 20000, 'Web INTI', ARRAY['Instrumento reparado', 'Informe reparación'], 'Post reparación', 'media'),
('TT-INTI-014', 'INTI-CALIB-01', '6103', 'Calibración patrón secundario', 'INTI', 'Metrología', 'Calibración',
  ARRAY['Ley 19511'], 60, 35000, 'Web INTI', ARRAY['Patrón', 'Certificado vigencia', 'Trazabilidad'], 'Laboratorio', 'media'),
('TT-INTI-015', 'INTI-CERT-CONF', '6104', 'Certificado conformidad producto', 'INTI', 'Certificaciones', 'Conformidad',
  ARRAY['Res INTI'], 90, 40000, 'Web INTI', ARRAY['Muestras', 'Documentación técnica', 'Ensayos'], 'Según norma', 'media'),
('TT-INTI-016', 'INTI-CERT-SIST', '6105', 'Certificación sistema gestión', 'INTI', 'Certificaciones', 'Sistema',
  ARRAY['Res INTI'], 120, 80000, 'Web INTI', ARRAY['Manual', 'Procedimientos', 'Auditoría previa'], 'ISO/IRAM', 'media'),
('TT-INTI-017', 'INTI-ENS-FIS', '6106', 'Ensayos físicos materiales', 'INTI', 'Ensayos', 'Físicos',
  ARRAY['Res INTI'], 30, 25000, 'Web INTI', ARRAY['Muestras', 'Norma aplicable', 'Información producto'], 'Por muestra', 'media'),
('TT-INTI-018', 'INTI-ENS-QUIM', '6107', 'Ensayos químicos materiales', 'INTI', 'Ensayos', 'Químicos',
  ARRAY['Res INTI'], 45, 30000, 'Web INTI', ARRAY['Muestras', 'Norma aplicable', 'Información producto'], 'Por muestra', 'media'),
('TT-INTI-019', 'INTI-ENS-ELEC', '6108', 'Ensayos eléctricos', 'INTI', 'Ensayos', 'Eléctricos',
  ARRAY['Res INTI'], 30, 28000, 'Web INTI', ARRAY['Equipo', 'Norma aplicable', 'Manual'], 'Por equipo', 'media'),
('TT-INTI-020', 'INTI-INSP-FAB', '6109', 'Inspección fábrica', 'INTI', 'Inspecciones', 'Fabricación',
  ARRAY['Res INTI'], NULL, 45000, 'Sistema inspección', ARRAY['Disponibilidad', 'Procesos documentados', 'Control calidad'], 'En sitio', 'media'),
('TT-INTI-021', 'INTI-RENOV-CERT', '6110', 'Renovación certificación', 'INTI', 'Certificaciones', 'Renovación',
  ARRAY['Res INTI'], 60, 35000, 'Web INTI', ARRAY['Certificado vigente', 'Auditorías cumplidas', 'No conformidades cerradas'], 'Cada 3 años', 'media'),
('TT-INTI-022', 'INTI-MOD-CERT', '6111', 'Modificación alcance certificado', 'INTI', 'Certificaciones', 'Modificación',
  ARRAY['Res INTI'], 60, 30000, 'Web INTI', ARRAY['Certificado vigente', 'Justificación cambio', 'Evidencia'], 'Ampliación/reducción', 'media'),
('TT-INTI-023', 'INTI-DICT-TECN', '6112', 'Dictamen técnico', 'INTI', 'Consultas', 'Dictamen',
  ARRAY['Res INTI'], 45, 35000, 'Web INTI', ARRAY['Documentación completa', 'Muestras si aplica'], 'Vinculante', 'media'),
('TT-INTI-024', 'INTI-ASIS-TEC', '6113', 'Asistencia técnica', 'INTI', 'Servicios', 'Asistencia',
  ARRAY['Res INTI'], 60, 50000, 'Web INTI', ARRAY['Diagnóstico', 'Plan trabajo', 'Recursos'], 'Por proyecto', 'media'),
('TT-INTI-025', 'INTI-AUDIT-SEG', '6114', 'Auditoría seguimiento', 'INTI', 'Auditorías', 'Seguimiento',
  ARRAY['Res INTI'], NULL, 25000, 'Sistema inspección', ARRAY['Certificado vigente', 'Disponibilidad'], 'Anual', 'media'),

-- SEDRONAR MEDIUM PRIORITY (5)
('TT-SEDRONAR-06', 'RENPRE-MOD-01', '7100', 'Modificación datos RENPRE', 'SEDRONAR', 'RENPRE', 'Modificación',
  ARRAY['Res SEDRONAR'], 30, 8000, 'TAD', ARRAY['Nota cambio', 'Inscripción vigente', 'Docs respaldo'], 'Sin cambio activ', 'media'),
('TT-SEDRONAR-07', 'RENPRE-AMP-01', '7101', 'Ampliación actividades RENPRE', 'SEDRONAR', 'RENPRE', 'Ampliación',
  ARRAY['Res SEDRONAR'], 60, 15000, 'TAD', ARRAY['Nota solicitud', 'Justificación', 'Infraestructura'], 'Nueva actividad', 'media'),
('TT-SEDRONAR-08', 'RENPRE-INF-01', '7102', 'Informe operaciones mensual', 'SEDRONAR', 'RENPRE', 'Informe',
  ARRAY['Res SEDRONAR'], 10, NULL, 'TAD', ARRAY['Planilla operaciones', 'Firma responsable'], 'Mensual obligatorio', 'media'),
('TT-SEDRONAR-09', 'RENPRE-INSP-01', '7103', 'Inspección establecimiento RENPRE', 'SEDRONAR', 'RENPRE', 'Inspección',
  ARRAY['Res SEDRONAR'], NULL, 30000, 'Sistema inspección', ARRAY['Disponibilidad', 'Registros actualizados', 'Stock'], 'Programada/sorpresa', 'media'),
('TT-SEDRONAR-10', 'RENPRE-RENOV', '7104', 'Renovación inscripción RENPRE', 'SEDRONAR', 'RENPRE', 'Renovación',
  ARRAY['Res SEDRONAR'], 60, 25000, 'TAD', ARRAY['Inscripción vigente', 'Informes al día', 'Infraestructura'], 'Cada 5 años', 'media'),

-- CITES MEDIUM PRIORITY (4)
('TT-CITES-05', 'CITES-MOD-RUOF', '8100', 'Modificación datos RUOFS', 'AMBIENTE', 'CITES', 'Modificación',
  ARRAY['Res Ambiente'], 30, 5000, 'Web Fauna', ARRAY['Nota cambio', 'RUOFS vigente', 'Docs respaldo'], 'Sin cambio activ', 'media'),
('TT-CITES-06', 'CITES-RENOV-RUO', '8101', 'Renovación RUOFS', 'AMBIENTE', 'CITES', 'Renovación',
  ARRAY['Res Ambiente'], 60, 20000, 'Web Fauna', ARRAY['RUOFS vigente', 'Declaración actividades', 'Infraestructura'], 'Cada 3 años', 'media'),
('TT-CITES-07', 'CITES-INSP-01', '8102', 'Inspección criadero/vivero', 'AMBIENTE', 'CITES', 'Inspección',
  ARRAY['Res Ambiente'], NULL, 25000, 'Sistema inspección', ARRAY['Disponibilidad', 'Registros', 'Ejemplares'], 'Programada', 'media'),
('TT-CITES-08', 'CITES-CONS-01', '8103', 'Consulta especies CITES', 'AMBIENTE', 'CITES', 'Consulta',
  ARRAY['Res Ambiente'], 20, NULL, 'Web Fauna', ARRAY['Descripción especie', 'Origen', 'Uso previsto'], 'Orientativa', 'media'),

-- INASE MEDIUM PRIORITY (5)
('TT-INASE-06', 'INASE-MOD-RNC', '9100', 'Modificación datos RNCyFS', 'INASE', 'RNCyFS', 'Modificación',
  ARRAY['Res INASE'], 30, 8000, 'Web INASE', ARRAY['Nota cambio', 'Inscripción vigente', 'Docs respaldo'], 'Sin cambio activ', 'media'),
('TT-INASE-07', 'INASE-RENOV-RNC', '9101', 'Renovación inscripción RNCyFS', 'INASE', 'RNCyFS', 'Renovación',
  ARRAY['Res INASE'], 60, 25000, 'Web INASE', ARRAY['Inscripción vigente', 'Auditorías cumplidas', 'Infraestructura'], 'Cada 5 años', 'media'),
('TT-INASE-08', 'INASE-CERT-SEM', '9102', 'Certificado semilla fiscal', 'INASE', 'Certificaciones', 'Semilla',
  ARRAY['Res INASE'], 15, 10000, 'Web INASE', ARRAY['Análisis semilla', 'Origen', 'Rótulo'], 'Por lote', 'media'),
('TT-INASE-09', 'INASE-INSP-01', '9103', 'Inspección establecimiento semillero', 'INASE', 'Inspecciones', 'Semillero',
  ARRAY['Res INASE'], NULL, 30000, 'Sistema inspección', ARRAY['Disponibilidad', 'Procesos', 'Stock'], 'Programada', 'media'),
('TT-INASE-10', 'INASE-CONS-01', '9104', 'Consulta técnica cultivar', 'INASE', 'Consultas', 'Técnica',
  ARRAY['Res INASE'], 30, NULL, 'Web INASE', ARRAY['Descripción cultivar', 'Características', 'Uso'], 'Orientativa', 'media'),

-- SIC MEDIUM PRIORITY (6)
('TT-SIC-07', 'SIC-CERT-SEG', '10100', 'Certificado seguridad eléctrica', 'SIC', 'Certificaciones', 'Seguridad',
  ARRAY['Res SIC'], 90, 45000, 'TAD', ARRAY['Muestras', 'Ensayos', 'Manual producto'], 'Por modelo', 'media'),
('TT-SIC-08', 'SIC-LCM-MOD', '10101', 'Modificación LCM menor', 'SIC', 'LCM', 'Modificación',
  ARRAY['Res SIC'], 60, 25000, 'TAD', ARRAY['LCM vigente', 'Nota cambios', 'Evidencia técnica'], 'Sin cambio mayor', 'media'),
('TT-SIC-09', 'SIC-RENOV-LCM', '10102', 'Renovación LCM', 'SIC', 'LCM', 'Renovación',
  ARRAY['Res SIC'], 60, 35000, 'TAD', ARRAY['LCM vigente', 'Comercialización', 'Ensayos vigentes'], 'Cada 5 años', 'media'),
('TT-SIC-10', 'SIC-EFIC-ENERG', '10103', 'Certificado eficiencia energética', 'SIC', 'Certificaciones', 'Eficiencia',
  ARRAY['Res SIC'], 90, 40000, 'TAD', ARRAY['Muestras', 'Ensayos energéticos', 'Manual'], 'Por modelo', 'media'),
('TT-SIC-11', 'SIC-INSP-FAB', '10104', 'Inspección fábrica', 'SIC', 'Inspecciones', 'Fabricación',
  ARRAY['Res SIC'], NULL, 50000, 'Sistema inspección', ARRAY['Disponibilidad', 'Procesos', 'Control calidad'], 'En sitio', 'media'),
('TT-SIC-12', 'SIC-CONS-01', '10105', 'Consulta técnica normativa', 'SIC', 'Consultas', 'Técnica',
  ARRAY['Res SIC'], 30, NULL, 'TAD', ARRAY['Descripción producto', 'Uso', 'Normativa aplicable'], 'Orientativa', 'media');
