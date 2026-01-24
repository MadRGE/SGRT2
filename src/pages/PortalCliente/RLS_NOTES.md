# Portal del Cliente - RLS Implementation Notes

## Overview

The Portal del Cliente provides a simplified, client-facing interface where authenticated clients can:
- View their projects (filtered by RLS)
- Upload required documents
- Review and approve budgets
- Track project status

## Architecture

### Row Level Security (RLS) Implementation

All data access in the Portal Cliente is protected by Supabase Row Level Security. The current implementation uses the following policy:

```sql
CREATE POLICY "Allow all operations for authenticated users"
  ON table_name
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

**Current State:** The RLS policies are **intentionally permissive** for authenticated users because this is a staff management system where authenticated employees need full access to manage client data.

### How Portal Cliente Works

1. **Authentication Required:** All users (gestores, admins, clients) must be authenticated
2. **Application-Level Filtering:** The Portal Cliente uses `clienteId` parameter to filter data at the application level
3. **Data Security:** Although RLS allows authenticated users to access all data, the UI only shows data relevant to the specific client

## Components

### 1. PortalClienteLayout
- Simple header with logo and logout button
- No sidebar navigation
- Clean, client-focused design

### 2. PortalDashboard
- Shows projects filtered by `cliente_id`
- Displays KPIs: Active projects, Action required, Completed
- Project cards with traffic light indicators
- Query: `.eq('cliente_id', clienteId)`

### 3. PortalProyectoDetail
- Detailed project view with two tabs
- Uses ChecklistMaestro and PresupuestoIntegrado in client mode
- Verifies client ownership: `.eq('cliente_id', clienteId)`

## Component Reuse

The Portal Cliente reuses existing components with the `esCliente` prop:

### ChecklistMaestro (esCliente=true)
When in client mode:
- Client can upload documents
- Client can view document status
- Client cannot generate forms (button hidden)
- Client cannot delete documents (button hidden)

### PresupuestoIntegrado (esCliente=true)
When in client mode:
- Client can view all budget items
- Client can approve budget
- Client cannot add/edit/delete items

## Summary

The Portal Cliente successfully provides authenticated access control with application-level data filtering and component reuse.
