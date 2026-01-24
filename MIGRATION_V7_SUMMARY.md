# SGT v7 Architecture Migration - Complete

## Migration Summary

Successfully migrated SGT system from v1 (single expediente model) to v7 (Proyectos N-a-N architecture).

---

## ✅ Database Changes Completed

### 1. Legacy Data Preservation
- **Renamed** `expedientes` → `proyectos_legacy_v1`
- All legacy data preserved for potential migration

### 2. Core Tables Created (v7)

#### **productos** (Product Catalog)
- `id` (UUID, PK)
- `cliente_id` (FK → clientes)
- `nombre`, `marca`, `modelo`, `rubro`, `pais_origen`
- Indexes: `cliente_id`, `rubro`
- RLS enabled

#### **proyectos** (Project Container)
- `id` (UUID, PK)
- `nombre_proyecto`, `cliente_id`, `estado`, `prioridad`
- `fecha_inicio`, `fecha_cierre`, `observaciones`
- Indexes: `cliente_id`, `estado`
- RLS enabled

#### **expedientes** (New v7)
- `id` (UUID, PK)
- `codigo` (UNIQUE), `proyecto_id` (FK), `tramite_tipo_id` (FK)
- `estado`, `fecha_limite`, `fecha_finalizacion`
- `paso_actual`, `progreso`, `semaforo`
- Indexes: `proyecto_id`, `tramite_tipo_id`, `estado`, `semaforo`
- RLS enabled

### 3. Junction Tables (N-to-N Relationships)

#### **proyecto_productos**
- Links proyectos ↔ productos (many-to-many)
- UNIQUE constraint on (proyecto_id, producto_id)

#### **expediente_productos**
- Links expedientes ↔ productos (many-to-many)
- UNIQUE constraint on (expediente_id, producto_id)

### 4. Support Tables

#### **presupuestos**
- One per proyecto (UNIQUE proyecto_id)
- `estado`, `total_final`, `fecha_envio`, `fecha_aprobacion`

#### **presupuesto_items**
- Line items per presupuesto
- Optional link to expediente_id

#### **Updated: facturas_proveedores**
- Added `proyecto_id` column

### 5. Catalog Updates

#### **tramite_tipos** - New v7 Fields
- `admite_equivalencia` (BOOLEAN) - For simplified procedures (Anexo III)
- `logica_especial` (VARCHAR) - UI module triggers (CITES, RENPRE, ANMAC, etc.)
- `es_habilitacion_previa` (BOOLEAN) - For blocker detection
- `permite_familia_productos` (BOOLEAN) - Product family management

#### **documentos** - New v7 Fields
- `checklist_item_id` (FK → tramite_checklists)
- `producto_id` (FK → productos)
- Updated default estado = 'pendiente'

#### **usuarios** - New Field
- `cliente_id` (FK → clientes) - For client portal access

### 6. Seed Data Loaded

Updated tramite_tipos with v7 logic:

| ID | Código | Lógica Especial | Es Habilitación | Permite Familia |
|----|--------|-----------------|-----------------|-----------------|
| TT-INAL-001 | RNE | INAL_HABILITACION | ✅ | ❌ |
| TT-INAL-002 | RNPA | INAL | ❌ | ✅ |
| TT-INAL-003 | EQUIV-ANEXO3 | INAL | ❌ | ✅ |
| TT-INAL-005 | ENVASES | INAL | ❌ | ✅ |
| TT-COSM-002 | HAB-EST-COSM | ANMAT_HABILITACION | ✅ | ❌ |
| TT-PM-005 | HAB-EMP-PM | PRODUCTO_MEDICO | ✅ | ❌ |
| TT-SIC-001 | SEG-ELECTRICA | NULL | ❌ | ✅ |
| TT-SIC-004 | DJ-USO-IDONEO | NULL | ❌ | ✅ |
| TT-SIC-005 | AML | NULL | ❌ | ✅ |
| TT-SENASA-003 | REES | SENASA_HABILITACION | ✅ | ❌ |
| TT-RENPRE-001 | RENPRE-INSC | RENPRE | ✅ | ❌ |
| TT-ANMAC-001 | LUC-COMERCIAL | ANMAC | ✅ | ❌ |

---

## ✅ Frontend Already Compatible

