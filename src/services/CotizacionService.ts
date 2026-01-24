import { supabase } from '../lib/supabase';

export interface ConversionResult {
  success: boolean;
  proyectoId?: string;
  clienteId?: string;
  error?: string;
}

export class CotizacionService {
  static async convertirCotizacionAProyecto(cotizacionId: string): Promise<ConversionResult> {
    try {
      const { data: cotizacion, error: cotizError } = await supabase
        .from('cotizaciones')
        .select(`
          *,
          cotizacion_items (*)
        `)
        .eq('id', cotizacionId)
        .single();

      if (cotizError || !cotizacion) {
        return { success: false, error: 'No se encontró la cotización' };
      }

      if (cotizacion.estado !== 'aceptada') {
        return { success: false, error: 'La cotización debe estar en estado "aceptada"' };
      }

      if (cotizacion.proyecto_id) {
        return { success: false, error: 'Esta cotización ya fue convertida a proyecto' };
      }

      let clienteId = cotizacion.cliente_id;

      if (!clienteId && cotizacion.contacto_temporal_id) {
        const { data: contacto } = await supabase
          .from('contactos_temporales')
          .select('*')
          .eq('id', cotizacion.contacto_temporal_id)
          .single();

        if (contacto) {
          const cuitGenerico = `99-${Date.now().toString().slice(-8)}-9`;

          const { data: nuevoCliente, error: clienteError } = await supabase
            .from('clientes')
            .insert([{
              razon_social: contacto.nombre_empresa,
              cuit: cuitGenerico,
              email: contacto.email,
              telefono: contacto.telefono
            }])
            .select()
            .single();

          if (clienteError || !nuevoCliente) {
            return { success: false, error: 'Error al crear el cliente: ' + clienteError?.message };
          }

          clienteId = nuevoCliente.id;

          await supabase
            .from('contactos_temporales')
            .update({ estado: 'convertido' })
            .eq('id', cotizacion.contacto_temporal_id);
        }
      }

      if (!clienteId) {
        return { success: false, error: 'No se pudo determinar el cliente' };
      }

      const { data: productos } = await supabase
        .from('productos')
        .select('id')
        .eq('cliente_id', clienteId)
        .limit(1);

      let productoId: string | undefined;

      if (productos && productos.length > 0) {
        productoId = productos[0].id;
      } else {
        const { data: nuevoProducto, error: productoError } = await supabase
          .from('productos')
          .insert([{
            cliente_id: clienteId,
            nombre: 'Producto General',
            marca: 'N/A',
            rubro: 'General',
            pais_origen: 'Argentina'
          }])
          .select()
          .single();

        if (productoError || !nuevoProducto) {
          return { success: false, error: 'Error al crear producto: ' + productoError?.message };
        }

        productoId = nuevoProducto.id;
      }

      const nombreProyecto = `Proyecto ${cotizacion.nombre_cliente} - ${cotizacion.numero_cotizacion}`;

      const { data: nuevoProyecto, error: proyectoError } = await supabase
        .from('proyectos')
        .insert([{
          nombre_proyecto: nombreProyecto,
          cliente_id: clienteId,
          producto_id: productoId,
          estado: 'presupuesto_aprobado',
          prioridad: 'normal'
        }])
        .select()
        .single();

      if (proyectoError || !nuevoProyecto) {
        return { success: false, error: 'Error al crear proyecto: ' + proyectoError?.message };
      }

      const { data: nuevoPresupuesto, error: presupuestoError } = await supabase
        .from('presupuestos')
        .insert([{
          proyecto_id: nuevoProyecto.id,
          estado: 'aprobado',
          total_final: cotizacion.precio_total,
          fecha_aprobacion: new Date().toISOString()
        }])
        .select()
        .single();

      if (presupuestoError || !nuevoPresupuesto) {
        return { success: false, error: 'Error al crear presupuesto: ' + presupuestoError?.message };
      }

      if (cotizacion.cotizacion_items && cotizacion.cotizacion_items.length > 0) {
        const presupuestoItems = cotizacion.cotizacion_items.map((item: any) => ({
          presupuesto_id: nuevoPresupuesto.id,
          concepto: item.concepto,
          tipo: item.tipo,
          monto: item.precio_venta,
          cantidad: item.cantidad
        }));

        const { error: itemsError } = await supabase
          .from('presupuesto_items')
          .insert(presupuestoItems);

        if (itemsError) {
          console.error('Error al crear items de presupuesto:', itemsError);
        }

        const itemsConTramite = cotizacion.cotizacion_items.filter((item: any) => item.tramite_tipo_id);

        if (itemsConTramite.length > 0) {
          const expedientesData = [];

          for (const item of itemsConTramite) {
            const codigoExpediente = `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() + 90);

            expedientesData.push({
              codigo: codigoExpediente,
              proyecto_id: nuevoProyecto.id,
              tramite_tipo_id: item.tramite_tipo_id,
              estado: 'iniciado',
              fecha_limite: fechaLimite.toISOString(),
              paso_actual: 1,
              progreso: 0,
              semaforo: 'verde',
              observaciones: `Expediente generado desde cotización ${cotizacion.numero_cotizacion}`
            });
          }

          if (expedientesData.length > 0) {
            const { error: expedientesError } = await supabase
              .from('expedientes')
              .insert(expedientesData);

            if (expedientesError) {
              console.error('Error al crear expedientes:', expedientesError);
            }
          }
        }
      }

      const { error: updateError } = await supabase
        .from('cotizaciones')
        .update({
          estado: 'convertida',
          proyecto_id: nuevoProyecto.id,
          cliente_id: clienteId
        })
        .eq('id', cotizacionId);

      if (updateError) {
        console.error('Error al actualizar cotización:', updateError);
      }

      await supabase
        .from('historial')
        .insert([{
          proyecto_id: nuevoProyecto.id,
          accion: 'proyecto_creado',
          descripcion: `Proyecto creado desde cotización ${cotizacion.numero_cotizacion}`
        }]);

      return {
        success: true,
        proyectoId: nuevoProyecto.id,
        clienteId: clienteId
      };

    } catch (error: any) {
      console.error('Error en conversión:', error);
      return { success: false, error: error.message || 'Error desconocido' };
    }
  }

  static async generarYGuardarUrlPublica(cotizacionId: string): Promise<string | null> {
    try {
      const { data: urlData } = await supabase.rpc('generate_url_publica');

      if (!urlData) return null;

      const { error } = await supabase
        .from('cotizaciones')
        .update({ url_publica: urlData })
        .eq('id', cotizacionId);

      if (error) return null;

      return urlData;
    } catch (error) {
      console.error('Error al generar URL pública:', error);
      return null;
    }
  }

  static async obtenerEstadisticasCotizaciones() {
    try {
      const { data: cotizaciones } = await supabase
        .from('cotizaciones')
        .select('estado, precio_total, margen_total, fecha_emision');

      if (!cotizaciones) {
        return {
          totalCotizaciones: 0,
          cotizacionesMes: 0,
          tasaConversion: 0,
          margenPromedio: 0,
          montoTotalAceptado: 0,
          cotizacionesPendientes: 0
        };
      }

      const mesActual = new Date().getMonth();
      const añoActual = new Date().getFullYear();

      const totalCotizaciones = cotizaciones.length;
      const cotizacionesMes = cotizaciones.filter(c => {
        const fecha = new Date(c.fecha_emision);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
      }).length;

      const aceptadas = cotizaciones.filter(c => c.estado === 'aceptada' || c.estado === 'convertida');
      const tasaConversion = totalCotizaciones > 0 ? (aceptadas.length / totalCotizaciones) * 100 : 0;

      const margenPromedio = cotizaciones.length > 0
        ? cotizaciones.reduce((sum, c) => sum + (c.margen_total || 0), 0) / cotizaciones.length
        : 0;

      const montoTotalAceptado = aceptadas.reduce((sum, c) => sum + (c.precio_total || 0), 0);

      const cotizacionesPendientes = cotizaciones.filter(c =>
        ['enviada', 'negociacion'].includes(c.estado)
      ).length;

      return {
        totalCotizaciones,
        cotizacionesMes,
        tasaConversion,
        margenPromedio,
        montoTotalAceptado,
        cotizacionesPendientes
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        totalCotizaciones: 0,
        cotizacionesMes: 0,
        tasaConversion: 0,
        margenPromedio: 0,
        montoTotalAceptado: 0,
        cotizacionesPendientes: 0
      };
    }
  }
}
