import { supabase } from '../lib/supabase';

export interface DocumentValidation {
  id: string;
  documento_id: string;
  tipo_validacion: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  resultado: Record<string, any>;
  observaciones?: string;
  validado_por?: string;
  validado_at?: string;
  created_at: string;
}

export interface ValidationRule {
  tipo: string;
  descripcion: string;
  validador: (documento: any) => Promise<ValidationResult>;
}

export interface ValidationResult {
  valido: boolean;
  errores: string[];
  advertencias: string[];
  detalles: Record<string, any>;
}

export class ValidationService {
  private static validationRules: Map<string, ValidationRule> = new Map();

  static registerValidationRule(tipo: string, rule: ValidationRule) {
    this.validationRules.set(tipo, rule);
  }

  static async validateDocument(
    documentoId: string,
    tipoValidacion: string
  ): Promise<{ validation: DocumentValidation | null; error: string | null }> {
    try {
      const { data: documento, error: docError } = await supabase
        .from('documentos')
        .select('*')
        .eq('id', documentoId)
        .maybeSingle();

      if (docError || !documento) {
        return { validation: null, error: docError?.message || 'Document not found' };
      }

      const rule = this.validationRules.get(tipoValidacion);
      if (!rule) {
        return { validation: null, error: `Validation rule ${tipoValidacion} not found` };
      }

      const resultado = await rule.validador(documento);

      const estado = resultado.valido ? 'aprobado' : 'rechazado';

      const { data: validation, error: valError } = await supabase
        .from('document_validations')
        .insert({
          documento_id: documentoId,
          tipo_validacion: tipoValidacion,
          estado,
          resultado: {
            valido: resultado.valido,
            errores: resultado.errores,
            advertencias: resultado.advertencias,
            detalles: resultado.detalles,
          },
          validado_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (valError) {
        return { validation: null, error: valError.message };
      }

      return { validation, error: null };
    } catch (error) {
      return { validation: null, error: (error as Error).message };
    }
  }

  static async getDocumentValidations(
    documentoId: string
  ): Promise<{ validations: DocumentValidation[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('document_validations')
        .select('*')
        .eq('documento_id', documentoId)
        .order('created_at', { ascending: false });

      if (error) {
        return { validations: [], error: error.message };
      }

      return { validations: data || [], error: null };
    } catch (error) {
      return { validations: [], error: (error as Error).message };
    }
  }

  static async updateValidationStatus(
    validationId: string,
    estado: 'pendiente' | 'aprobado' | 'rechazado',
    observaciones?: string
  ): Promise<{ validation: DocumentValidation | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('document_validations')
        .update({
          estado,
          observaciones,
          validado_at: new Date().toISOString(),
        })
        .eq('id', validationId)
        .select()
        .single();

      if (error) {
        return { validation: null, error: error.message };
      }

      return { validation: data, error: null };
    } catch (error) {
      return { validation: null, error: (error as Error).message };
    }
  }
}

ValidationService.registerValidationRule('formato_archivo', {
  tipo: 'formato_archivo',
  descripcion: 'Valida que el archivo tenga un formato aceptado',
  validador: async (documento) => {
    const formatosAceptados = ['pdf', 'jpg', 'jpeg', 'png'];
    const errores: string[] = [];
    const advertencias: string[] = [];

    const extension = documento.url_archivo?.split('.').pop()?.toLowerCase();

    if (!extension || !formatosAceptados.includes(extension)) {
      errores.push(
        `Formato de archivo no válido. Formatos aceptados: ${formatosAceptados.join(', ')}`
      );
    }

    return {
      valido: errores.length === 0,
      errores,
      advertencias,
      detalles: { extension, formatosAceptados },
    };
  },
});

ValidationService.registerValidationRule('nombre_archivo', {
  tipo: 'nombre_archivo',
  descripcion: 'Valida que el archivo tenga un nombre apropiado',
  validador: async (documento) => {
    const errores: string[] = [];
    const advertencias: string[] = [];

    if (!documento.nombre || documento.nombre.trim().length === 0) {
      errores.push('El documento debe tener un nombre');
    }

    if (documento.nombre && documento.nombre.length > 200) {
      advertencias.push('El nombre del documento es muy largo');
    }

    return {
      valido: errores.length === 0,
      errores,
      advertencias,
      detalles: { nombreLength: documento.nombre?.length || 0 },
    };
  },
});
