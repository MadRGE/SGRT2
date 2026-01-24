import { supabase } from '../lib/supabase';

export interface ProductoEspecificacion {
  id: string;
  producto_id: string;
  tipo_especificacion: 'envases_anmat' | 'alimentos_inal' | 'medicos_anmat' | 'cosmeticos_anmat' | 'veterinarios_senasa';
  datos_tecnicos: any;
  version: number;
  estado: 'borrador' | 'completo' | 'aprobado' | 'rechazado';
  fabricante?: string;
  pais_fabricacion?: string;
  certificaciones?: string[];
  notas?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EnvasesANMATData {
  materiales: {
    plasticos: string[];
    celulosas: string[];
    elastomeros: string[];
    metales: string[];
    vidrio: boolean;
    otros: string;
  };
  clasificacion_riesgo: 'bajo' | 'medio' | 'alto';
  condiciones_uso: {
    heladera: boolean;
    freezer: boolean;
    microondas: boolean;
    hornalla: boolean;
    llenado_caliente: boolean;
    temperatura_max?: number;
  };
  tipos_alimentos: {
    acuosos: boolean;
    acidos: boolean;
    alcoholicos: boolean;
    grasos: boolean;
    secos: boolean;
  };
  informacion_adicional?: {
    capacidad?: string;
    colores?: string;
    aditivos?: string;
    migracion_especifica?: string;
  };
}

export interface MedicosANMATData {
  clase_riesgo: 'I' | 'IIa' | 'IIb' | 'III' | 'IV';
  tipo_dispositivo: 'activo' | 'pasivo' | 'implantable' | 'diagnostico' | 'otro';
  uso_previsto: string;
  indicacion_clinica: string;
  esterilidad: {
    es_esteril: boolean;
    metodo_esterilizacion?: string;
    validacion_esterilidad?: boolean;
  };
  biocompatibilidad: {
    requiere_estudios: boolean;
    contacto_corporal: 'superficie' | 'invasivo_corto' | 'invasivo_prolongado' | 'implantable' | 'ninguno';
    estudios_realizados: string[];
  };
  caracteristicas_tecnicas: {
    descripcion_tecnica: string;
    materiales_construccion: string[];
    dimensiones?: string;
    vida_util?: string;
    condiciones_almacenamiento?: string;
  };
  evidencia_clinica: {
    requiere_estudios: boolean;
    tipo_evidencia?: 'literatura' | 'estudios_propios' | 'equivalencia' | 'ninguna';
    descripcion?: string;
  };
  normas_aplicables: string[];
  etiquetado_marcado: {
    incluye_manual: boolean;
    idioma_manual: string;
    marcado_ce?: boolean;
    marcado_fda?: boolean;
  };
}

export interface AlimentosINALData {
  tipo_alimento: string;
  categoria_caa: string;
  informacion_nutricional: {
    energia_kcal: number;
    proteinas_g: number;
    carbohidratos_g: number;
    azucares_g: number;
    grasas_totales_g: number;
    grasas_saturadas_g: number;
    grasas_trans_g: number;
    fibra_g: number;
    sodio_mg: number;
  };
  ingredientes: {
    lista_ingredientes: string;
    contiene_alergenos: boolean;
    alergenos?: string[];
  };
  proceso_elaboracion: {
    descripcion: string;
    temperatura_proceso?: string;
    conservacion: string;
    vida_util_meses: number;
  };
  rotulado: {
    marca_comercial: string;
    denominacion_venta: string;
    contenido_neto: string;
    lote_identificacion: string;
    fecha_elaboracion_formato: string;
    fecha_vencimiento_formato: string;
  };
  establecimiento_elaborador: {
    rne?: string;
    razon_social: string;
    direccion: string;
  };
}

export class EspecificacionService {
  static async getEspecificacionByProducto(productoId: string): Promise<ProductoEspecificacion | null> {
    try {
      const { data, error } = await supabase
        .from('producto_especificaciones')
        .select('*')
        .eq('producto_id', productoId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching specification:', error);
      return null;
    }
  }

  static async createEspecificacion(data: Partial<ProductoEspecificacion>): Promise<{ success: boolean; data?: ProductoEspecificacion; error?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data: newSpec, error } = await supabase
        .from('producto_especificaciones')
        .insert([{
          ...data,
          created_by: userData.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: newSpec };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async updateEspecificacion(id: string, data: Partial<ProductoEspecificacion>): Promise<{ success: boolean; data?: ProductoEspecificacion; error?: string }> {
    try {
      const { data: updatedSpec, error } = await supabase
        .from('producto_especificaciones')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: updatedSpec };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async deleteEspecificacion(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('producto_especificaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getEspecificacionesByProductos(productoIds: string[]): Promise<Record<string, ProductoEspecificacion>> {
    try {
      const { data, error } = await supabase
        .from('producto_especificaciones')
        .select('*')
        .in('producto_id', productoIds);

      if (error) throw error;

      const grouped: Record<string, ProductoEspecificacion> = {};

      data?.forEach((spec: ProductoEspecificacion) => {
        if (!grouped[spec.producto_id] || grouped[spec.producto_id].version < spec.version) {
          grouped[spec.producto_id] = spec;
        }
      });

      return grouped;
    } catch (error) {
      console.error('Error fetching specifications:', error);
      return {};
    }
  }

  static getEmptyEnvasesTemplate(): EnvasesANMATData {
    return {
      materiales: {
        plasticos: [],
        celulosas: [],
        elastomeros: [],
        metales: [],
        vidrio: false,
        otros: ''
      },
      clasificacion_riesgo: 'bajo',
      condiciones_uso: {
        heladera: false,
        freezer: false,
        microondas: false,
        hornalla: false,
        llenado_caliente: false
      },
      tipos_alimentos: {
        acuosos: false,
        acidos: false,
        alcoholicos: false,
        grasos: false,
        secos: false
      }
    };
  }

  static getEmptyMedicosTemplate(): MedicosANMATData {
    return {
      clase_riesgo: 'I',
      tipo_dispositivo: 'pasivo',
      uso_previsto: '',
      indicacion_clinica: '',
      esterilidad: {
        es_esteril: false,
        metodo_esterilizacion: '',
        validacion_esterilidad: false
      },
      biocompatibilidad: {
        requiere_estudios: false,
        contacto_corporal: 'ninguno',
        estudios_realizados: []
      },
      caracteristicas_tecnicas: {
        descripcion_tecnica: '',
        materiales_construccion: [],
        dimensiones: '',
        vida_util: '',
        condiciones_almacenamiento: ''
      },
      evidencia_clinica: {
        requiere_estudios: false,
        tipo_evidencia: 'ninguna',
        descripcion: ''
      },
      normas_aplicables: [],
      etiquetado_marcado: {
        incluye_manual: true,
        idioma_manual: 'español',
        marcado_ce: false,
        marcado_fda: false
      }
    };
  }

  static getEmptyAlimentosTemplate(): AlimentosINALData {
    return {
      tipo_alimento: '',
      categoria_caa: '',
      informacion_nutricional: {
        energia_kcal: 0,
        proteinas_g: 0,
        carbohidratos_g: 0,
        azucares_g: 0,
        grasas_totales_g: 0,
        grasas_saturadas_g: 0,
        grasas_trans_g: 0,
        fibra_g: 0,
        sodio_mg: 0
      },
      ingredientes: {
        lista_ingredientes: '',
        contiene_alergenos: false,
        alergenos: []
      },
      proceso_elaboracion: {
        descripcion: '',
        temperatura_proceso: '',
        conservacion: '',
        vida_util_meses: 12
      },
      rotulado: {
        marca_comercial: '',
        denominacion_venta: '',
        contenido_neto: '',
        lote_identificacion: '',
        fecha_elaboracion_formato: '',
        fecha_vencimiento_formato: ''
      },
      establecimiento_elaborador: {
        rne: '',
        razon_social: '',
        direccion: ''
      }
    };
  }
}
