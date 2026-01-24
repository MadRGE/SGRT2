/*
  # Migration to v7 Architecture - Part 4: Catalog Updates

  This migration updates existing catalog tables with v7 fields:
  - tramite_tipos: Add v7 logic fields (admite_equivalencia, logica_especial, etc.)
  - documentos: Add checklist_item_id and producto_id
  - usuarios: Add cliente_id for portal access

  ## Updates
  1. tramite_tipos table
    - Add admite_equivalencia (for simplified procedures)
    - Add logica_especial (for special UI modules: CITES, RENPRE, ANMAC, etc.)
    - Add es_habilitacion_previa (for blocker detection)
    - Add permite_familia_productos (for product family management)

  2. documentos table
    - Add checklist_item_id (link to tramite_checklists)
    - Add producto_id (for product-specific documents)
    - Update default estado

  3. usuarios table
    - Add cliente_id (for client portal access)
*/

-- ============================================
-- UPDATE TRAMITE_TIPOS TABLE
-- ============================================
DO $$
BEGIN
  -- Add admite_equivalencia column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tramite_tipos' AND column_name = 'admite_equivalencia'
  ) THEN
    ALTER TABLE tramite_tipos ADD COLUMN admite_equivalencia BOOLEAN DEFAULT false;
  END IF;

  -- Add logica_especial column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tramite_tipos' AND column_name = 'logica_especial'
  ) THEN
    ALTER TABLE tramite_tipos ADD COLUMN logica_especial VARCHAR(50) NULL;
  END IF;

  -- Add es_habilitacion_previa column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tramite_tipos' AND column_name = 'es_habilitacion_previa'
  ) THEN
    ALTER TABLE tramite_tipos ADD COLUMN es_habilitacion_previa BOOLEAN DEFAULT false;
  END IF;

  -- Add permite_familia_productos column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tramite_tipos' AND column_name = 'permite_familia_productos'
  ) THEN
    ALTER TABLE tramite_tipos ADD COLUMN permite_familia_productos BOOLEAN DEFAULT false;
  END IF;

  -- Create indexes for new columns
  CREATE INDEX IF NOT EXISTS idx_tramite_tipos_logica_especial ON tramite_tipos(logica_especial);
  CREATE INDEX IF NOT EXISTS idx_tramite_tipos_es_habilitacion ON tramite_tipos(es_habilitacion_previa);
END $$;

-- ============================================
-- UPDATE DOCUMENTOS TABLE
-- ============================================
DO $$
BEGIN
  -- Add checklist_item_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'checklist_item_id'
  ) THEN
    ALTER TABLE documentos ADD COLUMN checklist_item_id INTEGER REFERENCES tramite_checklists(id) ON DELETE SET NULL;
    CREATE INDEX idx_documentos_checklist_item ON documentos(checklist_item_id);
  END IF;

  -- Add producto_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'producto_id'
  ) THEN
    ALTER TABLE documentos ADD COLUMN producto_id UUID REFERENCES productos(id) ON DELETE SET NULL;
    CREATE INDEX idx_documentos_producto ON documentos(producto_id);
  END IF;

  -- Update default estado if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documentos' AND column_name = 'estado'
  ) THEN
    ALTER TABLE documentos ALTER COLUMN estado SET DEFAULT 'pendiente';
  END IF;
END $$;

-- ============================================
-- UPDATE USUARIOS TABLE
-- ============================================
DO $$
BEGIN
  -- Add cliente_id column for portal access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'cliente_id'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
    CREATE INDEX idx_usuarios_cliente ON usuarios(cliente_id);
  END IF;
END $$;