# SGRT2 v3 — Upgrade Design Spec

**Date:** 2026-03-17
**Author:** Max + Claude
**Approach:** C — Enlatar desde Facundo + construir lógica regulatoria específica

---

## Overview

Migrar SGRT2 de Vite+React+Supabase+FastAPI a Next.js 16 + Prisma 7 + Neon + Tailwind 4. Matar el backend Python, unificar todo en API Routes. El nodo del gestor (Max) en el ecosistema Mckein.

**NO incluye:** Cotizaciones/QR, facturación. Es herramienta operativa pura.

---

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **ORM:** Prisma 7 + PrismaPg adapter
- **DB:** Neon Postgres (proyecto nuevo)
- **CSS:** Tailwind 4
- **Auth:** JWT custom (como Facundo) + Master Auth (Max/Javi)
- **Deploy:** Vercel
- **Icons:** Lucide React

---

## Reutilizado de Facundo

- Auth JWT + Master Auth + MasterDevice fingerprinting
- proxy.ts con protección de rutas
- Layout dual: Sidebar (gestor) + PortalShell (cliente)
- BottomTabBar mobile
- NotificationBell con polling
- Patrón CRUD de API Routes
- Prisma singleton + PrismaPg adapter
- Mckein SSO fallback + sync
- Tracking/audit trail

---

## Prisma Schema

### Organizacional (de Facundo)
- Studio, User, ClienteUser, MasterDevice

### Clientes & Productos
- **Cliente** — razonSocial, CUIT, email, tel, dirección, RNE, notas, deletedAt
- **Producto** — clienteId, nombre, marca, modelo, rubro, paisOrigen
- **ProductoEspecificacion** — productoId, tipo (enum), datosTecnicos (JSON), version

### Catálogo Regulatorio (seed desde JSON)
- **Organismo** — nombre, logoUrl (ANMAT, INAL, SENASA, etc.)
- **TramiteTipo** — código, nombre, organismoId, categoría, subcategoría, plazoDías, costoOrganismo, honorarios, plataforma, documentaciónObligatoria (JSON), observaciones, prioridad, activo

### Gestiones
- **Gestion** — clienteId, nombre, estado (5 estados), prioridad, fechaInicio, fechaCierre, descripción, deletedAt
- **Expediente** — gestionId, tramiteTipoId, código (unique), estado (9 estados), fechaLímite, pasoActual, progreso, semáforo, plataforma, deletedAt
- **ExpedienteProducto** — expedienteId, productoId, estadoIndividual, observaciones, certificadoUrl, numeroCertificado

### Documentos
- **Documento** — expedienteId?, clienteId?, nombre, archivoUrl, tipo, estado, obligatorio, responsable, vencimiento

### Presupuestos (estimación, NO facturación)
- **Presupuesto** — gestionId (unique), estado, totalOrganismo, totalHonorarios
- **PresupuestoItem** — presupuestoId, expedienteId?, concepto, tipo, monto, cantidad

### Aranceles
- **ArancelOficial** — organismoId, codigoTramite, monto, moneda, categoría, formulaCálculo, vigenciaDesde, vigenciaHasta

### Tracking
- Tracking, Notificacion, AuditLog (de Facundo)

### Integraciones
- **OrganismoAccion** — expedienteId, organismo, tipo, hammerId, estado, pasosEjecutados, pasosTotales
- **AlertaRegulatoria** — módulo, título, detalle, impacto, leída
- MckeinSync (de Facundo)

### ANMAT
- **AnmatCaso** — clienteId, nombre, descripción, estado
- **AnmatDivision** — nombre
- **AnmatRequisitoDoc** — casoId, divisionId, documento, requerido

### Mensajes
- Mensaje (de Facundo, chat staff↔cliente)

---

## State Machines

### Gestiones (5 estados)
```
relevamiento → en_curso | archivado
en_curso → en_espera | finalizado | archivado
en_espera → en_curso | archivado
finalizado → archivado
archivado → relevamiento
```

