# Supabase Storage Configuration for SGT v5

## Required Storage Buckets

### 1. `plantillas` Bucket
**Purpose:** Store template PDF/DOCX files for automatic form generation

**Configuration:**
- Public: No (requires authentication)
- File size limit: 10 MB
- Allowed file types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document

**Directory Structure:**
```
plantillas/
├── anmat/
│   ├── DDJJ_Cosmeticos_7939.pdf
│   └── Formulario_DM.pdf
├── sedronar/
│   └── F05_RENPRE.pdf
├── inal/
│   └── DDJJ_Equivalencia_35_2025.pdf
├── senasa/
│   └── DDJJ_Producto_Animal.pdf
└── auto-generated/
    └── (generated forms stored here)
```

**RLS Policies:**
```sql
-- Allow authenticated users to read templates
CREATE POLICY "Authenticated users can read templates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'plantillas');

-- Allow system to write auto-generated files
CREATE POLICY "System can write auto-generated files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'plantillas' AND
  (storage.foldername(name))[1] = 'auto-generated'
);
```

### 2. `documentos-expedientes` Bucket
**Purpose:** Store uploaded documents from clients and staff

**Configuration:**
- Public: No (requires authentication)
- File size limit: 25 MB
- Allowed file types: All common document formats (PDF, DOCX, XLSX, JPG, PNG, etc.)

**RLS Policies:**
```sql
-- Allow users to upload documents to their accessible expedientes
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-expedientes'
);

-- Allow users to read documents from their accessible expedientes
CREATE POLICY "Users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documentos-expedientes');

-- Allow users to delete their uploaded documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documentos-expedientes');
```

## Setup Instructions

### Via Supabase Dashboard

1. Navigate to Storage in your Supabase dashboard
2. Click "Create a new bucket"
3. Create `plantillas` bucket:
   - Name: `plantillas`
   - Public: OFF
   - File size limit: 10485760 bytes (10 MB)
4. Create `documentos-expedientes` bucket:
   - Name: `documentos-expedientes`
   - Public: OFF
   - File size limit: 26214400 bytes (25 MB)
5. Configure RLS policies using the SQL Editor

### Via SQL

```sql
-- Create plantillas bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('plantillas', 'plantillas', false);

-- Create documentos-expedientes bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-expedientes', 'documentos-expedientes', false);
```

## Upload Template Files

After creating the buckets, upload your template PDF files to the appropriate directories in the `plantillas` bucket. These templates should be:

1. **Clean PDF forms** with editable fields
2. **Properly named fields** that match the mapeo_formularios.json configuration
3. **Tested** to ensure all fields are fillable programmatically

## Usage in Code

```typescript
// Download a template
const { data, error } = await supabase.storage
  .from('plantillas')
  .download('anmat/DDJJ_Cosmeticos_7939.pdf');

// Upload a generated document
const { data, error } = await supabase.storage
  .from('plantillas')
  .upload('auto-generated/[AUTO]_DDJJ_COSM_123456.pdf', pdfBuffer);

// Upload a user document
const { data, error } = await supabase.storage
  .from('documentos-expedientes')
  .upload(`${expedienteId}/documento_${timestamp}.pdf`, file);
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never make buckets public** unless absolutely necessary
2. **Always implement RLS policies** to restrict access
3. **Validate file types** before upload on the client side
4. **Implement file size limits** to prevent abuse
5. **Use signed URLs** for temporary access when needed
6. **Audit all storage operations** for compliance

## Signed URLs for Temporary Access

```typescript
// Create a signed URL that expires in 1 hour
const { data, error } = await supabase.storage
  .from('plantillas')
  .createSignedUrl('anmat/DDJJ_Cosmeticos_7939.pdf', 3600);

// Use the signed URL
const signedUrl = data?.signedUrl;
```

## Monitoring & Maintenance

- **Regularly review** storage usage in dashboard
- **Clean up** old auto-generated files periodically
- **Back up** template files to external storage
- **Monitor** failed upload attempts for potential issues
- **Update** templates when regulatory requirements change

## Template Management Workflow

1. **Obtain official template** from regulatory agency
2. **Ensure PDF has editable fields** (use Adobe Acrobat or similar)
3. **Map field names** in mapeo_formularios.json
4. **Upload to appropriate folder** in plantillas bucket
5. **Test generation** with sample data
6. **Document** any special requirements or limitations
