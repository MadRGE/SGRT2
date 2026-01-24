import { supabase } from '../lib/supabase';

export interface ArancelOficial {
  id: string;
  organismo_id: string;
  codigo_tramite: string;
  descripcion: string;
  monto: number;
  moneda: string;
  categoria?: string;
  vigencia_desde: string;
  vigencia_hasta?: string;
  formula_calculo?: string;
  notas_aplicacion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export class ArancelesService {
  static async getArancelesByOrganismo(organismoId: string): Promise<ArancelOficial[]> {
    try {
      const { data, error } = await supabase
        .from('aranceles_oficiales')
        .select('*')
        .eq('organismo_id', organismoId)
        .eq('activo', true)
        .order('codigo_tramite');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching aranceles:', error);
      return [];
    }
  }

  static async getArancelesByCategoria(categoria: string): Promise<ArancelOficial[]> {
    try {
      const { data, error } = await supabase
        .from('aranceles_oficiales')
        .select('*')
        .eq('categoria', categoria)
        .eq('activo', true)
        .order('monto', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching aranceles by category:', error);
      return [];
    }
  }

  static async searchAranceles(searchTerm: string): Promise<ArancelOficial[]> {
    try {
      const { data, error } = await supabase
        .from('aranceles_oficiales')
        .select('*')
        .eq('activo', true)
        .or(`descripcion.ilike.%${searchTerm}%,codigo_tramite.ilike.%${searchTerm}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching aranceles:', error);
      return [];
    }
  }

  static async getArancelByCodigo(codigo: string, organismoId?: string): Promise<ArancelOficial | null> {
    try {
      let query = supabase
        .from('aranceles_oficiales')
        .select('*')
        .eq('codigo_tramite', codigo)
        .eq('activo', true);

      if (organismoId) {
        query = query.eq('organismo_id', organismoId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching arancel by code:', error);
      return null;
    }
  }

  static async getAllAranceles(): Promise<ArancelOficial[]> {
    try {
      const { data, error } = await supabase
        .from('aranceles_oficiales')
        .select('*')
        .eq('activo', true)
        .order('organismo_id')
        .order('codigo_tramite');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all aranceles:', error);
      return [];
    }
  }

  static formatMonto(monto: number, moneda: string = 'ARS'): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2
    }).format(monto);
  }

  static async getArancelesSummaryByOrganismo(): Promise<Record<string, { count: number; total: number }>> {
    try {
      const aranceles = await this.getAllAranceles();
      const summary: Record<string, { count: number; total: number }> = {};

      aranceles.forEach(arancel => {
        if (!summary[arancel.organismo_id]) {
          summary[arancel.organismo_id] = { count: 0, total: 0 };
        }
        summary[arancel.organismo_id].count += 1;
        summary[arancel.organismo_id].total += arancel.monto;
      });

      return summary;
    } catch (error) {
      console.error('Error getting aranceles summary:', error);
      return {};
    }
  }

  static async createArancel(arancel: Partial<ArancelOficial>): Promise<{ success: boolean; data?: ArancelOficial; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('aranceles_oficiales')
        .insert([arancel])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async updateArancel(id: string, updates: Partial<ArancelOficial>): Promise<{ success: boolean; data?: ArancelOficial; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('aranceles_oficiales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async deactivateArancel(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('aranceles_oficiales')
        .update({ activo: false })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
