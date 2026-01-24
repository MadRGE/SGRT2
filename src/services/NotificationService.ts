import { supabase } from '../lib/supabase';

export interface NotificationTemplate {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'email' | 'sistema' | 'sms';
  asunto?: string;
  contenido: string;
  variables: string[];
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export class NotificationService {
  static async getTemplate(
    codigo: string
  ): Promise<{ template: NotificationTemplate | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('codigo', codigo)
        .eq('activo', true)
        .maybeSingle();

      if (error) {
        return { template: null, error: error.message };
      }

      return { template: data, error: null };
    } catch (error) {
      return { template: null, error: (error as Error).message };
    }
  }

  static async sendNotification(
    templateCodigo: string,
    usuarioId: string,
    variables: Record<string, any>,
    metadata?: {
      expediente_id?: string;
      proyecto_id?: string;
    }
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { template, error: templateError } = await this.getTemplate(templateCodigo);

      if (templateError || !template) {
        return { success: false, error: templateError || 'Template not found' };
      }

      let contenido = template.contenido;
      let asunto = template.asunto || '';

      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        contenido = contenido.replace(new RegExp(placeholder, 'g'), String(value));
        asunto = asunto.replace(new RegExp(placeholder, 'g'), String(value));
      });

      const { error: notifError } = await supabase.from('notificaciones').insert({
        usuario_id: usuarioId,
        tipo: template.tipo,
        titulo: asunto,
        mensaje: contenido,
        expediente_id: metadata?.expediente_id,
        proyecto_id: metadata?.proyecto_id,
        leida: false,
      });

      if (notifError) {
        return { success: false, error: notifError.message };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static async createTemplate(
    template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ template: NotificationTemplate | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        return { template: null, error: error.message };
      }

      return { template: data, error: null };
    } catch (error) {
      return { template: null, error: (error as Error).message };
    }
  }

  static async updateTemplate(
    id: string,
    updates: Partial<Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<{ template: NotificationTemplate | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { template: null, error: error.message };
      }

      return { template: data, error: null };
    } catch (error) {
      return { template: null, error: (error as Error).message };
    }
  }

  static async getAllTemplates(): Promise<{
    templates: NotificationTemplate[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        return { templates: [], error: error.message };
      }

      return { templates: data || [], error: null };
    } catch (error) {
      return { templates: [], error: (error as Error).message };
    }
  }
}
