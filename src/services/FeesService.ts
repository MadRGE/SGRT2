import { supabase } from '../lib/supabase';

export interface FeeConfiguration {
  id: string;
  tramite_tipo_id: string;
  concepto: string;
  monto_base: number;
  moneda: 'ARS' | 'USD';
  tipo_calculo: 'fijo' | 'variable' | 'porcentaje';
  formula: Record<string, any>;
  vigencia_desde: string;
  vigencia_hasta?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeCalculationResult {
  concepto: string;
  monto: number;
  moneda: 'ARS' | 'USD';
  detalles: Record<string, any>;
}

export class FeesService {
  static async getFeesForTramite(
    tramiteTipoId: string
  ): Promise<{ fees: FeeConfiguration[]; error: string | null }> {
    try {
      const currentDate = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('fees_configuration')
        .select('*')
        .eq('tramite_tipo_id', tramiteTipoId)
        .eq('activo', true)
        .lte('vigencia_desde', currentDate)
        .or(`vigencia_hasta.is.null,vigencia_hasta.gte.${currentDate}`);

      if (error) {
        return { fees: [], error: error.message };
      }

      return { fees: data || [], error: null };
    } catch (error) {
      return { fees: [], error: (error as Error).message };
    }
  }

  static calculateFee(
    feeConfig: FeeConfiguration,
    variables: Record<string, any> = {}
  ): FeeCalculationResult {
    let monto = feeConfig.monto_base;
    const detalles: Record<string, any> = { monto_base: feeConfig.monto_base };

    switch (feeConfig.tipo_calculo) {
      case 'fijo':
        break;

      case 'porcentaje':
        if (variables.monto_base && feeConfig.formula.porcentaje) {
          monto = variables.monto_base * (feeConfig.formula.porcentaje / 100);
          detalles.porcentaje = feeConfig.formula.porcentaje;
          detalles.monto_base_calculo = variables.monto_base;
        }
        break;

      case 'variable':
        if (feeConfig.formula.condiciones) {
          for (const condicion of feeConfig.formula.condiciones) {
            if (this.evaluateCondition(condicion.condicion, variables)) {
              monto = condicion.monto;
              detalles.condicion_aplicada = condicion.descripcion;
              break;
            }
          }
        }
        break;
    }

    return {
      concepto: feeConfig.concepto,
      monto,
      moneda: feeConfig.moneda,
      detalles,
    };
  }

  static async calculateTotalFees(
    tramiteTipoId: string,
    variables: Record<string, any> = {}
  ): Promise<{
    fees: FeeCalculationResult[];
    total_ars: number;
    total_usd: number;
    error: string | null;
  }> {
    try {
      const { fees: feeConfigs, error } = await this.getFeesForTramite(tramiteTipoId);

      if (error) {
        return { fees: [], total_ars: 0, total_usd: 0, error };
      }

      const calculatedFees = feeConfigs.map((config) => this.calculateFee(config, variables));

      const total_ars = calculatedFees
        .filter((f) => f.moneda === 'ARS')
        .reduce((sum, f) => sum + f.monto, 0);

      const total_usd = calculatedFees
        .filter((f) => f.moneda === 'USD')
        .reduce((sum, f) => sum + f.monto, 0);

      return { fees: calculatedFees, total_ars, total_usd, error: null };
    } catch (error) {
      return { fees: [], total_ars: 0, total_usd: 0, error: (error as Error).message };
    }
  }

  private static evaluateCondition(
    condicion: string,
    variables: Record<string, any>
  ): boolean {
    try {
      const func = new Function(...Object.keys(variables), `return ${condicion}`);
      return func(...Object.values(variables));
    } catch {
      return false;
    }
  }

  static async createFeeConfiguration(
    config: Omit<FeeConfiguration, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ fee: FeeConfiguration | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('fees_configuration')
        .insert(config)
        .select()
        .single();

      if (error) {
        return { fee: null, error: error.message };
      }

      return { fee: data, error: null };
    } catch (error) {
      return { fee: null, error: (error as Error).message };
    }
  }

  static async updateFeeConfiguration(
    id: string,
    updates: Partial<Omit<FeeConfiguration, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<{ fee: FeeConfiguration | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('fees_configuration')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { fee: null, error: error.message };
      }

      return { fee: data, error: null };
    } catch (error) {
      return { fee: null, error: (error as Error).message };
    }
  }
}
