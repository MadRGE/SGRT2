-- Add Envases division to anmat_divisiones

INSERT INTO anmat_divisiones (codigo, nombre, descripcion, activo) VALUES
  ('ENVASES', 'Envases', 'Registro de envases y materiales en contacto con alimentos', true)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  activo = EXCLUDED.activo,
  updated_at = now();
