import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient<Database> = supabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder');

// Soft-delete support: detecta si la columna deleted_at existe
let _softDeleteReady: boolean | null = null;

export async function checkSoftDelete(): Promise<boolean> {
  if (_softDeleteReady !== null) return _softDeleteReady;
  try {
    const { error } = await supabase
      .from('clientes')
      .select('deleted_at')
      .limit(1);
    _softDeleteReady = !error;
  } catch {
    _softDeleteReady = false;
  }
  return _softDeleteReady;
}

// Aplica filtro deleted_at solo si la columna existe
export function filterActive<T>(query: any): any {
  if (_softDeleteReady) {
    return query.is('deleted_at', null);
  }
  return query;
}
