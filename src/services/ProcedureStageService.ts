import { supabase } from '../lib/supabase';

export interface ProcedureStage {
  id: string;
  tramite_tipo_id: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  duracion_estimada_dias?: number;
  requiere_aprobacion: boolean;
  documentos_requeridos: string[];
  acciones_disponibles: any[];
  created_at: string;
  updated_at: string;
}

export interface ExpedienteStage {
  id: string;
  expediente_id: string;
  stage_id: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'bloqueado';
  fecha_inicio: string;
  fecha_completado?: string;
  notas?: string;
  completado_por?: string;
  created_at: string;
  updated_at: string;
}

export class ProcedureStageService {
  static async getStagesForTramite(
    tramiteTipoId: string
  ): Promise<{ stages: ProcedureStage[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('procedure_stages')
        .select('*')
        .eq('tramite_tipo_id', tramiteTipoId)
        .order('orden', { ascending: true });

      if (error) {
        return { stages: [], error: error.message };
      }

      return { stages: data || [], error: null };
    } catch (error) {
      return { stages: [], error: (error as Error).message };
    }
  }

  static async getExpedienteStages(
    expedienteId: string
  ): Promise<{ stages: ExpedienteStage[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('expediente_stages')
        .select('*')
        .eq('expediente_id', expedienteId)
        .order('created_at', { ascending: true });

      if (error) {
        return { stages: [], error: error.message };
      }

      return { stages: data || [], error: null };
    } catch (error) {
      return { stages: [], error: (error as Error).message };
    }
  }

  static async initializeExpedienteStages(
    expedienteId: string,
    tramiteTipoId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { stages, error: stagesError } = await this.getStagesForTramite(tramiteTipoId);
      if (stagesError || stages.length === 0) {
        return { success: false, error: stagesError || 'No stages found for tramite' };
      }

      const expedienteStages = stages.map((stage, index) => ({
        expediente_id: expedienteId,
        stage_id: stage.id,
        estado: index === 0 ? ('en_proceso' as const) : ('pendiente' as const),
        fecha_inicio: index === 0 ? new Date().toISOString() : null,
      }));

      const { error: insertError } = await supabase
        .from('expediente_stages')
        .insert(expedienteStages);

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async completeStage(
    expedienteStageId: string,
    notas?: string
  ): Promise<{ stage: ExpedienteStage | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('expediente_stages')
        .update({
          estado: 'completado',
          fecha_completado: new Date().toISOString(),
          notas,
        })
        .eq('id', expedienteStageId)
        .select()
        .single();

      if (error) {
        return { stage: null, error: error.message };
      }

      const { data: currentStage } = await supabase
        .from('expediente_stages')
        .select('expediente_id')
        .eq('id', expedienteStageId)
        .single();

      if (currentStage) {
        const { data: nextStage } = await supabase
          .from('expediente_stages')
          .select('*')
          .eq('expediente_id', currentStage.expediente_id)
          .eq('estado', 'pendiente')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (nextStage) {
          await supabase
            .from('expediente_stages')
            .update({
              estado: 'en_proceso',
              fecha_inicio: new Date().toISOString(),
            })
            .eq('id', nextStage.id);
        }
      }

      return { stage: data, error: null };
    } catch (error) {
      return { stage: null, error: (error as Error).message };
    }
  }

  static async blockStage(
    expedienteStageId: string,
    notas: string
  ): Promise<{ stage: ExpedienteStage | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('expediente_stages')
        .update({
          estado: 'bloqueado',
          notas,
        })
        .eq('id', expedienteStageId)
        .select()
        .single();

      if (error) {
        return { stage: null, error: error.message };
      }

      return { stage: data, error: null };
    } catch (error) {
      return { stage: null, error: (error as Error).message };
    }
  }

  static async unblockStage(
    expedienteStageId: string
  ): Promise<{ stage: ExpedienteStage | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('expediente_stages')
        .update({
          estado: 'en_proceso',
        })
        .eq('id', expedienteStageId)
        .select()
        .single();

      if (error) {
        return { stage: null, error: error.message };
      }

      return { stage: data, error: null };
    } catch (error) {
      return { stage: null, error: (error as Error).message };
    }
  }
}
