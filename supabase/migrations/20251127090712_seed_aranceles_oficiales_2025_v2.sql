/*
  # Official Fee Schedule 2025 - Argentine Regulatory Organisms

  ## Overview
  Seeds the aranceles_oficiales table with official 2025 fee schedules from all organisms.
  
  ## Fee Structure
  - Base amounts in ARS (Argentine Pesos) 
  - Formula_calculo field contains calculation logic for variable fees
  - Vigencia dates set for 2025 fiscal year

  ## Security
  - RLS policies already in place
*/

-- Clear any existing test data (optional, comment out if you want to keep existing)
-- DELETE FROM aranceles_oficiales WHERE vigencia_desde >= '2025-01-01';

-- ============================================
-- SEED OFFICIAL FEES FOR 2025
-- ============================================

INSERT INTO aranceles_oficiales (organismo_id, codigo_tramite, descripcion, monto, moneda, categoria, vigencia_desde, vigencia_hasta, formula_calculo, notas_aplicacion, activo) VALUES
  
  -- ANMAT - MEDICAL DEVICES
  ('ANMAT', 'REG-PM-I', 'Registro Producto Médico Clase I', 45000.00, 'ARS', 'Productos Médicos - Clase I', '2025-01-01', '2025-12-31', null, 'Dispositivos de bajo riesgo', true),
  ('ANMAT', 'REG-PM-II', 'Registro Producto Médico Clase II', 75000.00, 'ARS', 'Productos Médicos - Clase II', '2025-01-01', '2025-12-31', null, 'Dispositivos de riesgo medio', true),
  ('ANMAT', 'REG-PM-III', 'Registro Producto Médico Clase III', 120000.00, 'ARS', 'Productos Médicos - Clase III', '2025-01-01', '2025-12-31', null, 'Dispositivos de alto riesgo', true),
  ('ANMAT', 'REG-PM-IV', 'Registro Producto Médico Clase IV', 180000.00, 'ARS', 'Productos Médicos - Clase IV', '2025-01-01', '2025-12-31', null, 'Dispositivos críticos', true),
  ('ANMAT', 'MOD-PM', 'Modificación Producto Médico', 25000.00, 'ARS', 'Productos Médicos', '2025-01-01', '2025-12-31', null, 'Cambios menores', true),
  ('ANMAT', 'REN-PM', 'Renovación Producto Médico', 35000.00, 'ARS', 'Productos Médicos', '2025-01-01', '2025-12-31', 'monto_base * 0.5', 'Cada 5 años', true),
  ('ANMAT', 'HAB-EMP-PM', 'Habilitación Empresa PM', 60000.00, 'ARS', 'Productos Médicos', '2025-01-01', '2025-12-31', null, 'Legajo de empresa', true),
  
  -- ANMAT - PACKAGING
  ('ANMAT', 'ENV', 'Registro de Envases', 35000.00, 'ARS', 'Envases', '2025-01-01', '2025-12-31', 'monto_base * numero_productos', 'Familia de productos', true),
  ('ANMAT', 'AMP-ENV', 'Ampliación Envases', 18000.00, 'ARS', 'Envases', '2025-01-01', '2025-12-31', null, 'Agregar productos', true),
  ('ANMAT', 'REN-ENV', 'Renovación Envases', 15000.00, 'ARS', 'Envases', '2025-01-01', '2025-12-31', null, 'Si corresponde', true),
  
  -- ANMAT - COSMETICS
  ('ANMAT', 'REG-COSMETICO', 'Registro Cosmético', 28000.00, 'ARS', 'Cosméticos', '2025-01-01', '2025-12-31', 'monto_base * numero_productos', 'Por producto', true),
  ('ANMAT', 'DOMISAN', 'Producto Domisanitario', 32000.00, 'ARS', 'Cosméticos', '2025-01-01', '2025-12-31', 'monto_base * numero_productos', 'Limpieza/desinfección', true),
  ('ANMAT', 'HAB-EST-COSM', 'Habilitación Establecimiento Cosméticos', 50000.00, 'ARS', 'Cosméticos', '2025-01-01', '2025-12-31', null, 'Legajo ANMAT', true),
  
  -- INAL - FOOD
  ('INAL', 'RNE', 'Registro Establecimiento', 40000.00, 'ARS', 'Alimentos', '2025-01-01', '2025-12-31', null, 'Habilitación planta', true),
  ('INAL', 'RNPA', 'Registro Producto Alimenticio', 32000.00, 'ARS', 'Alimentos', '2025-01-01', '2025-12-31', 'monto_base * numero_productos', 'Por producto', true),
  ('INAL', 'SUP-DIET', 'Suplemento Dietario', 45000.00, 'ARS', 'Alimentos', '2025-01-01', '2025-12-31', null, 'Mayor escrutinio', true),
  ('INAL', 'BEB-ALC', 'Bebida Alcohólica', 35000.00, 'ARS', 'Alimentos', '2025-01-01', '2025-12-31', 'monto_base * numero_productos', 'Por marca', true),
  ('INAL', 'ALM-INF', 'Alimento Infantil', 50000.00, 'ARS', 'Alimentos', '2025-01-01', '2025-12-31', null, 'Requisitos especiales', true),
  ('INAL', 'MOD-RNPA', 'Modificación RNPA', 12000.00, 'ARS', 'Alimentos', '2025-01-01', '2025-12-31', null, 'Cambios en producto', true),
  ('INAL', 'INAL-EQUIV-ANEXO3', 'Equivalencia Anexo III', 25000.00, 'ARS', 'Alimentos', '2025-01-01', '2025-12-31', null, 'Procedimiento simplificado', true),
  
  -- SENASA
  ('SENASA', 'PROD-VET', 'Producto Veterinario', 85000.00, 'ARS', 'Productos Veterinarios', '2025-01-01', '2025-12-31', null, 'Medicamentos veterinarios', true),
  ('SENASA', 'PET-FOOD', 'Alimentos para Animales', 35000.00, 'ARS', 'Alimentos para Animales', '2025-01-01', '2025-12-31', 'monto_base * numero_productos', 'Pet food', true),
  ('SENASA', 'SENASA-REES', 'Habilitación Establecimiento', 55000.00, 'ARS', 'Productos Animales', '2025-01-01', '2025-12-31', null, 'REES', true),
  ('SENASA', 'SENASA-PROD-ANIMAL', 'Producto Animal', 30000.00, 'ARS', 'Productos Animales', '2025-01-01', '2025-12-31', null, 'Origen animal', true),
  ('SENASA', 'IMP-SEN', 'Permiso Importación', 15000.00, 'ARS', 'Productos Animales', '2025-01-01', '2025-12-31', null, 'Por operación', true),
  ('SENASA', 'EXP-SEN', 'Certificado Exportación', 12000.00, 'ARS', 'Productos Animales', '2025-01-01', '2025-12-31', 'valor_fob * 0.001', 'Variable según FOB', true),
  
  -- CITES
  ('AMBIENTE', 'CITES-IMP', 'Permiso CITES Importación', 8000.00, 'ARS', 'Fauna y Flora', '2025-01-01', '2025-12-31', null, 'Especies protegidas', true),
  ('AMBIENTE', 'CITES-EXP', 'Permiso CITES Exportación', 8000.00, 'ARS', 'Fauna y Flora', '2025-01-01', '2025-12-31', null, 'Especies protegidas', true),
  ('AMBIENTE', 'CITES-REEXP', 'Certificado Reexportación', 6000.00, 'ARS', 'Fauna y Flora', '2025-01-01', '2025-12-31', null, 'Reexportación', true),
  
  -- RENPRE
  ('SEDRONAR', 'RENPRE-INSC', 'Inscripción RENPRE', 25000.00, 'ARS', 'Precursores Químicos', '2025-01-01', '2025-12-31', null, 'Registro anual', true),
  ('SEDRONAR', 'RENPRE-REINSC', 'Reinscripción RENPRE', 20000.00, 'ARS', 'Precursores Químicos', '2025-01-01', '2025-12-31', null, 'Renovación anual', true),
  ('SEDRONAR', 'RENPRE-F05', 'Formulario F05', 5000.00, 'ARS', 'Precursores Químicos', '2025-01-01', '2025-12-31', null, 'Por operación I/E', true),
  
  -- ANMaC
  ('ANMAC', 'LUC-COMERCIAL', 'LUC Comercial', 35000.00, 'ARS', 'Materiales Controlados', '2025-01-01', '2025-12-31', null, 'Licencia anual', true),
  ('ANMAC', 'ANMAC-IMPORT', 'Inscripción Importador', 40000.00, 'ARS', 'Materiales Controlados', '2025-01-01', '2025-12-31', null, 'Registro importador', true),
  ('ANMAC', 'ANMAC-AUT-IMP', 'Autorización Importación', 8000.00, 'ARS', 'Materiales Controlados', '2025-01-01', '2025-12-31', null, 'Por operación', true),
  
  -- ENACOM
  ('ENACOM', 'HOMOLOG-ENACOM', 'Homologación Telecom', 45000.00, 'ARS', 'Telecomunicaciones', '2025-01-01', '2025-12-31', 'monto_base * numero_modelos', 'Por modelo', true),
  
  -- SIC
  ('SIC', 'SEG-ELECTRICA', 'Seguridad Eléctrica', 35000.00, 'ARS', 'Seguridad de Productos', '2025-01-01', '2025-12-31', 'monto_base * numero_modelos', 'Por modelo', true),
  ('SIC', 'EFIC-ENERGETICA', 'Eficiencia Energética', 28000.00, 'ARS', 'Eficiencia Energética', '2025-01-01', '2025-12-31', 'monto_base * numero_modelos', 'Por modelo', true),
  
  -- INPI
  ('INPI', 'MARCA-REG', 'Registro de Marca', 65000.00, 'ARS', 'Propiedad Intelectual', '2025-01-01', '2025-12-31', null, 'Vigencia 10 años', true),
  ('INPI', 'MARCA-REN', 'Renovación Marca', 45000.00, 'ARS', 'Propiedad Intelectual', '2025-01-01', '2025-12-31', null, 'Cada 10 años', true);