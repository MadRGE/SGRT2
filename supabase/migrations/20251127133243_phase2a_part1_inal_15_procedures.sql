/*
  # Fase 2A Parte 1 - INAL (15 trámites alta prioridad)
  
  ## Descripción
  
  Inserta 15 trámites de INAL de alta prioridad:
  - 3 RNE (Registro Nacional de Establecimiento)
  - 3 RNPA (Registro Nacional de Producto Alimenticio)
  - 2 Envases
  - 4 Importaciones
  - 2 Inspecciones/Certificaciones
  - 1 Autorizaciones Especiales
  
  ## Datos
  
  - Códigos oficiales TADO 2025
  - Costos actualizados Noviembre 2025
  - Documentación obligatoria detallada
  - SLA (plazos) estimados
  - Prioridad = 'alta'
  
  ## Estrategia
  
  - INSERT con ON CONFLICT(codigo) DO UPDATE
  - Actualiza datos si ya existe
  - Preserva integridad referencial
*/

-- Crear organismo INASE si no existe (para migraciones futuras)
INSERT INTO organismos (id, sigla, nombre, plataforma_presentacion) 
VALUES ('INASE', 'INASE', 'Instituto Nacional de Semillas', 'Portal INASE')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INAL - INSTITUTO NACIONAL DE ALIMENTOS (15 trámites)
-- ============================================================================

INSERT INTO tramite_tipos (
  id, codigo, nombre, organismo_id, rubro, subcategoria,
  costo_base_2025, codigo_oficial, plataforma_gestion, sla_total_dias,
  documentacion_obligatoria, prioridad, costo_tasas_base
) VALUES
-- RNE - Registros de Establecimiento
('TT-INAL-RNE-001', 'INAL-RNE-001', 'Inscripción RNE Importador/Exportador (por depósito)', 'INAL', 'RNE', 'Inscripción',
 40000.00, '4047', 'TADO', 120,
 ARRAY['Habilitación municipal', 'Plano', 'POE', 'Título DT'],
 'alta', 40000.00),

('TT-INAL-RNE-002', 'INAL-RNE-002', 'Designación Director Técnico', 'INAL', 'RNE', 'Personal',
 8000.00, '4049', 'TADO', 30,
 ARRAY['Nota', 'DNI/título/matrícula', 'CV', 'DDJJ'],
 'alta', 8000.00),

('TT-INAL-RNE-003', 'INAL-RNE-003', 'Ampliación rubro RNE', 'INAL', 'RNE', 'Ampliación',
 15000.00, '4050', 'TADO', 60,
 ARRAY['Nota rubros nuevos', 'POE ampliado'],
 'alta', 15000.00),

-- RNPA - Registros de Productos
('TT-INAL-RNPA-001', 'INAL-RNPA-001', 'Inscripción/Reinscripción/Transferencia RNPA', 'INAL', 'RNPA', 'Inscripción',
 32000.00, '4045', 'TADO', 90,
 ARRAY['Ficha técnica', 'Análisis bromatológico', 'Rótulo español', 'CFS origen', 'RNE', 'DDJJ DT'],
 'alta', 32000.00),

('TT-INAL-RNPA-002', 'INAL-RNPA-002', 'RNPA Suplementos Dietarios', 'INAL', 'RNPA', 'Inscripción',
 45000.00, '4000A', 'TADO', 120,
 ARRAY['Ficha técnica completa', 'Análisis completo', 'Estudios seguridad', 'Rótulo DDJJ'],
 'alta', 45000.00),

('TT-INAL-RNPA-003', 'INAL-RNPA-003', 'RNPA Alimentos Médicos Específicos', 'INAL', 'RNPA', 'Inscripción',
 50000.00, '4000B', 'TADO', 150,
 ARRAY['Ficha técnica', 'Estudios clínicos', 'Rótulo', 'Evidencia científica'],
 'alta', 50000.00),

-- Envases
('TT-INAL-ENV-001', 'INAL-ENV-001', 'Autorización/transferencia envases', 'INAL', 'Envases', 'Autorización',
 35000.00, '4053', 'TADO', 90,
 ARRAY['Ficha material', 'Ensayo migración'],
 'alta', 35000.00),

('TT-INAL-ENV-002', 'INAL-ENV-002', 'Autorización Envases Plásticos', 'INAL', 'Envases', 'Autorización',
 35000.00, '4055A', 'TADO', 90,
 ARRAY['Composición química', 'Migración global y específica', 'Certificado fabricante'],
 'alta', 35000.00),

-- Importaciones
('TT-INAL-IMP-001', 'INAL-IMP-001', 'Aviso Importación Alimentos (por producto)', 'INAL', 'Importación', 'Aviso',
 0.00, '4056', 'VUCE/TAD', 1,
 ARRAY['RNPA', 'Factura', 'BL', 'CFS'],
 'alta', 0.00),

('TT-INAL-IMP-002', 'INAL-IMP-002', 'Aviso Importación Envases (por línea)', 'INAL', 'Importación', 'Aviso',
 0.00, '4057', 'VUCE/TAD', 1,
 ARRAY['Autorización envase', 'Factura', 'BL'],
 'alta', 0.00),

('TT-INAL-IMP-003', 'INAL-IMP-003', 'Autorización importación temporal', 'INAL', 'Importación', 'Temporal',
 10000.00, '4054', 'TADO', 30,
 ARRAY['Nota finalidad', 'Compromiso reexport'],
 'alta', 10000.00),

('TT-INAL-IMP-004', 'INAL-IMP-004', 'Ingreso muestra sin valor', 'INAL', 'Importación', 'Muestra',
 2000.00, '4055', 'TADO', 15,
 ARRAY['Nota finalidad', 'Invoice sin valor'],
 'alta', 2000.00),

-- Inspecciones y Certificaciones
('TT-INAL-INSP-001', 'INAL-INSP-001', 'Inspección BPM Elaboradores', 'INAL', 'Inspección', 'BPM',
 444600.00, '4063', 'Presencial/TAD', 60,
 ARRAY['Solicitud', 'Pago previo', 'Disponibilidad planta'],
 'alta', 444600.00),

('TT-INAL-CERT-001', 'INAL-CERT-001', 'Certificado Producto Exclusivo Exportar', 'INAL', 'Certificación', 'Exportación',
 15000.00, '4065', 'TADO', 30,
 ARRAY['Solicitud destino', 'Ficha técnica', 'RNPA'],
 'alta', 15000.00),

-- Autorizaciones especiales
('TT-INAL-AUT-001', 'INAL-AUT-001', 'Autorización Probióticos/Prebióticos', 'INAL', 'Autorización', 'Ingredientes',
 35000.00, '4067', 'TADO', 90,
 ARRAY['Ficha técnica cepa', 'Estudios seguridad', 'Evidencia científica'],
 'alta', 35000.00)

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
  count_inal INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_inal 
  FROM tramite_tipos 
  WHERE organismo_id = 'INAL' AND prioridad = 'alta';
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'FASE 2A PARTE 1 - INAL COMPLETADA';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Trámites INAL alta prioridad insertados: %', count_inal;
  RAISE NOTICE '================================================';
END $$;