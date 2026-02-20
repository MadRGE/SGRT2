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
let _softDeleteChecked = false;

export async function checkSoftDelete(): Promise<boolean> {
  if (_softDeleteChecked) return _softDeleteReady === true;
  _softDeleteChecked = true;
  try {
    const { error } = await supabase
      .from('clientes')
      .select('deleted_at')
      .limit(1);
    _softDeleteReady = !error;
  } catch {
    _softDeleteReady = false;
  }
  return _softDeleteReady === true;
}

// Aplica filtro deleted_at solo si la columna existe
export function filterActive<T>(query: any): any {
  if (_softDeleteReady) {
    return query.is('deleted_at', null);
  }
  return query;
}

// Intenta soft-delete, si falla hace hard-delete
export async function softDelete(table: string, column: string, value: string): Promise<'soft' | 'hard'> {
  const now = new Date().toISOString();
  const { error } = await supabase.from(table).update({ deleted_at: now }).eq(column, value);
  if (error) {
    // Columna no existe, hacer hard-delete
    await supabase.from(table).delete().eq(column, value);
    return 'hard';
  }
  return 'soft';
}

// Seguimiento user tracking: detecta si la columna usuario_id existe
let _segUserColReady: boolean | null = null;
let _segUserColChecked = false;

export async function checkSeguimientoUserCol(): Promise<boolean> {
  if (_segUserColChecked) return _segUserColReady === true;
  _segUserColChecked = true;
  try {
    const { error } = await supabase
      .from('seguimientos')
      .select('usuario_id')
      .limit(1);
    _segUserColReady = !error;
  } catch {
    _segUserColReady = false;
  }
  return _segUserColReady === true;
}

export function buildSeguimientoData(
  base: Record<string, unknown>,
  user: { id: string; user_metadata?: Record<string, unknown>; email?: string } | null
): Record<string, unknown> {
  const data = { ...base };
  if (_segUserColReady && user) {
    data.usuario_id = user.id;
    data.usuario_nombre = (user.user_metadata?.nombre as string) || user.email || null;
  }
  return data;
}
