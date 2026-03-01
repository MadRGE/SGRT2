import { supabase, filterActive } from '../lib/supabase';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface Despacho {
  id: string;
  despachante_id: string;
  cliente_id: string;
  gestion_id?: string | null;
  tramite_id?: string | null;
  numero_despacho: string;
  tipo: 'importacion' | 'exportacion';
  estado: string;
  descripcion?: string | null;
  posicion_arancelaria?: string | null;
  valor_fob?: number | null;
  valor_cif?: number | null;
  moneda: string;
  peso_kg?: number | null;
  cantidad_bultos?: number | null;
  numero_guia?: string | null;
  booking_number?: string | null;
  fecha_presentacion?: string | null;
  fecha_oficializacion?: string | null;
  fecha_canal?: string | null;
  fecha_liberacion?: string | null;
  prioridad: string;
  observaciones?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  clientes?: { razon_social: string; cuit: string } | null;
}

export interface DespachoDoc {
  id: string;
  despacho_id: string;
  nombre: string;
  tipo_documento: string;
  estado: string;
  obligatorio: boolean;
  archivo_path?: string | null;
  archivo_nombre?: string | null;
  archivo_size?: number | null;
  notas?: string | null;
  created_at: string;
}

export interface Liquidacion {
  id: string;
  despacho_id: string;
  valor_en_aduana: number;
  moneda: string;
  tipo_cambio: number;
  derecho_importacion_pct: number;
  derecho_importacion: number;
  tasa_estadistica_pct: number;
  tasa_estadistica: number;
  iva_pct: number;
  iva: number;
  iva_adicional_pct: number;
  iva_adicional: number;
  ingresos_brutos_pct: number;
  ingresos_brutos: number;
  ganancias_pct: number;
  ganancias: number;
  total_tributos: number;
  total_ars: number;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface Carga {
  id: string;
  despacho_id: string;
  tipo_transporte: string;
  numero_contenedor?: string | null;
  numero_bl?: string | null;
  numero_awb?: string | null;
  booking_number?: string | null;
  naviera_aerolinea?: string | null;
  buque_vuelo?: string | null;
  estado: string;
  fecha_embarque?: string | null;
  fecha_arribo_estimado?: string | null;
  fecha_arribo_real?: string | null;
  fecha_ingreso_deposito?: string | null;
  fecha_liberacion?: string | null;
  puerto_origen?: string | null;
  puerto_destino?: string | null;
  peso_kg?: number | null;
  volumen_m3?: number | null;
  cantidad_bultos?: number | null;
  created_at: string;
  updated_at: string;
}

export interface LiquidacionParams {
  valor_en_aduana: number;
  tipo_cambio: number;
  derecho_importacion_pct: number;
  tasa_estadistica_pct: number;
  iva_pct: number;
  iva_adicional_pct: number;
  ingresos_brutos_pct: number;
  ganancias_pct: number;
}

export interface DashboardStats {
  activos: number;
  pendientesCanal: number;
  liberadosMes: number;
  montoUsd: number;
}

// ── Service ─────────────────────────────────────────────────────────────────

export class DespachoService {

  // Auto-increment: DESP-YYYY-NNNN
  static async generateNumeroDespacho(): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const prefix = `DESP-${year}-`;

      const { data } = await supabase
        .from('despachos')
        .select('numero_despacho')
        .like('numero_despacho', `${prefix}%`)
        .order('numero_despacho', { ascending: false })
        .limit(1);

      let next = 1;
      if (data && data.length > 0) {
        const last = data[0].numero_despacho;
        const num = parseInt(last.replace(prefix, ''), 10);
        if (!isNaN(num)) next = num + 1;
      }

