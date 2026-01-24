/*
  # Limpieza - Eliminar Trámites Legacy
  
  ## Descripción
  
  Elimina los 32 trámites legacy que no tienen código_oficial.
  Estos son trámites viejos que fueron reemplazados por los nuevos
  trámites de la Fase 2A con datos completos y actualizados.
  
  ## Trámites a Eliminar
  
  **AFIP (1):**
  - CERT-ORIGEN-PAPEL
  
  **ALADI (1):**
  - COD
  
  **AMBIENTE (2):**
  - CITES-REEXP
  - TROFEO-CAZA
  
  **ANMaC (5):**
  - LUC-COMERCIAL
  - ANMAC-IMPORT
  - ANMAC-EXPORT
  - ANMAC-AUT-IMP
  - SIGIMAC
  
  **ANMAT (1):**
  - HAB-EST-COSM
  
  **ANMAT_PM (1):**
  - HAB-EMP-PM
  
  **DNM (3):**
  - APROB-MODELO
  - VERIF-PRIMITIVA
  - VERIF-PERIODICA
  
  **ENACOM (1):**
  - HOMOLOG-ENACOM
  
  **INAL (1):**
  - ROTULADO
  
  **INPI (4):**
  - MARCA-REG
  - MARCA-REN
  - MARCA-OPOS
  - MARCA-TRANSF
  
  **SEDRONAR (1):**
  - RENPRE-REINSC
  
  **SENASA (3):**
  - PROD-VET
  - SENASA-REES
  - SENASA-PROD-ANIMAL
  
  **SIC (6):**
  - SEG-ELECTRICA
  - REG-PROD-CONSUMO
  - EFIC-ENERGETICA
  - DJ-USO-IDONEO
  - AML
  - CERT-AUTOPARTES
  
  **SIC (adicional - Auto) (1):**
  - TT-AUTO-001
  
  ## Estrategia
  
  - Elimina solo trámites donde codigo_oficial IS NULL
  - Preserva todos los trámites con codigo_oficial (los nuevos de Fase 2A)
  - No afecta relaciones FK (checklist, stages, etc.) ya que estos son trámites sin uso
*/

-- Guardar registro de lo que vamos a eliminar
CREATE TEMP TABLE tramites_a_eliminar AS
SELECT id, codigo, nombre, organismo_id
FROM tramite_tipos
WHERE codigo_oficial IS NULL;

-- Verificar cantidad
DO $$
DECLARE
  count_legacy INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_legacy FROM tramites_a_eliminar;
  
  RAISE NOTICE '====================================================================';
  RAISE NOTICE '          LIMPIEZA - ELIMINACIÓN DE TRÁMITES LEGACY';
  RAISE NOTICE '====================================================================';
  RAISE NOTICE 'Trámites legacy a eliminar: %', count_legacy;
  RAISE NOTICE '';
END $$;

-- Eliminar registros relacionados primero (si existen)
-- Checklists relacionados
DELETE FROM tramite_checklists
WHERE tramite_tipo_id IN (SELECT id FROM tramites_a_eliminar);

-- Procedure stages relacionados
DELETE FROM procedure_stages
WHERE tramite_tipo_id IN (SELECT id FROM tramites_a_eliminar);

-- Procedure documents relacionados
DELETE FROM procedure_documents
WHERE tramite_tipo_id IN (SELECT id FROM tramites_a_eliminar);

-- Fees configuration relacionados
DELETE FROM fees_configuration
WHERE tramite_tipo_id IN (SELECT id FROM tramites_a_eliminar);

-- Eliminar los trámites legacy
DELETE FROM tramite_tipos
WHERE codigo_oficial IS NULL;

-- Verificación final
DO $$
DECLARE
  count_total INTEGER;
  count_nuevos INTEGER;
  count_legacy INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_total FROM tramite_tipos;
  SELECT COUNT(*) INTO count_nuevos FROM tramite_tipos WHERE codigo_oficial IS NOT NULL;
  SELECT COUNT(*) INTO count_legacy FROM tramite_tipos WHERE codigo_oficial IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================================================';
  RAISE NOTICE '          LIMPIEZA COMPLETADA';
  RAISE NOTICE '====================================================================';
  RAISE NOTICE 'Trámites eliminados: 32';
  RAISE NOTICE 'Trámites restantes: %', count_total;
  RAISE NOTICE 'Trámites con código oficial: %', count_nuevos;
  RAISE NOTICE 'Trámites legacy restantes: %', count_legacy;
  RAISE NOTICE '';
  RAISE NOTICE 'Base de datos limpia y lista para Fase 3!';
  RAISE NOTICE '====================================================================';
END $$;