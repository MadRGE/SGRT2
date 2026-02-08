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
          cuit: string
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          razon_social: string
          cuit: string
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          razon_social?: string
          cuit?: string
          email?: string | null
          created_at?: string
        }
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
      }
      proyectos: {
        Row: {
          id: string
          nombre_proyecto: string
          cliente_id: string
          producto_id: string
          estado: string
          prioridad: string
          fecha_inicio: string
          created_at: string
        }
        Insert: {
          id?: string
          nombre_proyecto: string
          cliente_id: string
          producto_id: string
          estado?: string
          prioridad?: string
          fecha_inicio?: string
          created_at?: string
        }
        Update: {
          id?: string
          nombre_proyecto?: string
          cliente_id?: string
          producto_id?: string
          estado?: string
          prioridad?: string
          fecha_inicio?: string
          created_at?: string
        }
      }
      expedientes: {
        Row: {
          id: string
          codigo: string
          proyecto_id: string
          tramite_tipo_id: string
          estado: string
          fecha_limite: string
          fecha_finalizacion: string | null
          paso_actual: number
          progreso: number
          semaforo: string
          observaciones: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo: string
          proyecto_id: string
          tramite_tipo_id: string
          estado?: string
          fecha_limite: string
          fecha_finalizacion?: string | null
          paso_actual?: number
          progreso?: number
          semaforo?: string
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          proyecto_id?: string
          tramite_tipo_id?: string
          estado?: string
          fecha_limite?: string
          fecha_finalizacion?: string | null
          paso_actual?: number
          progreso?: number
          semaforo?: string
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organismos: {
        Row: {
          id: string
          sigla: string
          nombre: string
          plataforma_presentacion: string | null
        }
        Insert: {
          id: string
          sigla: string
          nombre: string
          plataforma_presentacion?: string | null
        }
        Update: {
          id?: string
          sigla?: string
          nombre?: string
          plataforma_presentacion?: string | null
        }
      }
      tramite_tipos: {
        Row: {
          id: string
          codigo: string
          nombre: string
          organismo_id: string | null
          rubro: string | null
          base_legal: string[] | null
          renovacion: string | null
          sla_total_dias: number
          admite_equivalencia: boolean
          logica_especial: string | null
          es_habilitacion_previa: boolean
        }
        Insert: {
          id: string
          codigo: string
          nombre: string
          organismo_id?: string | null
          rubro?: string | null
          base_legal?: string[] | null
          renovacion?: string | null
          sla_total_dias?: number
          admite_equivalencia?: boolean
          logica_especial?: string | null
          es_habilitacion_previa?: boolean
        }
        Update: {
          id?: string
          codigo?: string
          nombre?: string
          organismo_id?: string | null
          rubro?: string | null
          base_legal?: string[] | null
          renovacion?: string | null
          sla_total_dias?: number
          admite_equivalencia?: boolean
          logica_especial?: string | null
          es_habilitacion_previa?: boolean
        }
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
      }
      documentos: {
        Row: {
          id: string
          expediente_id: string
          checklist_item_id: number | null
          nombre: string
          url_archivo: string | null
          estado: string
          created_at: string
        }
        Insert: {
          id?: string
          expediente_id: string
          checklist_item_id?: number | null
          nombre: string
          url_archivo?: string | null
          estado?: string
          created_at?: string
        }
        Update: {
          id?: string
          expediente_id?: string
          checklist_item_id?: number | null
          nombre?: string
          url_archivo?: string | null
          estado?: string
          created_at?: string
        }
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
      }
      usuarios: {
        Row: {
          id: string
          auth_id: string
          email: string
          nombre: string
          rol: string
          cliente_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          email: string
          nombre: string
          rol: string
          cliente_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          email?: string
          nombre?: string
          rol?: string
          cliente_id?: string | null
          created_at?: string
        }
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
      }
    }
  }
}
