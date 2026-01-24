/*
  # Sync auth.users with usuarios table (v2)

  1. Purpose
    - Ensure all authenticated users exist in the usuarios table
    - Auto-sync new users when they sign up
    - Fix RLS policies that depend on usuarios table

  2. Changes
    - Remove default UUID generation from usuarios.id
    - Delete usuarios records that don't match auth.users
    - Insert all auth.users into usuarios table
    - Create function to handle new user creation
    - Create trigger on auth.users to auto-insert into usuarios

  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Sets default rol as 'gestor' for new users
*/

-- Remove default UUID generation from usuarios.id to accept auth.users.id
ALTER TABLE public.usuarios ALTER COLUMN id DROP DEFAULT;

-- Delete usuarios that don't exist in auth.users (orphaned records)
DELETE FROM public.usuarios u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users au WHERE au.id = u.id
);

-- Insert all auth.users into usuarios table
INSERT INTO public.usuarios (id, email, nombre, rol)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'nombre', au.email) as nombre,
  'gestor' as rol
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nombre = EXCLUDED.nombre;

-- Function to handle new user signup and sync to usuarios table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    'gestor'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = EXCLUDED.nombre;

  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();