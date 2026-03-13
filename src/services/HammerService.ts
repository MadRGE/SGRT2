/**
 * HammerService — Bridge between SGRT2 and Hammer agent
 *
 * Hammer is an automation agent that executes bureaucratic procedures
 * (AFIP, TAD, banking) via browser automation (Chrome CDP).
 *
 * This service provides:
 * - Execution tracking (log every step in Supabase)
 * - Procedure templates for common tramites
 * - Status polling for running executions
 */

import { supabase } from '../lib/supabase';

export interface HammerProcedure {
  id: string;
  nombre: string;
  dominio: string;       // 'tad', 'afip', 'banco', 'senasa'
  descripcion: string;
  pasos: string[];
  autoejecuteable: boolean;
  success_rate: number;
}

export interface HammerEjecucion {
  id: string;
  tramite_id?: string;
  caso_anmat_id?: string;
  tipo_tramite: string;
  procedimiento: string;
  estado: 'pendiente' | 'ejecutando' | 'completado' | 'fallido' | 'requiere_intervencion';
  pasos_ejecutados: number;
  pasos_totales: number;
  resultado: Record<string, any> | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Available Hammer procedures for SGRT2 tramites
export const HAMMER_PROCEDURES: Record<string, HammerProcedure> = {
  tad_envase_solicitud: {
    id: 'tad_envase_solicitud',
    nombre: 'Presentar Solicitud de Envase en TAD',
    dominio: 'tad',
    descripcion: 'Completa el formulario de solicitud de autorización de envases importados (riesgo medio-alto) en tramitesadistancia.gob.ar',
    pasos: [
      'Login en TAD con CUIT/CUIL',
      'Navegar a "Iniciar trámite" → ANMAT → Envases importados',
      'Completar materiales del producto',
      'Completar clasificación de riesgo',
      'Completar datos del importador',
      'Completar datos del fabricante',
      'Completar datos del producto',
      'Completar composición por pieza',
      'Adjuntar ficha técnica PDF',
      'Adjuntar certificado fabricante',
      'Confirmar y enviar',
      'Capturar número de expediente',
    ],
    autoejecuteable: false,
    success_rate: 0,
  },
  afip_generar_vep: {
    id: 'afip_generar_vep',
    nombre: 'Generar VEP en AFIP/ARCA',
    dominio: 'afip',
    descripcion: 'Genera un Volante Electrónico de Pago para el arancel del trámite',
    pasos: [
      'Login en ARCA',
      'Navegar a "Presentación de DDJJ y Pagos"',
      'Generar VEP con monto y concepto',
      'Capturar número de VEP',
    ],
    autoejecuteable: true,
    success_rate: 5,
  },
  afip_emitir_factura: {
    id: 'afip_emitir_factura',
    nombre: 'Emitir Factura Electrónica',
    dominio: 'afip',
    descripcion: 'Emite factura B/C por el servicio de gestoría',
    pasos: [
      'Login en ARCA → Comprobantes en línea',
      'Seleccionar punto de venta y tipo',
      'Completar datos del receptor',
      'Completar conceptos e importes',
      'Confirmar emisión',
      'Descargar PDF',
    ],
    autoejecuteable: true,
    success_rate: 8,
  },
  tad_consulta_expediente: {
    id: 'tad_consulta_expediente',
    nombre: 'Consultar Estado de Expediente en TAD',
    dominio: 'tad',
    descripcion: 'Consulta el estado actual de un expediente en TAD',
    pasos: [
      'Login en TAD',
      'Navegar a "Mis trámites"',
      'Buscar expediente por número',
      'Capturar estado y observaciones',
    ],
    autoejecuteable: true,
    success_rate: 6,
  },
  senasa_consulta: {
    id: 'senasa_consulta',
    nombre: 'Consultar Trámite SENASA',
    dominio: 'senasa',
    descripcion: 'Consulta estado de trámite en SENASA',
    pasos: [
      'Login en SENASA',
      'Navegar a consulta de trámites',
      'Buscar por número',
      'Capturar resultado',
    ],
    autoejecuteable: false,
    success_rate: 0,
  },
};

// Get procedures available for a specific tramite type
export function getProceduresForTramite(organismo: string, _tipo?: string): HammerProcedure[] {
  const procedures: HammerProcedure[] = [];

  if (organismo === 'INAL' || organismo === 'ANMAT') {
    procedures.push(HAMMER_PROCEDURES.tad_envase_solicitud);
    procedures.push(HAMMER_PROCEDURES.tad_consulta_expediente);
  }

  // VEP and factura available for all
  procedures.push(HAMMER_PROCEDURES.afip_generar_vep);
  procedures.push(HAMMER_PROCEDURES.afip_emitir_factura);

  if (organismo === 'SENASA') {
    procedures.push(HAMMER_PROCEDURES.senasa_consulta);
  }

  return procedures;
}

// Create a new execution record
export async function createEjecucion(data: {
  tramiteId?: string;
  casoAnmatId?: string;
  tipoTramite: string;
  procedimiento: string;
  userId?: string;
}): Promise<HammerEjecucion | null> {
  const proc = HAMMER_PROCEDURES[data.procedimiento];
  if (!proc) return null;

  const { data: row, error } = await supabase
    .from('hammer_ejecuciones')
    .insert({
      tramite_id: data.tramiteId || null,
      caso_anmat_id: data.casoAnmatId || null,
      tipo_tramite: data.tipoTramite,
      procedimiento: data.procedimiento,
      estado: 'pendiente',
      pasos_ejecutados: 0,
      pasos_totales: proc.pasos.length,
      iniciado_por: data.userId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating Hammer execution:', error);
    return null;
  }

  return row as HammerEjecucion;
}

// Update execution status
export async function updateEjecucion(
  id: string,
  updates: Partial<HammerEjecucion>
): Promise<boolean> {
  const { error } = await supabase
    .from('hammer_ejecuciones')
    .update({
      ...updates,
      ...(updates.estado === 'ejecutando' && !updates.started_at ? { started_at: new Date().toISOString() } : {}),
      ...(updates.estado === 'completado' || updates.estado === 'fallido' ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq('id', id);

  return !error;
}

// Get executions for a caso or tramite
export async function getEjecuciones(opts: {
  casoAnmatId?: string;
  tramiteId?: string;
}): Promise<HammerEjecucion[]> {
  let query = supabase
    .from('hammer_ejecuciones')
    .select('*')
    .order('created_at', { ascending: false });

  if (opts.casoAnmatId) {
    query = query.eq('caso_anmat_id', opts.casoAnmatId);
  } else if (opts.tramiteId) {
    query = query.eq('tramite_id', opts.tramiteId);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data || []) as HammerEjecucion[];
}
