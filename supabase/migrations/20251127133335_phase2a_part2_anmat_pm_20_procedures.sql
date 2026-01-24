/*
  # Fase 2A Parte 2 - ANMAT Productos Médicos (20 trámites)
  
  ## Descripción
  
  Inserta 20 trámites de ANMAT PM de alta prioridad:
  - 4 Legajos de Empresa
  - 3 Habilitaciones de Depósito
  - 1 Responsable Técnico
  - 7 Registros por Clase (I, Im, Is, IIa, IIb, III, IV)
  - 2 Modificaciones
  - 1 Importación
  - 2 Certificaciones
  
  ## Marco Normativo
  
  - Disp. 7939/2025 - Clasificación dispositivos médicos
  - ISO 13485 - Sistema de gestión de calidad
  - Resolución ANMAT sobre registros PM
  
  ## Datos
  
  - Códigos oficiales TAD 2025
  - Costos actualizados por clase de riesgo
  - Documentación ISO 13485, estudios clínicos
  - SLA según complejidad (90-240 días)
  - Prioridad = 'alta'
*/

INSERT INTO tramite_tipos (
  id, codigo, nombre, organismo_id, rubro, subcategoria,
  costo_base_2025, codigo_oficial, plataforma_gestion, sla_total_dias,
  documentacion_obligatoria, prioridad, costo_tasas_base
) VALUES
-- Legajos de Empresa
('TT-PM-LEG-001', 'PM-LEG-001', 'Legajo Digital Importador/Elaborador PM', 'ANMAT_PM', 'Productos Médicos', 'Legajo',
 60000.00, '1001', 'TAD/Gemha', 90,
 ARRAY['AFIP vigente', 'Estatuto', 'Poder', 'DNI responsables'],
 'alta', 60000.00),

('TT-PM-LEG-002', 'PM-LEG-002', 'Legajo + ampliación rubro Clase I', 'ANMAT_PM', 'Productos Médicos', 'Legajo',
 65000.00, '1001A', 'TAD', 90,
 ARRAY['Docs legajo', 'Detalle rubro'],
 'alta', 65000.00),

('TT-PM-LEG-003', 'PM-LEG-003', 'Legajo + ampliación rubro Clase II', 'ANMAT_PM', 'Productos Médicos', 'Legajo',
 70000.00, '1001B', 'TAD', 90,
 ARRAY['Docs legajo', 'Detalle rubro', 'RT idóneo'],
 'alta', 70000.00),

('TT-PM-LEG-004', 'PM-LEG-004', 'Legajo + ampliación rubro Clase III/IV', 'ANMAT_PM', 'Productos Médicos', 'Legajo',
 80000.00, '1001C', 'TAD', 120,
 ARRAY['Docs legajo', 'Detalle rubro', 'RT especializado', 'Protocolo calidad'],
 'alta', 80000.00),

-- Habilitaciones de Depósito
('TT-PM-HAB-001', 'PM-HAB-001', 'Habilitación Depósito PM', 'ANMAT_PM', 'Productos Médicos', 'Habilitación',
 40000.00, '1002', 'TAD', 60,
 ARRAY['Habilitación municipal', 'Plano', 'POE', 'Acta inspección'],
 'alta', 40000.00),

('TT-PM-HAB-002', 'PM-HAB-002', 'Habilitación Depósito Clase I/II', 'ANMAT_PM', 'Productos Médicos', 'Habilitación',
 40000.00, '1002A', 'TAD', 60,
 ARRAY['Docs depósito', 'Control ambiental'],
 'alta', 40000.00),

('TT-PM-HAB-003', 'PM-HAB-003', 'Habilitación Depósito Clase III/IV', 'ANMAT_PM', 'Productos Médicos', 'Habilitación',
 50000.00, '1002B', 'TAD + presencial', 90,
 ARRAY['Docs depósito', 'Control ambiental', 'Trazabilidad', 'Seguridad'],
 'alta', 50000.00),

-- Responsable Técnico
('TT-PM-RT-001', 'PM-RT-001', 'Designación RT', 'ANMAT_PM', 'Productos Médicos', 'Personal',
 15000.00, '1003', 'TAD', 30,
 ARRAY['CV', 'Título', 'Matrícula', 'DDJJ'],
 'alta', 15000.00),

-- Registros por Clase de Riesgo
('TT-PM-REG-001', 'PM-REG-001', 'Registro Clase I', 'ANMAT_PM', 'Productos Médicos', 'Registro',
 45000.00, '2318', 'TAD/Gemha', 90,
 ARRAY['APM completo', 'CFS/CE', 'Ficha técnica', 'Manual español', 'Etiquetas'],
 'alta', 45000.00),

('TT-PM-REG-002', 'PM-REG-002', 'Registro Clase Im (medición)', 'ANMAT_PM', 'Productos Médicos', 'Registro',
 50000.00, '2318A', 'TAD + INTI', 120,
 ARRAY['APM', 'CFS', 'Certificados metrológicos', 'Calibración'],
 'alta', 50000.00),

