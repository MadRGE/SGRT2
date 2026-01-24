/*
  # Add auth_user_id to usuarios table

  1. Changes
    - Add `auth_user_id` column to link usuarios with auth.users
    - Add index for performance
    - Update existing records if needed

  2. Security
    - No changes to RLS policies needed
*/

-- Add auth_user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);
  END IF;
END $$;
