import { supabase } from '../lib/supabase';
import mapeoFormularios from '../data/mapeo_formularios.json';

interface DatosCompletos {
  cliente: {
    razon_social: string;
    cuit: string;
    direccion?: string;
    email?: string;
  };
  producto: {
    nombre: string;
    marca?: string;
    pais_origen?: string;
    rubro?: string;
  };
  proyecto: {
    id: string;
    nombre_proyecto: string;
    metadata?: Record<string, any>;
  };
  system: {
    current_date: string;
  };
}

interface ConfigFormulario {
  codigo: string;
  nombre: string;
  checklistItemId: number;
  plantillaUrl: string;
  mapeo: Record<string, string>;
}

export class FormularioService {
  public async generarYVincularFormulario(
    expedienteId: string,
    checklistItemId: number,
    tramiteTipoId: string
  ) {
    console.log(
      `[FormularioService] Iniciando generación para checklist item: ${checklistItemId}, trámite: ${tramiteTipoId}`
    );

    try {
      const config = (mapeoFormularios as Record<string, ConfigFormulario>)[tramiteTipoId];
      if (!config || config.checklistItemId !== checklistItemId) {
        throw new Error(
          `No existe mapeo de formulario para el trámite ${tramiteTipoId} e ítem ${checklistItemId}`
        );
      }

      const datos = await this.obtenerDatosCompletos(expedienteId);

      const datosRellenados = this.prepararDatosFormulario(config.mapeo, datos);

      const nombreArchivo = `[AUTO]_${config.codigo}_${new Date().getTime()}.pdf`;

      const { data: docExistente } = await supabase
        .from('documentos')
        .select('id')
        .eq('expediente_id', expedienteId)
        .eq('checklist_item_id', checklistItemId)
        .maybeSingle();

      let documentoId: string;

      if (docExistente) {
        const { data: docActualizado, error: updateError } = await supabase
          .from('documentos')
          .update({
            nombre: nombreArchivo,
            url_archivo: `/plantillas/auto-generated/${nombreArchivo}`,
            estado: 'revision',
            updated_at: new Date().toISOString()
          })
          .eq('id', docExistente.id)
          .select()
          .single();

        if (updateError) throw updateError;
        documentoId = docActualizado.id;
      } else {
        const nuevoDocumento = {
          expediente_id: expedienteId,
          checklist_item_id: checklistItemId,
          nombre: nombreArchivo,
          url_archivo: `/plantillas/auto-generated/${nombreArchivo}`,
          estado: 'revision'
        };

        const { data: docData, error: docError } = await supabase
          .from('documentos')
          .insert(nuevoDocumento)
          .select()
          .single();

        if (docError) throw docError;
        documentoId = docData.id;
      }

      console.log('[FormularioService] Formulario generado exitosamente:', {
        documentoId,
        nombreArchivo,
        plantilla: config.plantillaUrl,
        datosRellenados
      });

      return {
        id: documentoId,
        nombre: nombreArchivo,
        url_archivo: `/plantillas/auto-generated/${nombreArchivo}`,
        estado: 'revision',
        datosRellenados,
        plantillaUsada: config.nombre
      };
    } catch (error) {
      console.error('[FormularioService] Error:', error);
      throw error;
    }
  }

  private async obtenerDatosCompletos(expedienteId: string): Promise<DatosCompletos> {
    const { data: expediente, error: expError } = await supabase
      .from('expedientes')
      .select(
        `
        id,
        proyecto_id,
        proyectos (
          id,
          nombre_proyecto,
          cliente_id,
          producto_id,
          clientes (razon_social, cuit, email),
          productos (nombre, marca, pais_origen, rubro)
        )
      `
      )
      .eq('id', expedienteId)
      .single();

    if (expError || !expediente) {
      throw new Error(`Expediente no encontrado: ${expedienteId}`);
    }

    const proyecto = (expediente as any).proyectos;
    if (!proyecto) {
      throw new Error('Proyecto no encontrado para el expediente');
    }

    return {
      cliente: {
        razon_social: proyecto.clientes?.razon_social || 'N/A',
        cuit: proyecto.clientes?.cuit || 'N/A',
        direccion: proyecto.clientes?.direccion || '',
        email: proyecto.clientes?.email || ''
      },
      producto: {
        nombre: proyecto.productos?.nombre || 'N/A',
        marca: proyecto.productos?.marca || '',
        pais_origen: proyecto.productos?.pais_origen || '',
        rubro: proyecto.productos?.rubro || ''
      },
      proyecto: {
        id: proyecto.id,
        nombre_proyecto: proyecto.nombre_proyecto,
        metadata: {}
      },
      system: {
        current_date: new Date().toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      }
    };
  }

  private prepararDatosFormulario(
    mapeo: Record<string, string>,
    datos: DatosCompletos
  ): Record<string, string> {
    const resultado: Record<string, string> = {};

    for (const [campoPDF, claveDato] of Object.entries(mapeo)) {
      const valor = this.resolverClaveDato(claveDato, datos);
      resultado[campoPDF] = valor || '';
    }

    return resultado;
  }

  private resolverClaveDato(claveDato: string, datos: DatosCompletos): string {
    const partes = claveDato.split('.');
    let valor: any = datos;

    for (const parte of partes) {
      if (valor && typeof valor === 'object' && parte in valor) {
        valor = valor[parte];
      } else {
        return '';
      }
    }

    return String(valor || '');
  }

  public async obtenerConfiguracionFormulario(
    tramiteTipoId: string,
    checklistItemId: number
  ): Promise<ConfigFormulario | null> {
    const config = (mapeoFormularios as Record<string, ConfigFormulario>)[tramiteTipoId];

    if (!config || config.checklistItemId !== checklistItemId) {
      return null;
    }

    return config;
  }

  public listarFormulariosDisponibles(): Array<{
    tramiteTipoId: string;
    config: ConfigFormulario;
  }> {
    return Object.entries(mapeoFormularios as Record<string, ConfigFormulario>).map(
      ([tramiteTipoId, config]) => ({
        tramiteTipoId,
        config
      })
    );
  }
}

export const formularioService = new FormularioService();