('TT-PM-REG-003', 'PM-REG-003', 'Registro Clase Is (estéril)', 'ANMAT_PM', 'Productos Médicos', 'Registro',
 55000.00, '2318B', 'TAD', 120,
 ARRAY['APM', 'CFS', 'Certificado esterilidad', 'Validación'],
 'alta', 55000.00),

('TT-PM-REG-004', 'PM-REG-004', 'Registro Clase IIa', 'ANMAT_PM', 'Productos Médicos', 'Registro',
 75000.00, '2319', 'TAD', 120,
 ARRAY['APM', 'CFS', 'ISO 13485', 'Estudios clínicos', 'Análisis riesgo'],
 'alta', 75000.00),

('TT-PM-REG-005', 'PM-REG-005', 'Registro Clase IIb', 'ANMAT_PM', 'Productos Médicos', 'Registro',
 120000.00, '2319B', 'TAD', 150,
 ARRAY['APM', 'CFS', 'ISO 13485', 'Estudios clínicos completos', 'Análisis riesgo'],
 'alta', 120000.00),

('TT-PM-REG-006', 'PM-REG-006', 'Registro Clase III', 'ANMAT_PM', 'Productos Médicos', 'Registro',
 180000.00, '2320', 'TAD', 180,
 ARRAY['APM', 'CFS', 'ISO 13485', 'Estudios clínicos fase III', 'Análisis riesgo completo'],
 'alta', 180000.00),

('TT-PM-REG-007', 'PM-REG-007', 'Registro Clase IV', 'ANMAT_PM', 'Productos Médicos', 'Registro',
 220000.00, '2320B', 'TAD', 240,
 ARRAY['APM', 'CFS', 'ISO 13485', 'Estudios clínicos completos', 'Vigilancia posmercado'],
 'alta', 220000.00),

-- Modificaciones
('TT-PM-MOD-001', 'PM-MOD-001', 'Modificación Registro PM', 'ANMAT_PM', 'Productos Médicos', 'Modificación',
 29850.00, '2325', 'TAD', 60,
 ARRAY['Nota cambio', 'Docs respaldatorios', 'Registro PM'],
 'alta', 29850.00),

('TT-PM-MOD-002', 'PM-MOD-002', 'Cambio BPF Fabricante', 'ANMAT_PM', 'Productos Médicos', 'Modificación',
 50000.00, '2326', 'TAD', 90,
 ARRAY['Certificado BPF nuevo fabricante', 'CFS', 'Convenio'],
 'alta', 50000.00),

-- Importaciones
('TT-PM-IMP-001', 'PM-IMP-001', 'Aviso Importación por Operación', 'ANMAT_PM', 'Productos Médicos', 'Importación',
 0.00, '2402', 'VUCE/SIM', 1,
 ARRAY['Registro PM', 'Factura', 'BL', 'Certificado lote'],
 'alta', 0.00),

-- Certificaciones
('TT-PM-CERT-001', 'PM-CERT-001', 'Certificado Libre Comercialización', 'ANMAT_PM', 'Productos Médicos', 'Certificación',
 20000.00, '2700', 'TAD', 30,
 ARRAY['Solicitud destino', 'Registro PM vigente', 'Poder'],
 'alta', 20000.00),

('TT-PM-CERT-002', 'PM-CERT-002', 'Constancia Trazabilidad PM', 'ANMAT_PM', 'Productos Médicos', 'Certificación',
 5000.00, '2702', 'Helena', 15,
 ARRAY['Lote', 'Operación'],
 'alta', 5000.00)

ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  costo_base_2025 = EXCLUDED.costo_base_2025,
  plataforma_gestion = EXCLUDED.plataforma_gestion,
  subcategoria = EXCLUDED.subcategoria,
  documentacion_obligatoria = EXCLUDED.documentacion_obligatoria,
  prioridad = EXCLUDED.prioridad,
  costo_tasas_base = EXCLUDED.costo_tasas_base,
  sla_total_dias = EXCLUDED.sla_total_dias,
  codigo_oficial = EXCLUDED.codigo_oficial;

-- Verificación
DO $$
DECLARE
  count_pm INTEGER;
  total_alta INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_pm 
  FROM tramite_tipos 
  WHERE organismo_id = 'ANMAT_PM' AND prioridad = 'alta';
  
  SELECT COUNT(*) INTO total_alta 
  FROM tramite_tipos 
  WHERE prioridad = 'alta';
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'FASE 2A PARTE 2 - ANMAT PM COMPLETADA';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Trámites ANMAT PM alta prioridad: %', count_pm;
  RAISE NOTICE 'Total trámites alta prioridad: %', total_alta;
  RAISE NOTICE '================================================';
END $$;