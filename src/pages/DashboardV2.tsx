import { useState, useEffect } from 'react';
import { supabase, filterActive } from '../lib/supabase';
import {
  GESTION_ESTADO_COLORS, GESTION_ESTADO_LABELS,
  TRAMITE_ESTADO_COLORS, TRAMITE_ESTADO_LABELS_SHORT as TRAMITE_ESTADO_LABELS,
  SEMAFORO_COLORS, PRIORIDAD_COLORS,
} from '../lib/constants/estados';
import {
  Briefcase, FileText, AlertTriangle, Calendar,
  ChevronRight, Loader2, TrendingUp, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

interface Props {
  onNavigate: (page: any) => void;
}

interface GestionRow {
  id: string;
  nombre: string;
  estado: string;
  prioridad: string;
  created_at: string;
  clientes: { razon_social: string } | null;
}

interface TramiteRow {
  id: string;
  titulo: string;
  organismo: string | null;
  estado: string;
  semaforo: string | null;
  gestiones: { nombre: string; clientes: { razon_social: string } | null } | null;
}

interface VencimientoRow {
  id: string;
  descripcion: string;
  fecha_vencimiento: string;
  clientes: { razon_social: string } | null;
}

interface ChartDataItem {
  name: string;
  value: number;
}

// Colors for the charts
const CHART_COLORS = {
  blue: '#3b82f6',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  cyan: '#06b6d4',
  pink: '#ec4899',
  slate: '#64748b',
};

// Tramite estado → chart color mapping
const TRAMITE_CHART_COLORS: Record<string, string> = {
  consulta: CHART_COLORS.slate,
  presupuestado: CHART_COLORS.purple,
  en_curso: CHART_COLORS.blue,
  esperando_cliente: CHART_COLORS.amber,
  esperando_organismo: CHART_COLORS.cyan,
  observado: CHART_COLORS.pink,
  aprobado: CHART_COLORS.green,
  rechazado: CHART_COLORS.red,
  vencido: CHART_COLORS.red,
};

// Cotizacion estado → chart color mapping
const COTIZACION_CHART_COLORS: Record<string, string> = {
  borrador: CHART_COLORS.slate,
  enviada: CHART_COLORS.blue,
  negociacion: CHART_COLORS.amber,
  aceptada: CHART_COLORS.green,
  rechazada: CHART_COLORS.red,
  vencida: CHART_COLORS.pink,
  convertida: CHART_COLORS.purple,
};

const COTIZACION_ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  negociacion: 'Negociación',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  vencida: 'Vencida',
  convertida: 'Convertida',
};