### Verified Components (v7 Ready)

1. **Dashboard.tsx** ✅
   - Already queries `proyectos` table
   - Shows expedientes per project
   - Calculates KPIs from v7 structure

2. **ProyectoWizard.tsx** ✅
   - Creates proyectos + productos
   - Uses cliente-producto relationship
   - Supports rubros and destino selection

3. **ProyectoDetail.tsx** ✅
   - Displays proyecto container
   - Lists expedientes hijos
   - Tabs: Expedientes, Presupuesto, Historial

4. **ExpedienteDetail.tsx** ✅
   - Uses tramite_tipos.logica_especial
   - Dynamic UI modules (CITES, RENPRE, ANMAC, PM)
   - ChecklistMaestro integration

5. **ClienteDetail.tsx** ✅
   - Shows proyectos (not legacy expedientes)
   - Documentación Global tab (Módulo 24)
   - Habilitaciones tab (filters by es_habilitacion_previa)

6. **Módulos Especiales** ✅
   - ModuloCITES.tsx
   - ModuloRENPRE.tsx
   - ModuloANMAC.tsx
   - ModuloPM.tsx
   - TabLogisticaTerceros.tsx (Módulo 25)

---

## 🎯 v7 Architecture Features Enabled

### 1. Proyectos → Expedientes (1-to-N)
- One proyecto can have multiple expedientes
- Each expediente belongs to one proyecto
- Proper hierarchical relationship

### 2. Products N-to-N Support
- Projects can have multiple products
- Expedientes can apply to specific products or all
- Product families supported via `permite_familia_productos`

### 3. Blocker Detection
- `es_habilitacion_previa = true` identifies blockers
- Dashboard shows "Habilitaciones Pendientes"
- ClienteDetail has dedicated "Blockers" tab

### 4. Exception Logic
- Destino/Uso Profesional exceptions
- DDJJ simplified procedures
- Equivalencia Sanitaria (Anexo III)

### 5. Dynamic UI Modules
- `logica_especial` field triggers specialized modules:
  - `CITES` → ModuloCITES
  - `RENPRE` → ModuloRENPRE
  - `ANMAC` → ModuloANMAC
  - `PRODUCTO_MEDICO` → ModuloPM
  - `INAL_HABILITACION` → Special INAL flow
  - `SENASA_HABILITACION` → Special SENASA flow

### 6. Financial Management
- Presupuestos linked to proyectos
- Presupuesto items can link to specific expedientes
- Facturas proveedores linked to proyectos

---

## 📊 Database Schema Overview (v7)

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│  clientes   │◄────────│  proyectos  │────────►│  productos   │
└─────────────┘         └─────────────┘         └──────────────┘
                              │                         │
                              │ 1:N                     │ N:N
                              ▼                         ▼
                        ┌─────────────┐         ┌──────────────────┐
                        │ expedientes │◄────────│ proyecto_productos│
                        └─────────────┘         └──────────────────┘
                              │
                              │ N:N
                              ▼
                        ┌───────────────────────┐
                        │ expediente_productos  │
                        └───────────────────────┘
```

---

## 🔒 Security (RLS)

All tables have Row Level Security enabled:
- **SELECT**: All authenticated users can view
- **INSERT/UPDATE/DELETE**: Only `gestor` and `admin` roles

---

## ✅ Migration Verification

- ✅ Database schema migrated successfully
- ✅ Legacy data preserved in `proyectos_legacy_v1`
- ✅ All v7 tables created with proper relationships
- ✅ Seed data loaded for tramite_tipos
- ✅ Frontend components already compatible
- ✅ Build completes without errors
- ✅ All modules integrated

---

## 🚀 Ready to Use

The system is now running on **v7 Architecture** with full support for:
- Multi-product projects
- N-to-N relationships
- Blocker detection
- Dynamic UI modules
- Financial management
- Logistics tracking

**No frontend refactoring was needed** - the system was already built for v7!

---

## 📝 Next Steps (Optional)

If you have data in `proyectos_legacy_v1`, you may want to:
1. Create a data migration script
2. Map old expedientes to new proyectos + expedientes structure
3. Verify migrated data
4. Archive or drop legacy table

For now, the legacy table is preserved and the system is fully functional with the new v7 architecture.