      return `${prefix}${String(next).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating numero_despacho:', error);
      const ts = Date.now().toString().slice(-6);
      return `DESP-${new Date().getFullYear()}-${ts}`;
    }
  }

  static async getDespachosByDespachante(
    despachanteId: string,
    filtros?: { estado?: string; tipo?: string; search?: string }
  ): Promise<Despacho[]> {
    try {
      let query = filterActive(
        supabase
          .from('despachos')
          .select('*, clientes(razon_social, cuit)')
          .eq('despachante_id', despachanteId)
      );

      if (filtros?.estado && filtros.estado !== 'todos') {
        query = query.eq('estado', filtros.estado);
      }
      if (filtros?.tipo && filtros.tipo !== 'todos') {
        query = query.eq('tipo', filtros.tipo);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      let results = data || [];

      if (filtros?.search) {
        const s = filtros.search.toLowerCase();
        results = results.filter((d: Despacho) =>
          d.numero_despacho.toLowerCase().includes(s) ||
          d.descripcion?.toLowerCase().includes(s) ||
          d.clientes?.razon_social?.toLowerCase().includes(s) ||
          d.posicion_arancelaria?.toLowerCase().includes(s)
        );
      }

      return results;
    } catch (error) {
      console.error('Error fetching despachos:', error);
      return [];
    }
  }

  static async getDespachoById(id: string): Promise<Despacho | null> {
    try {
      const { data, error } = await supabase
        .from('despachos')
        .select('*, clientes(razon_social, cuit)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching despacho:', error);
      return null;
    }
  }

  static async createDespacho(despacho: Partial<Despacho>, maxRetries = 3): Promise<{ success: boolean; data?: Despacho; error?: string }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const numero = await this.generateNumeroDespacho();
        const { data, error } = await supabase
          .from('despachos')
          .insert([{ ...despacho, numero_despacho: numero }])
          .select('*, clientes(razon_social, cuit)')
          .single();

        if (error) {
          // Postgres unique violation — retry with a new number
          if (error.code === '23505' && attempt < maxRetries - 1) continue;
          throw error;
        }
        return { success: true, data };
      } catch (error: any) {
        if (error.code === '23505' && attempt < maxRetries - 1) continue;
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'No se pudo generar un número único de despacho' };
  }

  static async updateDespacho(id: string, updates: Partial<Despacho>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('despachos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Dashboard KPIs
  static async getDashboardStats(despachanteId: string): Promise<DashboardStats> {
    try {
      const [activos, pendientes, liberados, montos] = await Promise.all([
        // Despachos activos (no liberado, no rechazado)
        supabase
          .from('despachos')
          .select('id', { count: 'exact', head: true })
          .eq('despachante_id', despachanteId)
          .is('deleted_at', null)
          .not('estado', 'in', '("liberado","rechazado")'),

        // Pendientes de canal (estado = presentado)
        supabase
          .from('despachos')
          .select('id', { count: 'exact', head: true })
          .eq('despachante_id', despachanteId)
          .is('deleted_at', null)
          .eq('estado', 'presentado'),

        // Liberados este mes
        supabase
          .from('despachos')
          .select('id', { count: 'exact', head: true })
          .eq('despachante_id', despachanteId)
          .eq('estado', 'liberado')
          .gte('fecha_liberacion', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),

        // Total valor FOB USD
        supabase
          .from('despachos')
          .select('valor_fob')
          .eq('despachante_id', despachanteId)
          .is('deleted_at', null)
          .not('estado', 'in', '("liberado","rechazado")'),
      ]);

      const totalFob = (montos.data || []).reduce((sum: number, d: { valor_fob: number | null }) =>
        sum + (d.valor_fob || 0), 0
      );

      return {
        activos: activos.count || 0,
        pendientesCanal: pendientes.count || 0,
        liberadosMes: liberados.count || 0,
        montoUsd: totalFob,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { activos: 0, pendientesCanal: 0, liberadosMes: 0, montoUsd: 0 };
    }
  }

  // Pure calculation of liquidación (no DB)
  static calculateLiquidacion(params: LiquidacionParams) {
    const baseArs = params.valor_en_aduana * params.tipo_cambio;

    const di = baseArs * (params.derecho_importacion_pct / 100);
    const te = baseArs * (params.tasa_estadistica_pct / 100);

    // IVA y percepciones se calculan sobre base + DI + TE
    const baseImpositiva = baseArs + di + te;
    const iva = baseImpositiva * (params.iva_pct / 100);
    const ivaAdicional = baseImpositiva * (params.iva_adicional_pct / 100);
    const iibb = baseImpositiva * (params.ingresos_brutos_pct / 100);
    const ganancias = baseImpositiva * (params.ganancias_pct / 100);

    const totalTributos = di + te + iva + ivaAdicional + iibb + ganancias;

    return {
      derecho_importacion: round2(di),
      tasa_estadistica: round2(te),
      iva: round2(iva),
      iva_adicional: round2(ivaAdicional),
      ingresos_brutos: round2(iibb),
      ganancias: round2(ganancias),
      total_tributos: round2(totalTributos),
      total_ars: round2(totalTributos),
    };
  }

  static formatMonto(monto: number, moneda: string = 'ARS'): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2,
    }).format(monto);
  }

  // Monthly despacho counts (last 6 months) for dashboard chart
  static async getMonthlyDespachos(despachanteId: string): Promise<{ month: string; count: number }[]> {
    try {
      const results: { month: string; count: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-01`;
        const { count } = await supabase
          .from('despachos')
          .select('id', { count: 'exact', head: true })
          .eq('despachante_id', despachanteId)
          .is('deleted_at', null)
          .gte('created_at', start)
          .lt('created_at', endStr);
        results.push({
          month: d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
          count: count || 0,
        });
      }
      return results;
    } catch {
      return [];
    }
  }

  // Stalled despachos: not liberado/rechazado and no updates in >14 days
  static async getStalledDespachos(despachanteId: string): Promise<Despacho[]> {
    try {
      const cutoff = new Date(Date.now() - 14 * 86400000).toISOString();
      const { data, error } = await filterActive(
        supabase
          .from('despachos')
          .select('*, clientes(razon_social, cuit)')
          .eq('despachante_id', despachanteId)
          .not('estado', 'in', '("liberado","rechazado")')
          .lt('updated_at', cutoff)
      ).order('updated_at', { ascending: true }).limit(5);
      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  }

  // Reports: despachos by month (for bar chart)
  static async getReportDespachosPorMes(despachanteId: string, months = 12): Promise<{ month: string; importacion: number; exportacion: number }[]> {
    try {
      const results: { month: string; importacion: number; exportacion: number }[] = [];
      const now = new Date();
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-01`;

        const { data } = await filterActive(
          supabase
            .from('despachos')
            .select('tipo')
            .eq('despachante_id', despachanteId)
            .gte('created_at', start)
            .lt('created_at', endStr)
        );
        const arr = data || [];
        results.push({
          month: d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
          importacion: arr.filter((x: { tipo: string }) => x.tipo === 'importacion').length,
          exportacion: arr.filter((x: { tipo: string }) => x.tipo === 'exportacion').length,
        });
      }
      return results;
    } catch {
      return [];
    }
  }

  // Reports: revenue by client
  static async getRevenueByCliente(despachanteId: string): Promise<{ cliente: string; total: number }[]> {
    try {
      const { data, error } = await filterActive(
        supabase
          .from('despachos')
          .select('valor_fob, clientes(razon_social)')
          .eq('despachante_id', despachanteId)
      );
      if (error) throw error;
      const byClient: Record<string, number> = {};
      (data || []).forEach((d: any) => {
        const name = d.clientes?.razon_social || 'Sin cliente';
        byClient[name] = (byClient[name] || 0) + (d.valor_fob || 0);
      });
      return Object.entries(byClient)
        .map(([cliente, total]) => ({ cliente, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    } catch {
      return [];
    }
  }

  // Reports: average processing time (created_at → fecha_liberacion)
  static async getAvgProcessingTime(despachanteId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('despachos')
        .select('created_at, fecha_liberacion')
        .eq('despachante_id', despachanteId)
        .eq('estado', 'liberado')
        .not('fecha_liberacion', 'is', null);
      if (!data || data.length === 0) return 0;
      const totalDays = data.reduce((sum: number, d: { created_at: string; fecha_liberacion: string }) => {
        const diff = new Date(d.fecha_liberacion).getTime() - new Date(d.created_at).getTime();
        return sum + diff / 86400000;
      }, 0);
      return Math.round(totalDays / data.length);
    } catch {
      return 0;
    }
  }

  // Bulk estado update for multi-select
  static async bulkUpdateEstado(ids: string[], nuevoEstado: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('despachos')
        .update({ estado: nuevoEstado })
        .in('id', ids);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Clientes asignados
  static async getClientesByDespachante(despachanteId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('despachante_clientes')
        .select('*, clientes(id, razon_social, cuit, domicilio, telefono, email)')
        .eq('despachante_id', despachanteId)
        .eq('activo', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching despachante clientes:', error);
      return [];
    }
  }

  // Despachos by cliente (for cliente detail)
  static async getDespachosByCliente(despachanteId: string, clienteId: string): Promise<Despacho[]> {
    try {
      const { data, error } = await filterActive(
        supabase
          .from('despachos')
          .select('*, clientes(razon_social, cuit)')
          .eq('despachante_id', despachanteId)
          .eq('cliente_id', clienteId)
      ).order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching despachos by cliente:', error);
      return [];
    }
  }

  // Documents
  static async getDocsByDespacho(despachoId: string): Promise<DespachoDoc[]> {
    try {
      const { data, error } = await supabase
        .from('despacho_documentos')
        .select('*')
        .eq('despacho_id', despachoId)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching despacho docs:', error);
      return [];
    }
  }

  // Liquidaciones
  static async getLiquidacionesByDespacho(despachoId: string): Promise<Liquidacion[]> {
    try {
      const { data, error } = await supabase
        .from('despacho_liquidaciones')
        .select('*')
        .eq('despacho_id', despachoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching liquidaciones:', error);
      return [];
    }
  }

  // Cargas
  static async getCargasByDespacho(despachoId: string): Promise<Carga[]> {
    try {
      const { data, error } = await supabase
        .from('cargas')
        .select('*')
        .eq('despacho_id', despachoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cargas:', error);
      return [];
    }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Returns today's date as YYYY-MM-DD in the user's local timezone (avoids UTC shift). */
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