export default function DashboardV2({ onNavigate }: Props) {
  const [stats, setStats] = useState({
    gestionesActivas: 0,
    tramitesEnCurso: 0,
    semaforoRojo: 0,
    vencimientosProximos: 0,
  });
  const [gestiones, setGestiones] = useState<GestionRow[]>([]);
  const [tramitesAtencion, setTramitesAtencion] = useState<TramiteRow[]>([]);
  const [vencimientos, setVencimientos] = useState<VencimientoRow[]>([]);
  const [tramitesPorEstado, setTramitesPorEstado] = useState<ChartDataItem[]>([]);
  const [gestionesPorMes, setGestionesPorMes] = useState<ChartDataItem[]>([]);
  const [cotizacionesPorEstado, setCotizacionesPorEstado] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setError(null);
    try {
      const en30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // KPI: Gestiones activas count
      const { count: gestionesActivasCount } = await filterActive(supabase
        .from('gestiones')
        .select('*', { count: 'exact', head: true }))
        .in('estado', ['relevamiento', 'en_curso', 'en_espera']);

      // KPI: Tramites en curso count
      const { count: tramitesEnCursoCount } = await filterActive(supabase
        .from('tramites')
        .select('*', { count: 'exact', head: true }))
        .eq('estado', 'en_curso');

      // KPI: Semaforo rojo count
      const { count: semaforoRojoCount } = await filterActive(supabase
        .from('tramites')
        .select('*', { count: 'exact', head: true }))
        .eq('semaforo', 'rojo');

      // KPI: Vencimientos proximos count (next 30 days including past due)
      const { count: vencimientosCount } = await supabase
        .from('vencimientos')
        .select('*', { count: 'exact', head: true })
        .lte('fecha_vencimiento', en30dias);

      setStats({
        gestionesActivas: gestionesActivasCount || 0,
        tramitesEnCurso: tramitesEnCursoCount || 0,
        semaforoRojo: semaforoRojoCount || 0,
        vencimientosProximos: vencimientosCount || 0,
      });

      // Gestiones activas list (not finalizado/archivado)
      const { data: gestionesData } = await filterActive(supabase
        .from('gestiones')
        .select('id, nombre, estado, prioridad, created_at, clientes(razon_social)'))
        .not('estado', 'in', '("finalizado","archivado")')
        .order('created_at', { ascending: false })
        .limit(8);

      setGestiones((gestionesData as any) || []);

      // Tramites que requieren atencion (mostrar gestion padre)
      const { data: tramitesData } = await filterActive(supabase
        .from('tramites')
        .select('id, titulo, organismo, estado, semaforo, gestiones(nombre, clientes(razon_social))'))
        .or('semaforo.eq.rojo,semaforo.eq.amarillo,estado.eq.esperando_cliente,estado.eq.observado')
        .order('created_at', { ascending: false })
        .limit(8);

      setTramitesAtencion((tramitesData as any) || []);

      // Vencimientos proximos (next 5, ordered by date)
      const { data: vencimientosData } = await supabase
        .from('vencimientos')
        .select('id, descripcion, fecha_vencimiento, clientes(razon_social)')
        .lte('fecha_vencimiento', en30dias)
        .order('fecha_vencimiento', { ascending: true })
        .limit(5);

      setVencimientos((vencimientosData as any) || []);

      // ── Chart data: Trámites por estado (Pie Chart) ────────────────────────
      const { data: tramitesAll } = await filterActive(supabase
        .from('tramites')
        .select('estado'));

      if (tramitesAll) {
        const counts: Record<string, number> = {};
        (tramitesAll as { estado: string }[]).forEach((t) => {
          const est = t.estado || 'sin_estado';
          counts[est] = (counts[est] || 0) + 1;
        });
        const tramiteChartData = Object.entries(counts)
          .map(([key, val]) => ({
            name: TRAMITE_ESTADO_LABELS[key] || key,
            value: val,
            _key: key,
          }))
          .sort((a, b) => b.value - a.value);
        setTramitesPorEstado(tramiteChartData);
      }

      // ── Chart data: Gestiones creadas últimos 6 meses (Area Chart) ─────────
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const { data: gestionesByMonth } = await filterActive(supabase
        .from('gestiones')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString()));

      if (gestionesByMonth) {
        // Build 6 months of buckets
        const monthBuckets: Record<string, number> = {};
        const monthLabels: string[] = [];
        for (let i = 0; i < 6; i++) {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
          monthBuckets[key] = 0;
          monthLabels.push(key);
        }
        (gestionesByMonth as { created_at: string }[]).forEach((g) => {
          const d = new Date(g.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (monthBuckets[key] !== undefined) {
            monthBuckets[key]++;
          }
        });
        const gestionesChartData = monthLabels.map((key) => {
          const d = new Date(key + '-01');
          return {
            name: d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''),
            value: monthBuckets[key],
          };
        });
        setGestionesPorMes(gestionesChartData);
      }

      // ── Chart data: Cotizaciones por estado (Bar Chart) ────────────────────
      const { data: cotizacionesAll } = await supabase
        .from('cotizaciones')
        .select('estado');

      if (cotizacionesAll) {
        const counts: Record<string, number> = {};
        (cotizacionesAll as { estado: string }[]).forEach((c) => {
          const est = c.estado || 'sin_estado';
          counts[est] = (counts[est] || 0) + 1;
        });
        const cotizChartData = Object.entries(counts)
          .map(([key, val]) => ({
            name: COTIZACION_ESTADO_LABELS[key] || key,
            value: val,
            _key: key,
          }))
          .sort((a, b) => b.value - a.value);
        setCotizacionesPorEstado(cotizChartData);
      }

    } catch (e) {
      console.warn('Error cargando dashboard:', e);
      setError('Error al cargar los datos del dashboard. Verifique su conexión.');
    }
    setLoading(false);
  };

  const diasRestantes = (fecha: string) => {
    const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)}d vencido`, pastDue: true, soon: false };
    if (diff === 0) return { text: 'Hoy', pastDue: false, soon: true };
    if (diff === 1) return { text: 'Mañana', pastDue: false, soon: true };
    if (diff <= 30) return { text: `${diff} días`, pastDue: false, soon: true };
    return { text: `${diff} días`, pastDue: false, soon: false };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-slate-600 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <div className="max-w-[1100px] mx-auto space-y-6 md:space-y-8 py-2">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl md:text-[26px] font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">Resumen de tu actividad</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          <KpiCard
            icon={Briefcase}
            label="Gestiones Activas"
            value={stats.gestionesActivas}
            gradient="from-blue-500 to-blue-600"
            bgLight="bg-blue-50"
            textColor="text-blue-700"
            onClick={() => onNavigate({ type: 'gestiones' })}
          />
          <KpiCard
            icon={FileText}
            label="Trámites en Curso"
            value={stats.tramitesEnCurso}
            gradient="from-indigo-500 to-indigo-600"
            bgLight="bg-indigo-50"
            textColor="text-indigo-700"
            onClick={() => onNavigate({ type: 'tramites' })}
          />
          <KpiCard
            icon={AlertTriangle}
            label="Semáforo Rojo"
            value={stats.semaforoRojo}
            gradient="from-red-500 to-red-600"
            bgLight="bg-red-50"
            textColor="text-red-700"
            onClick={() => onNavigate({ type: 'tramites' })}
          />
          <KpiCard
            icon={Calendar}
            label="Vencimientos Próximos"
            value={stats.vencimientosProximos}
            gradient="from-yellow-500 to-amber-500"
            bgLight="bg-amber-50"
            textColor="text-amber-700"
            onClick={() => onNavigate({ type: 'vencimientos' })}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Trámites por Estado - Pie Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
            <h3 className="font-semibold text-slate-800 text-[15px] mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Trámites por Estado
            </h3>
            {tramitesPorEstado.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-slate-400">
                Sin datos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={tramitesPorEstado}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {tramitesPorEstado.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={TRAMITE_CHART_COLORS[entry._key] || CHART_COLORS.slate}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(value: number, name: string) => [`${value}`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Legend */}
            {tramitesPorEstado.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
                {tramitesPorEstado.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TRAMITE_CHART_COLORS[entry._key] || CHART_COLORS.slate }}
                    />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gestiones últimos 6 meses - Area Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
            <h3 className="font-semibold text-slate-800 text-[15px] mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              Gestiones (últimos 6 meses)
            </h3>
            {gestionesPorMes.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-slate-400">
                Sin datos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={gestionesPorMes} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientGestiones" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(value: number) => [`${value}`, 'Gestiones']}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '2px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={CHART_COLORS.blue}
                    strokeWidth={2.5}
                    fill="url(#gradientGestiones)"
                    dot={{ fill: CHART_COLORS.blue, strokeWidth: 0, r: 3.5 }}
                    activeDot={{ fill: CHART_COLORS.blue, strokeWidth: 2, stroke: '#fff', r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Cotizaciones por Estado - Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
            <h3 className="font-semibold text-slate-800 text-[15px] mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              Cotizaciones por Estado
            </h3>
            {cotizacionesPorEstado.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-sm text-slate-400">
                Sin datos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cotizacionesPorEstado} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      padding: '8px 12px',
                    }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(value: number, _name: string, props: any) => [`${value}`, props.payload.name]}
                    labelFormatter={() => ''}
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {cotizacionesPorEstado.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COTIZACION_CHART_COLORS[entry._key] || CHART_COLORS.slate}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
          {/* Left column (wider) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Gestiones Activas */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800 text-[15px] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Gestiones Activas
                </h2>
                <button
                  onClick={() => onNavigate({ type: 'gestiones' })}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Ver todas
                </button>
              </div>

              {gestiones.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400">No hay gestiones activas</p>
                  <button
                    onClick={() => onNavigate({ type: 'nueva-gestion' })}
                    className="mt-2 text-xs text-blue-600 font-semibold hover:text-blue-700"
                  >
                    Crear primera gestión
                  </button>
                </div>
              ) : (
                <div>
                  {gestiones.map((g, i) => (
                    <button
                      key={g.id}
                      onClick={() => onNavigate({ type: 'gestion', id: g.id })}
                      className={`w-full flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50/80 transition-colors text-left ${
                        i > 0 ? 'border-t border-slate-100/80' : ''
                      }`}
                    >
                      {/* Prioridad dot */}
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          PRIORIDAD_COLORS[g.prioridad] || 'bg-slate-300'
                        }`}
                        title={`Prioridad: ${g.prioridad}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">
                          {g.nombre}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {(g.clientes as any)?.razon_social}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-lg whitespace-nowrap ${
                          GESTION_ESTADO_COLORS[g.estado] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {GESTION_ESTADO_LABELS[g.estado] || g.estado}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-200 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tramites que requieren atencion */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800 text-[15px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                  Trámites que requieren atención
                </h2>
                <button
                  onClick={() => onNavigate({ type: 'tramites' })}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Ver todos
                </button>
              </div>

              {tramitesAtencion.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-emerald-300" />
                  </div>
                  <p className="text-sm text-slate-400">Todo en orden, no hay alertas</p>
                </div>
              ) : (
                <div>
                  {tramitesAtencion.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => onNavigate({ type: 'tramite', id: t.id })}
                      className={`w-full flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50/80 transition-colors text-left ${
                        i > 0 ? 'border-t border-slate-100/80' : ''
                      }`}
                    >
                      {/* Semaforo dot */}
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          t.semaforo ? SEMAFORO_COLORS[t.semaforo] || 'bg-slate-300' : 'bg-slate-300'
                        }`}
                        title={t.semaforo ? `Semáforo: ${t.semaforo}` : undefined}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">
                          {t.titulo}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {t.organismo && <span>{t.organismo}</span>}
                          {t.organismo && (t.gestiones as any)?.nombre && (
                            <span className="mx-1 text-slate-300">·</span>
                          )}
                          {(t.gestiones as any)?.nombre && (
                            <span>{(t.gestiones as any).nombre}</span>
                          )}
                          {(t.gestiones as any)?.clientes?.razon_social && (
                            <>
                              <span className="mx-1 text-slate-300">·</span>
                              <span>{(t.gestiones as any).clientes.razon_social}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-lg whitespace-nowrap ${
                          TRAMITE_ESTADO_COLORS[t.estado] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {TRAMITE_ESTADO_LABELS[t.estado] || t.estado}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-200 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column (narrower) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800 text-[15px] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Vencimientos Próximos
                </h2>
                <button
                  onClick={() => onNavigate({ type: 'vencimientos' })}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Ver todos
                </button>
              </div>

              {vencimientos.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-emerald-300" />
                  </div>
                  <p className="text-sm text-slate-400">Sin vencimientos próximos</p>
                </div>
              ) : (
                <div>
                  {vencimientos.map((v, i) => {
                    const d = diasRestantes(v.fecha_vencimiento);
                    const fechaFormatted = new Date(v.fecha_vencimiento).toLocaleDateString(
                      'es-AR',
                      { day: '2-digit', month: 'short' }
                    );

                    return (
                      <div
                        key={v.id}
                        className={`px-6 py-3.5 ${i > 0 ? 'border-t border-slate-100/80' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-slate-800 truncate">
                              {v.descripcion}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {(v.clientes as any)?.razon_social}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${
                                d.pastDue
                                  ? 'bg-red-50 text-red-600'
                                  : d.soon
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-slate-50 text-slate-500'
                              }`}
                            >
                              {d.text}
                            </span>
                            <span className="text-[10px] text-slate-300">{fechaFormatted}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  gradient,
  textColor,
  onClick,
}: {
  icon: any;
  label: string;
  value: number;
  gradient: string;
  bgLight?: string;
  textColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-md hover:shadow-slate-200/50 transition-all duration-200 text-left group shadow-sm shadow-slate-200/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-sm`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
      </div>
      <p className={`text-2xl md:text-3xl font-bold ${textColor} tracking-tight`}>{value}</p>
      <p className="text-[11px] md:text-[12px] text-slate-400 font-medium mt-0.5">{label}</p>
    </button>
  );
}
