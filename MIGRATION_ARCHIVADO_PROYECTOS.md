# Migration Required: Add archivado Column to proyectos Table

## Overview
To enable the archive functionality for projects, you need to add the `archivado` column to the `proyectos` table.

## SQL Migration

Run the following SQL in your Supabase SQL Editor:

```sql
-- Add archivado column to proyectos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proyectos' AND column_name = 'archivado'
  ) THEN
    ALTER TABLE proyectos ADD COLUMN archivado BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add index for filtering archived projects
CREATE INDEX IF NOT EXISTS idx_proyectos_archivado ON proyectos(archivado);

-- Add comment to explain the column
COMMENT ON COLUMN proyectos.archivado IS 'Soft deletion flag - archived projects are hidden from main views but can be restored';
```

## How to Apply

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Paste the SQL above
4. Click "Run"

## What This Enables

After running this migration, users will be able to:

- **Archive projects** instead of deleting them permanently
- **View archived projects** in a separate filtered view
- **Restore archived projects** back to active status
- **Separate expedientes** into new projects when needed
- **Delete projects permanently** (admin only) with confirmation

## Features Added

### ProyectoDetail Page
- Dropdown menu with actions (Archive, Split, Delete)
- Archive modal with confirmation
- Delete modal with strict confirmation (admin only)
- Split expedientes modal with selection interface

### Dashboard Page
- Toggle between active and archived projects
- Restore button for archived projects
- Visual distinction for archived projects (grayed out)
- Badge indicating archived status

## Important Notes

- The `archivado` column defaults to `false` for all existing projects
- Archived projects are automatically excluded from active project counts
- Archived projects maintain all their data and can be restored at any time
- Only admins can permanently delete projects
- Splitting expedientes requires at least 2 expedientes in the project
