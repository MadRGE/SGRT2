-- FIX: Arreglar RLS en tramite_tipos para que el catalogo sea visible
-- El problema: RLS habilitado pero sin policy funcional = 0 filas visibles

-- Opcion 1: Eliminar policies existentes rotas y crear nueva
DROP POLICY IF EXISTS "Allow all for authenticated" ON tramite_tipos;
DROP POLICY IF EXISTS "tramite_tipos_policy" ON tramite_tipos;

-- Crear policy permisiva: cualquier usuario autenticado puede leer/escribir
CREATE POLICY "Allow read for all" ON tramite_tipos FOR SELECT USING (true);
CREATE POLICY "Allow write for authenticated" ON tramite_tipos FOR ALL USING (auth.role() = 'authenticated');

-- Verificacion: debe mostrar filas
SELECT organismo, count(*) as total FROM tramite_tipos GROUP BY organismo ORDER BY organismo;
