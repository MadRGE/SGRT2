import { supabase } from '../lib/supabase';

interface CreateProyectoParams {
  nombre_proyecto: string;
  cliente_id: string;
  productos_ids: string[];
  destino: string;
  expedientes_sugeridos: Array<{
    tramite_tipo_id: string;
    permite_familia: boolean;
    costo_honorarios_base?: number;
    costo_tasas_base?: number;
    nombre?: string;
  }>;
}

export class ProyectoService {
  static async crearProyectoConFamilia(params: CreateProyectoParams) {
    const {
      nombre_proyecto,
      cliente_id,
      productos_ids,
      destino,
      expedientes_sugeridos
    } = params;

    try {
      const { data: proyecto, error: proyectoError } = await supabase
        .from('proyectos')
        .insert({
          nombre_proyecto,
          cliente_id,
          producto_id: productos_ids[0],
          estado: 'relevamiento'
        })
        .select()
        .single();

      if (proyectoError) throw proyectoError;

      const proyectoProductosInserts = productos_ids.map(producto_id => ({
        proyecto_id: proyecto.id,
        producto_id
      }));

      const { error: ppError } = await supabase
        .from('proyecto_productos')
        .insert(proyectoProductosInserts);

      if (ppError) throw ppError;

      const { data: presupuesto, error: presupuestoError } = await supabase
        .from('presupuestos')
        .insert({
          proyecto_id: proyecto.id,
          estado: 'borrador',
          total_final: 0
        })
        .select()
        .single();

      if (presupuestoError) throw presupuestoError;

      const expedientesACrear = expedientes_sugeridos.map((exp, index) => ({
        codigo: `EXP-${Date.now()}-${index}`,
        proyecto_id: proyecto.id,
        tramite_tipo_id: exp.tramite_tipo_id,
        estado: 'iniciado',
        fecha_limite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        semaforo: 'verde'
      }));

      if (expedientesACrear.length > 0) {
        const { data: expedientesCreados, error: expError } = await supabase
          .from('expedientes')
          .insert(expedientesACrear)
          .select();

        if (expError) throw expError;

        const expedienteProductosInserts: Array<{
          expediente_id: string;
          producto_id: string;
        }> = [];

        expedientesCreados?.forEach((expediente, index) => {
          const permiteFamily = expedientes_sugeridos[index].permite_familia;

          if (permiteFamily) {
            productos_ids.forEach(producto_id => {
              expedienteProductosInserts.push({
                expediente_id: expediente.id,
                producto_id
              });
            });
          } else {
            expedienteProductosInserts.push({
              expediente_id: expediente.id,
              producto_id: productos_ids[0]
            });
          }
        });

        if (expedienteProductosInserts.length > 0) {
          const { error: epError } = await supabase
            .from('expediente_productos')
            .insert(expedienteProductosInserts);

          if (epError) throw epError;
        }

        const presupuestoItemsInserts: Array<{
          presupuesto_id: string;
          expediente_id?: string;
          concepto: string;
          tipo: string;
          monto: number;
          direccionado: boolean;
        }> = [];

        expedientesCreados?.forEach((expediente, index) => {
          const tramite = expedientes_sugeridos[index];

          if (tramite.costo_honorarios_base && tramite.costo_honorarios_base > 0) {
            presupuestoItemsInserts.push({
              presupuesto_id: presupuesto.id,
              expediente_id: expediente.id,
              concepto: `Honorarios - ${tramite.nombre || tramite.tramite_tipo_id}`,
              tipo: 'honorario',
              monto: tramite.costo_honorarios_base,
              direccionado: true
            });
          }

          if (tramite.costo_tasas_base && tramite.costo_tasas_base > 0) {
            presupuestoItemsInserts.push({
              presupuesto_id: presupuesto.id,
              expediente_id: expediente.id,
              concepto: `Tasa - ${tramite.nombre || tramite.tramite_tipo_id}`,
              tipo: 'tasa_organismo',
              monto: tramite.costo_tasas_base,
              direccionado: true
            });
          }
        });

        if (presupuestoItemsInserts.length > 0) {
          const totalPresupuesto = presupuestoItemsInserts.reduce((sum, item) => sum + item.monto, 0);

          const { error: piError } = await supabase
            .from('presupuesto_items')
            .insert(presupuestoItemsInserts);

          if (piError) throw piError;

          const { error: updatePresupuestoError } = await supabase
            .from('presupuestos')
            .update({ total_final: totalPresupuesto })
            .eq('id', presupuesto.id);

          if (updatePresupuestoError) throw updatePresupuestoError;
        }
      }

      return { success: true, proyecto_id: proyecto.id };
    } catch (error: any) {
      console.error('Error al crear proyecto:', error);
      return { success: false, error: error.message };
    }
  }

  static async verificarBlockers(cliente_id: string, rubros: string[]) {
    const blockerMap: { [key: string]: string } = {
      'Alimentos': 'TT-INAL-001',
      'Envases': 'TT-INAL-001',
      'Productos Animales': 'TT-SENASA-003',
      'Cosméticos': 'TT-COSM-002',
      'Productos Médicos': 'TT-PM-005',
      'Precursores Químicos': 'TT-RENPRE-001',
      'Materiales Controlados': 'TT-ANMAC-001'
    };

    const tramitesNecesarios = Array.from(
      new Set(rubros.map(r => blockerMap[r]).filter(Boolean))
    );

    if (tramitesNecesarios.length === 0) {
      return [];
    }

    const { data: expedientesExistentes } = await supabase
      .from('expedientes')
      .select('tramite_tipo_id, estado, proyectos!inner(cliente_id)')
      .eq('proyectos.cliente_id', cliente_id)
      .in('tramite_tipo_id', tramitesNecesarios);

    const blockersFaltantes: string[] = [];

    for (const tramiteId of tramitesNecesarios) {
      const expediente = expedientesExistentes?.find(
        (e: any) => e.tramite_tipo_id === tramiteId && e.estado === 'aprobado'
      );

      if (!expediente) {
        blockersFaltantes.push(tramiteId);
      }
    }

    return blockersFaltantes;
  }
}