### Expedientes/Trámites (9 estados)
```
consulta → presupuestado | en_curso
presupuestado → en_curso | consulta
en_curso → esperando_cliente | esperando_organismo | observado | aprobado | rechazado
esperando_cliente → en_curso | observado
esperando_organismo → en_curso | observado | aprobado | rechazado
observado → en_curso | esperando_cliente | rechazado
aprobado → vencido
rechazado → consulta
vencido → consulta
```

### Semáforo automático
- verde: dentro de plazo, sin observaciones
- amarillo: quedan < 30 días O progreso >= 50%
- rojo: vencido O estado observado/rechazado

---

## Páginas

### Auth
- /login — Dual-tab (gestor + cliente)
- / — Landing

### Dashboard
- /inicio — KPIs, gestiones activas, vencimientos, actividad

### Clientes
- /clientes — Lista con CUIT, RNE, conteo gestiones
- /clientes/[id] — Detalle: datos, productos, gestiones, documentos

### Gestiones
- /gestiones — Lista filtrable por estado/cliente/organismo
- /gestiones/nueva — Wizard transaccional
- /gestiones/[id] — Detalle: expedientes, presupuesto, docs, tracking

### Trámites
- /tramites — Catálogo 535, filtrable
- /tramites/[id] — Detalle: código, docs, costos, SLA

### Módulos Organismo
- /anmat — Casos, herramientas, fichas
- /inal — RNE, RNPA, envases
- /senasa — RPV, fitosanitarios

### Herramientas
- /vencimientos — Dashboard expiración
- /finanzas — Presupuestos, aranceles (tracking, NO facturación)
- /vigia-regulatorio — Alertas por organismo
- /asistente-ia — Chat multi-LLM (de Fungi)
- /documentos — Gestión global
- /configuracion — Settings

### Portal Cliente
- /portal/gestiones — Sus gestiones + estado
- /portal/gestiones/[id] — Detalle read-only
- /portal/documentos — Sus documentos
- /portal/chat — Chat con gestor

---

## Lógica de negocio crítica

### 1. Wizard Nueva Gestión (transaccional)
1. Crear gestión (estado=relevamiento)
2. Por cada trámite seleccionado: crear expediente + auto-crear documentos desde documentación_obligatoria
3. Error parcial: navegar con warning. Error total: mostrar error.
4. Éxito: navegar a presupuesto

### 2. Fee Calculation
- FIJO: monto directo
- PORCENTAJE: monto_base × (porcentaje / 100)
- VARIABLE: evalúa condiciones contra variables producto
- Retorna { totalOrganismo, totalHonorarios } en ARS

### 3. Multi-product tracking
- Cada producto dentro de expediente tiene estado individual
- Certificados por producto

### 4. Hammer bridge
- POST /api/hammer/execute → CDP :18792
- GET /api/hammer/status/[id] → polling
- Tipos: tad_envase, afip_vep, tad_consulta, senasa_consulta

---

## Chunks de implementación

### Chunk 1: Base + Schema + Seed
- Clonar estructura de Facundo
- Prisma schema completo
- Proyecto Neon nuevo
- Seed: organismos + 535 tramites + admin
- Build + seed + login funciona

### Chunk 2: Core operativo
- Clientes CRUD
- Gestiones CRUD + wizard
- Expedientes + state machine + semáforo
- Catálogo trámites
- Dashboard KPIs
- Documentos CRUD

### Chunk 3: Módulos específicos
- ANMAT, INAL, SENASA
- Vencimientos
- Fee calculation + presupuestos
- Hammer bridge

### Chunk 4: Herramientas + Portal
- Portal Cliente read-only
- Vigía Regulatorio
- AI Assistant (de Fungi)
- Chat staff↔cliente (de Facundo)
- Configuración

---

## Exclusiones
- Cotizaciones/QR (fuera de scope)
- Facturación (es herramienta operativa, no factura)
- Despachante como portal separado (eso es Facundo)
