export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          razon_social: string
          cuit: string | null
          email: string | null
          telefono: string | null
          contacto_nombre: string | null
          origen: string | null
          referido_por: string | null
          direccion: string | null
          localidad: string | null
          provincia: string | null
          rne: string | null
          notas: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          razon_social: string
          cuit?: string | null
          email?: string | null
          telefono?: string | null
          contacto_nombre?: string | null
          origen?: string | null
          referido_por?: string | null
          direccion?: string | null
          localidad?: string | null
          provincia?: string | null
          rne?: string | null
          notas?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          razon_social?: string
          cuit?: string | null
          email?: string | null
          telefono?: string | null
          contacto_nombre?: string | null
          origen?: string | null
          referido_por?: string | null
          direccion?: string | null
          localidad?: string | null
          provincia?: string | null
          rne?: string | null
          notas?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      gestiones: {
        Row: {
          id: string
          cliente_id: string
          nombre: string
          descripcion: string | null
          estado: string
          prioridad: string
          fecha_inicio: string | null
          fecha_cierre: string | null
          observaciones: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          cliente_id: string
          nombre: string
          descripcion?: string | null
          estado?: string
          prioridad?: string
          fecha_inicio?: string | null
          fecha_cierre?: string | null
          observaciones?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          cliente_id?: string
          nombre?: string
          descripcion?: string | null
          estado?: string
          prioridad?: string
          fecha_inicio?: string | null
          fecha_cierre?: string | null
          observaciones?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      tramites: {
        Row: {
          id: string
          cliente_id: string
          gestion_id: string | null
          tramite_tipo_id: string | null
          titulo: string
          tipo: string | null
          organismo: string | null
          plataforma: string | null
          descripcion: string | null
          estado: string
          semaforo: string | null
          progreso: number | null
          prioridad: string
          fecha_inicio: string | null
          fecha_vencimiento: string | null
          numero_expediente: string | null
          monto_presupuesto: number | null
          cantidad_registros_envase: number | null
          notas: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          cliente_id: string
          gestion_id?: string | null
          tramite_tipo_id?: string | null
          titulo: string
          tipo?: string | null
          organismo?: string | null
          plataforma?: string | null
          descripcion?: string | null
          estado?: string
          semaforo?: string | null
          progreso?: number | null
          prioridad?: string
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          numero_expediente?: string | null
          monto_presupuesto?: number | null
          cantidad_registros_envase?: number | null
          notas?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          cliente_id?: string
          gestion_id?: string | null
          tramite_tipo_id?: string | null
          titulo?: string
          tipo?: string | null
          organismo?: string | null
          plataforma?: string | null
          descripcion?: string | null
          estado?: string
          semaforo?: string | null
          progreso?: number | null
          prioridad?: string
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          numero_expediente?: string | null
          monto_presupuesto?: number | null
          cantidad_registros_envase?: number | null
          notas?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      tramite_tipos: {
        Row: {
          id: string
          codigo: string
          nombre: string
          organismo: string | null
          organismo_id: string | null
          rubro: string | null
          categoria: string | null
          subcategoria: string | null
          plataforma: string | null
          base_legal: string[] | null
          renovacion: string | null
          sla_total_dias: number | null
          plazo_dias: number | null
          costo_organismo: number | null
          costo_tasas_base: number | null
          honorarios: number | null
          costo_honorarios_base: number | null
          documentacion_obligatoria: string[] | null
          admite_equivalencia: boolean
          logica_especial: string | null
          es_habilitacion_previa: boolean
          activo: boolean
        }
        Insert: {
          id?: string
          codigo: string
          nombre: string
          organismo?: string | null
          organismo_id?: string | null
          rubro?: string | null
          categoria?: string | null
          subcategoria?: string | null
          plataforma?: string | null
          base_legal?: string[] | null
          renovacion?: string | null
          sla_total_dias?: number | null
          plazo_dias?: number | null
          costo_organismo?: number | null
          costo_tasas_base?: number | null
          honorarios?: number | null
          costo_honorarios_base?: number | null
          documentacion_obligatoria?: string[] | null
          admite_equivalencia?: boolean
          logica_especial?: string | null
          es_habilitacion_previa?: boolean
          activo?: boolean
        }
        Update: {
          id?: string
          codigo?: string
          nombre?: string
          organismo?: string | null
          organismo_id?: string | null
          rubro?: string | null
          categoria?: string | null
          subcategoria?: string | null
          plataforma?: string | null
          base_legal?: string[] | null
          renovacion?: string | null
          sla_total_dias?: number | null
          plazo_dias?: number | null
          costo_organismo?: number | null
          costo_tasas_base?: number | null
          honorarios?: number | null
          costo_honorarios_base?: number | null
          documentacion_obligatoria?: string[] | null
          admite_equivalencia?: boolean
          logica_especial?: string | null
          es_habilitacion_previa?: boolean
          activo?: boolean
        }
        Relationships: []
      }
      tramite_checklists: {
        Row: {
          id: number
          tramite_tipo_id: string | null
          item: string
          obligatorio: boolean
          responsable: string
          grupo: string | null
        }
        Insert: {
          id?: number
          tramite_tipo_id?: string | null
          item: string
          obligatorio?: boolean
          responsable?: string
          grupo?: string | null
        }
        Update: {
          id?: number
          tramite_tipo_id?: string | null
          item?: string
          obligatorio?: boolean
          responsable?: string
          grupo?: string | null
        }
        Relationships: []
      }
      organismos: {
        Row: {
          id: string
          sigla: string
          nombre: string
          codigo: string | null
          activo: boolean
          plataforma_presentacion: string | null
        }
        Insert: {
          id?: string
          sigla: string
          nombre: string
          codigo?: string | null
          activo?: boolean
          plataforma_presentacion?: string | null
        }
        Update: {
          id?: string
          sigla?: string
          nombre?: string
          codigo?: string | null
          activo?: boolean
          plataforma_presentacion?: string | null
        }
        Relationships: []
      }
      documentos: {
        Row: {
          id: string
          expediente_id: string | null
          checklist_item_id: number | null
          nombre: string
          url_archivo: string | null
          estado: string
          created_at: string
        }
        Insert: {
          id?: string
          expediente_id?: string | null
          checklist_item_id?: number | null
          nombre: string
          url_archivo?: string | null
          estado?: string
          created_at?: string
        }
        Update: {
          id?: string
          expediente_id?: string | null
          checklist_item_id?: number | null
          nombre?: string
          url_archivo?: string | null
          estado?: string
          created_at?: string
        }
        Relationships: []
      }
      documentos_tramite: {
        Row: {
          id: string
          tramite_id: string
          nombre: string
          estado: string
          obligatorio: boolean
          responsable: string | null
          documento_cliente_id: string | null
          archivo_path: string | null
          archivo_nombre: string | null
          archivo_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          tramite_id: string
          nombre: string
          estado?: string
          obligatorio?: boolean
          responsable?: string | null
          documento_cliente_id?: string | null
          archivo_path?: string | null
          archivo_nombre?: string | null
          archivo_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          tramite_id?: string
          nombre?: string
          estado?: string
          obligatorio?: boolean
          responsable?: string | null
          documento_cliente_id?: string | null
          archivo_path?: string | null
          archivo_nombre?: string | null
          archivo_size?: number | null
          created_at?: string
        }
        Relationships: []
      }
      documentos_cliente: {
        Row: {
          id: string
          cliente_id: string
          nombre: string
          categoria: string
          estado: string
          fecha_emision: string | null
          fecha_vencimiento: string | null
          notas: string | null
          archivo_path: string | null
          archivo_nombre: string | null
          archivo_size: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          nombre: string
          categoria?: string
          estado?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          notas?: string | null
          archivo_path?: string | null
          archivo_nombre?: string | null
          archivo_size?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          nombre?: string
          categoria?: string
          estado?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          notas?: string | null
          archivo_path?: string | null
          archivo_nombre?: string | null
          archivo_size?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cliente_documentos: {
        Row: {
          id: string
          cliente_id: string
          tipo_documento: string
          url_archivo: string
          nombre_archivo: string
          fecha_vencimiento: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          tipo_documento: string
          url_archivo: string
          nombre_archivo: string
          fecha_vencimiento?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          tipo_documento?: string
          url_archivo?: string
          nombre_archivo?: string
          fecha_vencimiento?: string | null
          created_at?: string
        }
        Relationships: []
      }
      seguimientos: {
        Row: {
          id: string
          tramite_id: string | null
          gestion_id: string | null
          descripcion: string
          tipo: string
          created_at: string
          usuario_id: string | null
          usuario_nombre: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          tramite_id?: string | null
          gestion_id?: string | null
          descripcion: string
          tipo?: string
          created_at?: string
          usuario_id?: string | null
          usuario_nombre?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          tramite_id?: string | null
          gestion_id?: string | null
          descripcion?: string
          tipo?: string
          created_at?: string
          usuario_id?: string | null
          usuario_nombre?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      registros_cliente: {
        Row: {
          id: string
          cliente_id: string
          tipo: string
          numero: string | null
          organismo: string | null
          descripcion: string | null
          fecha_emision: string | null
          fecha_vencimiento: string | null
          estado: string
          notas: string | null
        }
        Insert: {
          id?: string
          cliente_id: string
          tipo: string
          numero?: string | null
          organismo?: string | null
          descripcion?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          estado?: string
          notas?: string | null
        }
        Update: {
          id?: string
          cliente_id?: string
          tipo?: string
          numero?: string | null
          organismo?: string | null
          descripcion?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          estado?: string
          notas?: string | null
        }
        Relationships: []
      }
      vencimientos: {
        Row: {
          id: string
          tipo: string
          descripcion: string
          fecha_vencimiento: string
          cliente_id: string
          tramite_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tipo: string
          descripcion: string
          fecha_vencimiento: string
          cliente_id: string
          tramite_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tipo?: string
          descripcion?: string
          fecha_vencimiento?: string
          cliente_id?: string
          tramite_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      cotizaciones: {
        Row: {
          id: string
          numero_cotizacion: string | null
          nombre_cliente: string
          cliente_id: string | null
          contacto_temporal_id: string | null
          costo_total: number
          precio_total: number
          descuento_porcentaje: number
          descuento_monto: number
          motivo_descuento: string | null
          precio_final: number
          margen_total: number
          margen_porcentaje: number
          observaciones: string | null
          fecha_emision: string | null
          fecha_vencimiento: string | null
          estado: string
          url_publica: string | null
          veces_compartida: number
          proyecto_id: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero_cotizacion?: string | null
          nombre_cliente: string
          cliente_id?: string | null
          contacto_temporal_id?: string | null
          costo_total?: number
          precio_total?: number
          descuento_porcentaje?: number
          descuento_monto?: number
          motivo_descuento?: string | null
          precio_final?: number
          margen_total?: number
          margen_porcentaje?: number
          observaciones?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          estado?: string
          url_publica?: string | null
          veces_compartida?: number
          proyecto_id?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero_cotizacion?: string | null
          nombre_cliente?: string
          cliente_id?: string | null
          contacto_temporal_id?: string | null
          costo_total?: number
          precio_total?: number
          descuento_porcentaje?: number
          descuento_monto?: number
          motivo_descuento?: string | null
          precio_final?: number
          margen_total?: number
          margen_porcentaje?: number
          observaciones?: string | null
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          estado?: string
          url_publica?: string | null
          veces_compartida?: number
          proyecto_id?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cotizacion_items: {
        Row: {
          id: number
          cotizacion_id: string
          tramite_tipo_id: string | null
          servicio_catalogo_id: string | null
          concepto: string
          tipo: string
          costo_base: number
          precio_venta: number
          margen_unitario: number
          margen_porcentaje: number
          cantidad: number
          subtotal_costo: number
          subtotal_precio: number
          requiere_tercero: boolean
          proveedor_externo_id: string | null
          costo_proveedor_externo: number
          notas_costo: string | null
        }
        Insert: {
          id?: number
          cotizacion_id: string
          tramite_tipo_id?: string | null
          servicio_catalogo_id?: string | null
          concepto: string
          tipo?: string
          costo_base?: number
          precio_venta?: number
          margen_unitario?: number
          margen_porcentaje?: number
          cantidad?: number
          subtotal_costo?: number
          subtotal_precio?: number
          requiere_tercero?: boolean
          proveedor_externo_id?: string | null
          costo_proveedor_externo?: number
          notas_costo?: string | null
        }
        Update: {
          id?: number
          cotizacion_id?: string
          tramite_tipo_id?: string | null
          servicio_catalogo_id?: string | null
          concepto?: string
          tipo?: string
          costo_base?: number
          precio_venta?: number
          margen_unitario?: number
          margen_porcentaje?: number
          cantidad?: number
          subtotal_costo?: number
          subtotal_precio?: number
          requiere_tercero?: boolean
          proveedor_externo_id?: string | null
          costo_proveedor_externo?: number
          notas_costo?: string | null
        }
        Relationships: []
      }
      productos: {
        Row: {
          id: string
          cliente_id: string
          nombre: string
          marca: string | null
          rubro: string | null
          pais_origen: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          nombre: string
          marca?: string | null
          rubro?: string | null
          pais_origen?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          nombre?: string
          marca?: string | null
          rubro?: string | null
          pais_origen?: string | null
          created_at?: string
        }
        Relationships: []
      }
      producto_especificaciones: {
        Row: {
          id: string
          producto_id: string
          tipo_especificacion: string
          datos_tecnicos: Json
          version: number
          estado: string
          fabricante: string | null
          pais_fabricacion: string | null
          certificaciones: string[] | null
          notas: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          producto_id: string
          tipo_especificacion: string
          datos_tecnicos?: Json
          version?: number
          estado?: string
          fabricante?: string | null
          pais_fabricacion?: string | null
          certificaciones?: string[] | null
          notas?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          producto_id?: string
          tipo_especificacion?: string
          datos_tecnicos?: Json
          version?: number
          estado?: string
          fabricante?: string | null
          pais_fabricacion?: string | null
          certificaciones?: string[] | null
          notas?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          id: string
          usuario_id: string
          tipo: string
          titulo: string
          mensaje: string
          expediente_id: string | null
          proyecto_id: string | null
          leida: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          tipo: string
          titulo: string
          mensaje: string
          expediente_id?: string | null
          proyecto_id?: string | null
          leida?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          tipo?: string
          titulo?: string
          mensaje?: string
          expediente_id?: string | null
          proyecto_id?: string | null
          leida?: boolean
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          id: string
          codigo: string
          nombre: string
          tipo: string
          asunto: string | null
          contenido: string
          variables: string[]
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo: string
          nombre: string
          tipo: string
          asunto?: string | null
          contenido: string
          variables?: string[]
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          nombre?: string
          tipo?: string
          asunto?: string | null
          contenido?: string
          variables?: string[]
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      procedure_stages: {
        Row: {
          id: string
          tramite_tipo_id: string
          nombre: string
          descripcion: string | null
          orden: number
          duracion_estimada_dias: number | null
          requiere_aprobacion: boolean
          documentos_requeridos: string[]
          acciones_disponibles: Json[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tramite_tipo_id: string
          nombre: string
          descripcion?: string | null
          orden: number
          duracion_estimada_dias?: number | null
          requiere_aprobacion?: boolean
          documentos_requeridos?: string[]
          acciones_disponibles?: Json[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tramite_tipo_id?: string
          nombre?: string
          descripcion?: string | null
          orden?: number
          duracion_estimada_dias?: number | null
          requiere_aprobacion?: boolean
          documentos_requeridos?: string[]
          acciones_disponibles?: Json[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      expediente_stages: {
        Row: {
          id: string
          expediente_id: string
          stage_id: string
          estado: string
          fecha_inicio: string | null
          fecha_completado: string | null
          notas: string | null
          completado_por: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          expediente_id: string
          stage_id: string
          estado?: string
          fecha_inicio?: string | null
          fecha_completado?: string | null
          notas?: string | null
          completado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          expediente_id?: string
          stage_id?: string
          estado?: string
          fecha_inicio?: string | null
          fecha_completado?: string | null
          notas?: string | null
          completado_por?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fees_configuration: {
        Row: {
          id: string
          tramite_tipo_id: string
          concepto: string
          monto_base: number
          moneda: string
          tipo_calculo: string
          formula: Json
          vigencia_desde: string
          vigencia_hasta: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tramite_tipo_id: string
          concepto: string
          monto_base: number
          moneda?: string
          tipo_calculo?: string
          formula?: Json
          vigencia_desde: string
          vigencia_hasta?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tramite_tipo_id?: string
          concepto?: string
          monto_base?: number
          moneda?: string
          tipo_calculo?: string
          formula?: Json
          vigencia_desde?: string
          vigencia_hasta?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      aranceles_oficiales: {
        Row: {
          id: string
          organismo_id: string
          codigo_tramite: string
          descripcion: string
          monto: number
          moneda: string
          categoria: string | null
          vigencia_desde: string
          vigencia_hasta: string | null
          formula_calculo: string | null
          notas_aplicacion: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organismo_id: string
          codigo_tramite: string
          descripcion: string
          monto: number
          moneda?: string
          categoria?: string | null
          vigencia_desde: string
          vigencia_hasta?: string | null
          formula_calculo?: string | null
          notas_aplicacion?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organismo_id?: string
          codigo_tramite?: string
          descripcion?: string
          monto?: number
          moneda?: string
          categoria?: string | null
          vigencia_desde?: string
          vigencia_hasta?: string | null
          formula_calculo?: string | null
          notas_aplicacion?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_validations: {
        Row: {
          id: string
          documento_id: string
          tipo_validacion: string
          estado: string
          resultado: Json
          observaciones: string | null
          validado_por: string | null
          validado_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          documento_id: string
          tipo_validacion: string
          estado?: string
          resultado?: Json
          observaciones?: string | null
          validado_por?: string | null
          validado_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          documento_id?: string
          tipo_validacion?: string
          estado?: string
          resultado?: Json
          observaciones?: string | null
          validado_por?: string | null
          validado_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          id: string
          auth_id: string | null
          email: string
          nombre: string
          rol: string
          cliente_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          auth_id?: string | null
          email: string
          nombre: string
          rol: string
          cliente_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          auth_id?: string | null
          email?: string
          nombre?: string
          rol?: string
          cliente_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      envases: {
        Row: {
          id: string
          cliente_id: string
          codigo_interno: string | null
          descripcion: string | null
          marca_comercial: string | null
          fabricante: string | null
          pais_origen: string | null
          categoria: string | null
          material_principal: string | null
          nivel_riesgo: string | null
          uso_previsto: string | null
          capacidad_volumen: string | null
          color: string | null
          numero_registro: string | null
          fecha_registro: string | null
          fecha_vencimiento: string | null
          estado: string
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          codigo_interno?: string | null
          descripcion?: string | null
          marca_comercial?: string | null
          fabricante?: string | null
          pais_origen?: string | null
          categoria?: string | null
          material_principal?: string | null
          nivel_riesgo?: string | null
          uso_previsto?: string | null
          capacidad_volumen?: string | null
          color?: string | null
          numero_registro?: string | null
          fecha_registro?: string | null
          fecha_vencimiento?: string | null
          estado?: string
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          codigo_interno?: string | null
          descripcion?: string | null
          marca_comercial?: string | null
          fabricante?: string | null
          pais_origen?: string | null
          categoria?: string | null
          material_principal?: string | null
          nivel_riesgo?: string | null
          uso_previsto?: string | null
          capacidad_volumen?: string | null
          color?: string | null
          numero_registro?: string | null
          fecha_registro?: string | null
          fecha_vencimiento?: string | null
          estado?: string
          notas?: string | null
          created_at?: string
        }
        Relationships: []
      }
      terceros: {
        Row: {
          id: string
          nombre: string
          tipo: string
          tipo_servicio: string[] | null
          calificacion: number | null
          activo: boolean
          cuit: string | null
          email: string | null
          telefono: string | null
          direccion: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          tipo: string
          tipo_servicio?: string[] | null
          calificacion?: number | null
          activo?: boolean
          cuit?: string | null
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          tipo?: string
          tipo_servicio?: string[] | null
          calificacion?: number | null
          activo?: boolean
          cuit?: string | null
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          created_at?: string
        }
        Relationships: []
      }
      catalogo_servicios: {
        Row: {
          id: string
          codigo: string
          nombre: string
          descripcion: string | null
          categoria: string | null
          tipo_costo: string | null
          costo_base_sugerido: number | null
          precio_sugerido_estandar: number | null
          precio_sugerido_corporativo: number | null
          precio_sugerido_pyme: number | null
          requiere_proveedor_externo: boolean
          tiempo_estimado_horas: number | null
          activo: boolean
        }
        Insert: {
          id?: string
          codigo: string
          nombre: string
          descripcion?: string | null
          categoria?: string | null
          tipo_costo?: string | null
          costo_base_sugerido?: number | null
          precio_sugerido_estandar?: number | null
          precio_sugerido_corporativo?: number | null
          precio_sugerido_pyme?: number | null
          requiere_proveedor_externo?: boolean
          tiempo_estimado_horas?: number | null
          activo?: boolean
        }
        Update: {
          id?: string
          codigo?: string
          nombre?: string
          descripcion?: string | null
          categoria?: string | null
          tipo_costo?: string | null
          costo_base_sugerido?: number | null
          precio_sugerido_estandar?: number | null
          precio_sugerido_corporativo?: number | null
          precio_sugerido_pyme?: number | null
          requiere_proveedor_externo?: boolean
          tiempo_estimado_horas?: number | null
          activo?: boolean
        }
        Relationships: []
      }
      configuracion_margenes: {
        Row: {
          id: string
          categoria: string
          margen_minimo: number
          margen_objetivo: number
          activo: boolean
        }
        Insert: {
          id?: string
          categoria: string
          margen_minimo?: number
          margen_objetivo?: number
          activo?: boolean
        }
        Update: {
          id?: string
          categoria?: string
          margen_minimo?: number
          margen_objetivo?: number
          activo?: boolean
        }
        Relationships: []
      }
      contactos_temporales: {
        Row: {
          id: string
          nombre_empresa: string
          estado: string
        }
        Insert: {
          id?: string
          nombre_empresa: string
          estado?: string
        }
        Update: {
          id?: string
          nombre_empresa?: string
          estado?: string
        }
        Relationships: []
      }
      facturas_proveedores: {
        Row: {
          id: string
          gestion_id: string
          proveedor_id: string
          numero_factura: string
          fecha_emision: string
          fecha_vencimiento: string | null
          monto_total: number
          estado_pago: string
          fecha_pago: string | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          gestion_id: string
          proveedor_id: string
          numero_factura: string
          fecha_emision: string
          fecha_vencimiento?: string | null
          monto_total: number
          estado_pago?: string
          fecha_pago?: string | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          gestion_id?: string
          proveedor_id?: string
          numero_factura?: string
          fecha_emision?: string
          fecha_vencimiento?: string | null
          monto_total?: number
          estado_pago?: string
          fecha_pago?: string | null
          notas?: string | null
          created_at?: string
        }
        Relationships: []
      }
      presupuestos: {
        Row: {
          id: string
          proyecto_id: string
          estado: string
          total_final: number
          created_at: string
        }
        Insert: {
          id?: string
          proyecto_id: string
          estado?: string
          total_final?: number
          created_at?: string
        }
        Update: {
          id?: string
          proyecto_id?: string
          estado?: string
          total_final?: number
          created_at?: string
        }
        Relationships: []
      }
      presupuesto_items: {
        Row: {
          id: number
          presupuesto_id: string
          expediente_id: string | null
          concepto: string
          tipo: string | null
          monto: number
        }
        Insert: {
          id?: number
          presupuesto_id: string
          expediente_id?: string | null
          concepto: string
          tipo?: string | null
          monto: number
        }
        Update: {
          id?: number
          presupuesto_id?: string
          expediente_id?: string | null
          concepto?: string
          tipo?: string | null
          monto?: number
        }
        Relationships: []
      }
      historial: {
        Row: {
          id: string
          proyecto_id: string | null
          expediente_id: string | null
          accion: string
          descripcion: string | null
          usuario_id: string | null
          fecha: string
        }
        Insert: {
          id?: string
          proyecto_id?: string | null
          expediente_id?: string | null
          accion: string
          descripcion?: string | null
          usuario_id?: string | null
          fecha?: string
        }
        Update: {
          id?: string
          proyecto_id?: string | null
          expediente_id?: string | null
          accion?: string
          descripcion?: string | null
          usuario_id?: string | null
          fecha?: string
        }
        Relationships: []
      }
      anmat_casos: {
        Row: {
          id: string
          cliente_id: string
          division_id: string
          referencia_cliente: string | null
          descripcion_cliente: string | null
          fuente_contacto: string | null
          es_urgente: boolean
          fecha_ingreso_puerto: string | null
          cantidad_skus: number | null
          estado: string
          created_by: string | null
          asignado_a: string | null
          datos_especificos: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cliente_id: string
          division_id: string
          referencia_cliente?: string | null
          descripcion_cliente?: string | null
          fuente_contacto?: string | null
          es_urgente?: boolean
          fecha_ingreso_puerto?: string | null
          cantidad_skus?: number | null
          estado?: string
          created_by?: string | null
          asignado_a?: string | null
          datos_especificos?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          division_id?: string
          referencia_cliente?: string | null
          descripcion_cliente?: string | null
          fuente_contacto?: string | null
          es_urgente?: boolean
          fecha_ingreso_puerto?: string | null
          cantidad_skus?: number | null
          estado?: string
          created_by?: string | null
          asignado_a?: string | null
          datos_especificos?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      anmat_divisiones: {
        Row: {
          id: string
          codigo: string
          nombre: string
          descripcion: string | null
          activo: boolean
        }
        Insert: {
          id?: string
          codigo: string
          nombre: string
          descripcion?: string | null
          activo?: boolean
        }
        Update: {
          id?: string
          codigo?: string
          nombre?: string
          descripcion?: string | null
          activo?: boolean
        }
        Relationships: []
      }
      anmat_familias: {
        Row: {
          id: string
          caso_id: string
          numero_familia: number | null
          nombre: string | null
          descripcion: string | null
          fabricante: string | null
          ncm: string | null
          color_parte_contacto: string | null
          estado: string
          numero_expediente_anmat: string | null
          numero_registro: string | null
          fecha_presentacion: string | null
          fecha_aprobacion: string | null
          tiene_observaciones: boolean
          observaciones_anmat: string | null
          material_principal_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          caso_id: string
          numero_familia?: number | null
          nombre?: string | null
          descripcion?: string | null
          fabricante?: string | null
          ncm?: string | null
          color_parte_contacto?: string | null
          estado?: string
          numero_expediente_anmat?: string | null
          numero_registro?: string | null
          fecha_presentacion?: string | null
          fecha_aprobacion?: string | null
          tiene_observaciones?: boolean
          observaciones_anmat?: string | null
          material_principal_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          caso_id?: string
          numero_familia?: number | null
          nombre?: string | null
          descripcion?: string | null
          fabricante?: string | null
          ncm?: string | null
          color_parte_contacto?: string | null
          estado?: string
          numero_expediente_anmat?: string | null
          numero_registro?: string | null
          fecha_presentacion?: string | null
          fecha_aprobacion?: string | null
          tiene_observaciones?: boolean
          observaciones_anmat?: string | null
          material_principal_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      anmat_caso_productos: {
        Row: {
          id: string
          caso_id: string
          codigo_cliente: string | null
          nombre: string
          descripcion: string | null
          variante_color: string | null
          variante_capacidad: string | null
          variante_modelo: string | null
          ncm: string | null
          pais_origen: string | null
          fabricante: string | null
          familia_id: string | null
          tiene_ficha_tecnica: boolean
          tiene_certificaciones: boolean
          imagen_url: string | null
          material_principal_id: string | null
          orden: number | null
          created_at: string
        }
        Insert: {
          id?: string
          caso_id: string
          codigo_cliente?: string | null
          nombre: string
          descripcion?: string | null
          variante_color?: string | null
          variante_capacidad?: string | null
          variante_modelo?: string | null
          ncm?: string | null
          pais_origen?: string | null
          fabricante?: string | null
          familia_id?: string | null
          tiene_ficha_tecnica?: boolean
          tiene_certificaciones?: boolean
          imagen_url?: string | null
          material_principal_id?: string | null
          orden?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          caso_id?: string
          codigo_cliente?: string | null
          nombre?: string
          descripcion?: string | null
          variante_color?: string | null
          variante_capacidad?: string | null
          variante_modelo?: string | null
          ncm?: string | null
          pais_origen?: string | null
          fabricante?: string | null
          familia_id?: string | null
          tiene_ficha_tecnica?: boolean
          tiene_certificaciones?: boolean
          imagen_url?: string | null
          material_principal_id?: string | null
          orden?: number | null
          created_at?: string
        }
        Relationships: []
      }
      anmat_materiales: {
        Row: {
          id: string
          nombre: string
          codigo_caa: string | null
        }
        Insert: {
          id?: string
          nombre: string
          codigo_caa?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          codigo_caa?: string | null
        }
        Relationships: []
      }
      anmat_documentos: {
        Row: {
          id: string
          caso_id: string
          tipo_documento: string
          nombre: string
          archivo_url: string | null
          archivo_nombre: string | null
          estado: string
          fecha_vencimiento: string | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          caso_id: string
          tipo_documento: string
          nombre: string
          archivo_url?: string | null
          archivo_nombre?: string | null
          estado?: string
          fecha_vencimiento?: string | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          caso_id?: string
          tipo_documento?: string
          nombre?: string
          archivo_url?: string | null
          archivo_nombre?: string | null
          estado?: string
          fecha_vencimiento?: string | null
          notas?: string | null
          created_at?: string
        }
        Relationships: []
      }
      anmat_caso_documentos_checklist: {
        Row: {
          id: string
          caso_id: string
          requisito_id: string
          estado: string
          notas: string | null
          fecha_recepcion: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          caso_id: string
          requisito_id: string
          estado?: string
          notas?: string | null
          fecha_recepcion?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          caso_id?: string
          requisito_id?: string
          estado?: string
          notas?: string | null
          fecha_recepcion?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      anmat_requisitos_documentos: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          es_obligatorio: boolean
          categoria: string | null
          orden: number
          division_codigo: string
          activo: boolean
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          es_obligatorio?: boolean
          categoria?: string | null
          orden?: number
          division_codigo: string
          activo?: boolean
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          es_obligatorio?: boolean
          categoria?: string | null
          orden?: number
          division_codigo?: string
          activo?: boolean
        }
        Relationships: []
      }
      anmat_comunicaciones: {
        Row: {
          id: string
          caso_id: string
          canal: string
          direccion: string
          asunto: string | null
          contenido: string
          enviado: boolean
          fecha_envio: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          caso_id: string
          canal: string
          direccion: string
          asunto?: string | null
          contenido: string
          enviado?: boolean
          fecha_envio?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          caso_id?: string
          canal?: string
          direccion?: string
          asunto?: string | null
          contenido?: string
          enviado?: boolean
          fecha_envio?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          id: string
          app_id: string | null
          app_secret: string | null
          phone_number_id: string | null
          access_token: string | null
          verify_token: string | null
          waba_id: string | null
          bot_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          app_id?: string | null
          app_secret?: string | null
          phone_number_id?: string | null
          access_token?: string | null
          verify_token?: string | null
          waba_id?: string | null
          bot_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          app_id?: string | null
          app_secret?: string | null
          phone_number_id?: string | null
          access_token?: string | null
          verify_token?: string | null
          waba_id?: string | null
          bot_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_authorized_numbers: {
        Row: {
          id: string
          phone_number: string
          display_name: string | null
          usuario_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          phone_number: string
          display_name?: string | null
          usuario_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          phone_number?: string
          display_name?: string | null
          usuario_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          id: string
          wa_message_id: string | null
          phone_number: string
          direction: string
          message_text: string | null
          message_type: string | null
          ai_action: Json | null
          ai_response_text: string | null
          pending_action: Json | null
          status: string
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wa_message_id?: string | null
          phone_number: string
          direction: string
          message_text?: string | null
          message_type?: string | null
          ai_action?: Json | null
          ai_response_text?: string | null
          pending_action?: Json | null
          status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wa_message_id?: string | null
          phone_number?: string
          direction?: string
          message_text?: string | null
          message_type?: string | null
          ai_action?: Json | null
          ai_response_text?: string | null
          pending_action?: Json | null
          status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_anmat_dashboard: {
        Row: {
          id: string | null
          estado: string | null
          es_urgente: boolean | null
          descripcion_cliente: string | null
          referencia_cliente: string | null
          fuente_contacto: string | null
          cantidad_skus: number | null
          fecha_ingreso_puerto: string | null
          datos_especificos: Json | null
          created_at: string | null
          updated_at: string | null
          cliente_id: string | null
          cliente_razon_social: string | null
          cliente_cuit: string | null
          division_id: string | null
          division_codigo: string | null
          division_nombre: string | null
          asignado_id: string | null
          asignado_nombre: string | null
          total_productos: number | null
          total_familias: number | null
          total_documentos: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
