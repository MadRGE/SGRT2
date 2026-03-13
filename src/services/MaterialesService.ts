/**
 * MaterialesService — Material catalog for envase registration
 *
 * Provides material lookup, auto-detection from text,
 * and ANMAT classification helpers.
 */

import { supabase } from '../lib/supabase';

export interface Material {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  clasificacion_anmat: string;
  temp_min: number;
  temp_max: number;
  temp_ambiente: number;
  microondas: boolean;
  lavavajillas: boolean;
  bpa_free: boolean;
  alimentos: string[];
  riesgo: string;
  keywords: string[];
}

// Cache materials in memory after first load
let _materialesCache: Material[] | null = null;

export async function getMateriales(): Promise<Material[]> {
  if (_materialesCache) return _materialesCache;

  const { data, error } = await supabase
    .from('anmat_materiales_catalog')
    .select('*')
    .eq('activo', true)
    .order('categoria', { ascending: true });

  if (error) {
    console.error('Error loading materials:', error);
    return [];
  }

  _materialesCache = (data || []) as Material[];
  return _materialesCache;
}

export async function getMaterialByCodigo(codigo: string): Promise<Material | null> {
  const mats = await getMateriales();
  return mats.find(m => m.codigo === codigo) || null;
}

/**
 * Auto-detect material from product description text.
 * Returns the best matching material code, or null.
 */
export async function detectMaterial(text: string): Promise<string | null> {
  const mats = await getMateriales();
  const textLower = text.toLowerCase();

  for (const mat of mats) {
    for (const kw of mat.keywords) {
      if (textLower.includes(kw.toLowerCase())) {
        return mat.codigo;
      }
    }
  }

  return null;
}

/**
 * Given a list of material codes used in a product,
 * determine which ANMAT material checkboxes should be checked.
 */
export async function getMaterialCheckboxes(materialCodes: string[]): Promise<Record<string, boolean>> {
  const mats = await getMateriales();
  const used = mats.filter(m => materialCodes.includes(m.codigo));

  const clasificaciones = new Set(used.map(m => m.clasificacion_anmat.toLowerCase()));

  return {
    plasticos: [...clasificaciones].some(c => c.includes('plástico')),
    celulosas: [...clasificaciones].some(c => c.includes('celulosa')),
    elastomeros: [...clasificaciones].some(c => c.includes('elastómero') || c.includes('caucho')),
    papeles: [...clasificaciones].some(c => c.includes('papel') || c.includes('cartón')),
    metales: [...clasificaciones].some(c => c.includes('metal')),
    pet_reciclado: false,
    ceramicas: [...clasificaciones].some(c => c.includes('cerámica')),
    madera: [...clasificaciones].some(c => c.includes('madera')),
    corcho: false,
    vidrio: [...clasificaciones].some(c => c.includes('vidrio')),
    otros: false,
  };
}

/**
 * Determine risk classification based on materials used.
 */
export async function determineRiesgo(materialCodes: string[]): Promise<string> {
  const mats = await getMateriales();
  const used = mats.filter(m => materialCodes.includes(m.codigo));

  if (used.some(m => m.riesgo === 'alto')) return 'Riesgo alto';
  if (used.some(m => m.riesgo === 'medio')) return 'Riesgo medio';
  return 'Riesgo bajo';
}

/**
 * Get grouped materials for UI selection.
 */
export async function getMaterialesAgrupados(): Promise<Record<string, Material[]>> {
  const mats = await getMateriales();
  const grouped: Record<string, Material[]> = {};

  for (const m of mats) {
    const cat = m.categoria;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(m);
  }

  return grouped;
}
