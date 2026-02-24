import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TRAMITE_ESTADO_LABELS as ESTADO_LABELS } from '../lib/constants/estados';
import { Download, ArrowLeft, TrendingUp, CheckCircle, Clock, BarChart3, PieChart as PieChartIcon, Users, Building2, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

interface TramiteRow {
  id: string;
  titulo: string;
  organismo: string | null;
  estado: string;
  created_at: string;
  cliente_id: string | null;
  clientes: { razon_social: string }[] | { razon_social: string } | null;
  gestiones: { nombre: string }[] | { nombre: string } | null;
}

interface OrganismoBreakdown {
  organismo: string;
  total: number;
  aprobados: number;
  approvalRate: number;
  avgDays: number;
}

interface ClienteBreakdown {
  razon_social: string;
  total: number;
}

interface EstadoChartItem {
  name: string;
  value: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1',
];

const downloadCSV = (csvContent: string, fileName: string) => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const daysBetween = (from: Date, to: Date): number =>
  Math.max(0, Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));

/** Supabase may return joined rows as an object or a single-element array. */
const unwrapJoin = <T,>(val: T | T[] | null): T | null => {
  if (val == null) return null;
  if (Array.isArray(val)) return val[0] ?? null;
  return val;
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Reportes({ onBack }: Props) {
  // Date range filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Raw data
  const [tramites, setTramites] = useState<TramiteRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all tramites once
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tramites')
      .select(`
        id, titulo, organismo, estado, created_at, cliente_id,
        clientes(razon_social),
        gestiones(nombre)
      `)
      .order('created_at', { ascending: false });

    if (data) setTramites(data as unknown as TramiteRow[]);
    setLoading(false);
  };

  // ── Filtered data based on date range ──────────────────────────────────────

  const filteredTramites = useMemo(() => {
    let result = tramites;
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((t) => new Date(t.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((t) => new Date(t.created_at) <= to);
    }
    return result;
  }, [tramites, dateFrom, dateTo]);

  // ── Summary stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = new Date();
    const total = filteredTramites.length;
    const aprobados = filteredTramites.filter((t) => t.estado === 'aprobado').length;
    const observados = filteredTramites.filter((t) => t.estado === 'observado').length;
    const tiempos = filteredTramites
      .map((t) => daysBetween(new Date(t.created_at), now))
      .filter((d) => d > 0);
    const promedio = tiempos.length > 0 ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : 0;

    return {
      total,
      diasPromedioTramitacion: Math.round(promedio),
      tasaAprobacion: total > 0 ? Math.round((aprobados / total) * 100) : 0,
      observacionesFrecuentes: total > 0 ? Math.round((observados / total) * 100) : 0,
    };
  }, [filteredTramites]);

  // ── Breakdown by organismo ─────────────────────────────────────────────────

  const organismoBreakdown = useMemo<OrganismoBreakdown[]>(() => {
    const now = new Date();
    const map = new Map<string, { total: number; aprobados: number; days: number[] }>();

    filteredTramites.forEach((t) => {
      const org = t.organismo || 'Sin organismo';
      const entry = map.get(org) || { total: 0, aprobados: 0, days: [] };
      entry.total += 1;
      if (t.estado === 'aprobado') entry.aprobados += 1;
      entry.days.push(daysBetween(new Date(t.created_at), now));
      map.set(org, entry);
    });

    return Array.from(map.entries())
      .map(([organismo, data]) => ({
        organismo,
        total: data.total,
        aprobados: data.aprobados,
        approvalRate: data.total > 0 ? Math.round((data.aprobados / data.total) * 100) : 0,
        avgDays: data.days.length > 0
          ? Math.round(data.days.reduce((a, b) => a + b, 0) / data.days.length)
          : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTramites]);

  // ── Breakdown by cliente (top 10) ──────────────────────────────────────────

  const clienteBreakdown = useMemo<ClienteBreakdown[]>(() => {
    const map = new Map<string, number>();

    filteredTramites.forEach((t) => {
      const cli = unwrapJoin(t.clientes);
      const name = cli?.razon_social || 'Sin cliente';
      map.set(name, (map.get(name) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([razon_social, total]) => ({ razon_social, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredTramites]);

  // ── Chart data: tramites by estado ─────────────────────────────────────────

  const estadoChartData = useMemo<EstadoChartItem[]>(() => {
    const map = new Map<string, number>();
    filteredTramites.forEach((t) => {
      const label = ESTADO_LABELS[t.estado] || t.estado;
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTramites]);

  // ── Chart data: tramites by organismo (bar chart) ──────────────────────────

  const organismoChartData = useMemo(() => {
    return organismoBreakdown.slice(0, 12).map((o) => ({
      name: o.organismo.length > 20 ? o.organismo.substring(0, 18) + '...' : o.organismo,
      total: o.total,
    }));
  }, [organismoBreakdown]);

  // ── Export full report CSV ─────────────────────────────────────────────────

  const exportFullReportCSV = useCallback(() => {
    const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    let csv = 'Seccion,Dato_1,Dato_2,Dato_3,Dato_4\n';

    // Summary row
    csv += `${esc('Resumen')},Total Tramites: ${stats.total},Dias Promedio: ${stats.diasPromedioTramitacion},Tasa Aprobacion: ${stats.tasaAprobacion}%,Tasa Observaciones: ${stats.observacionesFrecuentes}%\n`;
    csv += '\n';

    // Organismo breakdown
    csv += 'Organismo,Total_Tramites,Aprobados,Tasa_Aprobacion(%),Dias_Promedio\n';
    organismoBreakdown.forEach((o) => {
      csv += `${esc(o.organismo)},${o.total},${o.aprobados},${o.approvalRate},${o.avgDays}\n`;
    });
    csv += '\n';

    // Cliente breakdown
    csv += 'Cliente,Total_Tramites\n';
    clienteBreakdown.forEach((c) => {
      csv += `${esc(c.razon_social)},${c.total}\n`;
    });
    csv += '\n';

    // Estado breakdown
    csv += 'Estado,Cantidad\n';
    estadoChartData.forEach((e) => {
      csv += `${esc(e.name)},${e.value}\n`;
    });
    csv += '\n';

    // Full tramites list
    csv += 'Titulo,Organismo,Estado,Cliente,Gestion,Fecha_Creacion\n';
    filteredTramites.forEach((t) => {
      const cli = unwrapJoin(t.clientes);
      const ges = unwrapJoin(t.gestiones);
      csv += [
        esc(t.titulo || ''),
        esc(t.organismo || 'N/A'),
        esc(ESTADO_LABELS[t.estado] || t.estado),
        esc(cli?.razon_social || 'N/A'),
        esc(ges?.nombre || 'Sin gestion'),
        new Date(t.created_at).toLocaleDateString('es-AR'),
      ].join(',') + '\n';
    });

    const rangeLabel = [dateFrom, dateTo].filter(Boolean).join('_a_') || 'completo';
    downloadCSV(csv, `Reporte_Completo_SGRT_${rangeLabel}_${new Date().toISOString().split('T')[0]}.csv`);
  }, [filteredTramites, organismoBreakdown, clienteBreakdown, estadoChartData, stats, dateFrom, dateTo]);

  // ── Custom tooltip for pie chart ───────────────────────────────────────────

  const PieTooltipContent = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
          <p className="font-medium text-slate-800">{payload[0].name}</p>
          <p className="text-slate-600">{payload[0].value} tramites</p>
        </div>
      );
    }
    return null;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver al Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Reportes y Analisis</h1>
            <p className="text-slate-600 mt-1">
              Genera y exporta informes clave sobre la operacion del sistema.
            </p>
          </div>
          <button
            onClick={exportFullReportCSV}
            disabled={loading || filteredTramites.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            <Download className="w-5 h-5" />
            Exportar Reporte Completo (CSV)
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Filtro por Periodo
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
              >
                Limpiar filtro
              </button>
            </div>
            <div className="text-sm text-slate-500">
              {filteredTramites.length} tramites en periodo
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3" />
            Cargando datos...
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Reporte de Productividad</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <TrendingUp className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <p className="text-4xl font-bold text-indigo-600">{stats.total}</p>
                  <p className="text-sm text-slate-600 mt-1">Total Tramites</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-4xl font-bold text-blue-600">{stats.diasPromedioTramitacion}</p>
                  <p className="text-sm text-slate-600 mt-1">Dias Promedio Tramitacion</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-4xl font-bold text-green-600">{stats.tasaAprobacion}%</p>
                  <p className="text-sm text-slate-600 mt-1">Tasa de Aprobacion</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <TrendingUp className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-4xl font-bold text-yellow-600">{stats.observacionesFrecuentes}%</p>
                  <p className="text-sm text-slate-600 mt-1">Tasa de Observaciones</p>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Bar Chart: Tramites by Organismo */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    Tramites por Organismo
                  </h3>
                </div>
                {organismoChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={organismoChartData} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Tramites" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-center py-12">Sin datos para mostrar</p>
                )}
              </div>

              {/* Pie Chart: Tramites by Estado */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    Tramites por Estado
                  </h3>
                </div>
                {estadoChartData.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={estadoChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={50}
                          dataKey="value"
                          nameKey="name"
                          paddingAngle={2}
                          label={false}
                          labelLine={false}
                        >
                          {estadoChartData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {estadoChartData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          />
                          {entry.name} ({entry.value})
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-12">Sin datos para mostrar</p>
                )}
              </div>
            </div>

            {/* Breakdown by Organismo Table */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Desglose por Organismo
                </h3>
              </div>
              {organismoBreakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Organismo</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Tramites</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Aprobados</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Tasa Aprobacion</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Dias Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organismoBreakdown.map((row) => (
                        <tr
                          key={row.organismo}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-800 font-medium">{row.organismo}</td>
                          <td className="py-3 px-4 text-right text-slate-700">{row.total}</td>
                          <td className="py-3 px-4 text-right text-slate-700">{row.aprobados}</td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                row.approvalRate >= 70
                                  ? 'bg-green-100 text-green-700'
                                  : row.approvalRate >= 40
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {row.approvalRate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-slate-700">{row.avgDays} dias</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">Sin datos para mostrar</p>
              )}
            </div>

            {/* Breakdown by Cliente (Top 10) */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-violet-600" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Top 10 Clientes por Tramites
                </h3>
              </div>
              {clienteBreakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">#</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Cliente</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">Total Tramites</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700 w-1/3">Proporcion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clienteBreakdown.map((row, idx) => {
                        const maxTotal = clienteBreakdown[0]?.total || 1;
                        const widthPercent = Math.round((row.total / maxTotal) * 100);
                        return (
                          <tr
                            key={row.razon_social}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-4 text-slate-500 font-medium">{idx + 1}</td>
                            <td className="py-3 px-4 text-slate-800 font-medium">{row.razon_social}</td>
                            <td className="py-3 px-4 text-right text-slate-700">{row.total}</td>
                            <td className="py-3 px-4">
                              <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div
                                  className="bg-violet-500 h-2.5 rounded-full transition-all"
                                  style={{ width: `${widthPercent}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">Sin datos para mostrar</p>
              )}
            </div>

            {/* Existing CSV export sections */}
            <div className="space-y-6">
              <ReporteTramites />
              <ReporteFinanciero />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: Reporte Tramites CSV ────────────────────────────────────────

function ReporteTramites() {
  const [loading, setLoading] = useState(false);
  const [filterCliente, setFilterCliente] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterOrganismo, setFilterOrganismo] = useState('todos');
  const [clientes, setClientes] = useState<{ id: string; razon_social: string }[]>([]);
  const [organismos, setOrganismos] = useState<string[]>([]);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    const [clientesRes, orgRes] = await Promise.all([
      supabase.from('clientes').select('id, razon_social').order('razon_social'),
      supabase.from('tramites').select('organismo').not('organismo', 'is', null),
    ]);

    if (clientesRes.data) setClientes(clientesRes.data);
    if (orgRes.data) {
      const unique = [...new Set(orgRes.data.map((t: { organismo: string | null }) => t.organismo).filter(Boolean))] as string[];
      setOrganismos(unique.sort());
    }
  };

  const generarReporte = async () => {
    setLoading(true);

    let query = supabase
      .from('tramites')
      .select(`
        id, titulo, organismo, estado, fecha_vencimiento, monto_presupuesto, created_at,
        clientes(razon_social),
        gestiones(nombre)
      `)
      .order('created_at', { ascending: false });

    if (filterEstado !== 'todos') {
      query = query.eq('estado', filterEstado);
    }
    if (filterCliente !== 'todos') {
      query = query.eq('cliente_id', filterCliente);
    }
    if (filterOrganismo !== 'todos') {
      query = query.eq('organismo', filterOrganismo);
    }

    const { data: tramites } = await query;

    if (tramites) {
      let csvContent = 'Gestion,Cliente,Titulo_Tramite,Organismo,Estado,Fecha_Vencimiento,Presupuesto\n';

      const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
      tramites.forEach((t: any) => {
        const row = [
          esc(t.gestiones?.nombre || 'Sin gestion'),
          esc(t.clientes?.razon_social || 'N/A'),
          esc(t.titulo || ''),
          esc(t.organismo || 'N/A'),
          esc(ESTADO_LABELS[t.estado] || t.estado),
          t.fecha_vencimiento ? new Date(t.fecha_vencimiento).toLocaleDateString('es-AR') : 'N/A',
          t.monto_presupuesto != null ? t.monto_presupuesto : 'N/A',
        ].join(',');
        csvContent += row + '\n';
      });

      downloadCSV(csvContent, `Reporte_Tramites_SGRT_${new Date().toISOString().split('T')[0]}.csv`);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Reporte General de Tramites
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Cliente</label>
          <select
            className="w-full p-2 border border-slate-300 rounded-md bg-white"
            value={filterCliente}
            onChange={(e) => setFilterCliente(e.target.value)}
          >
            <option value="todos">Todos</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razon_social}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Estado</label>
          <select
            className="w-full p-2 border border-slate-300 rounded-md bg-white"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            {Object.entries(ESTADO_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Organismo</label>
          <select
            className="w-full p-2 border border-slate-300 rounded-md bg-white"
            value={filterOrganismo}
            onChange={(e) => setFilterOrganismo(e.target.value)}
          >
            <option value="todos">Todos</option>
            {organismos.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={generarReporte}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-3 rounded-md disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <Download className="w-5 h-5" />
        {loading ? 'Generando...' : 'Descargar Reporte de Tramites (CSV)'}
      </button>
    </div>
  );
}

// ── Sub-component: Reporte Financiero CSV ──────────────────────────────────────

function ReporteFinanciero() {
  const [loading, setLoading] = useState(false);
  const [filterEstado, setFilterEstado] = useState('todos');

  const generarReporte = async () => {
    setLoading(true);

    let query = supabase
      .from('tramites')
      .select(`
        id, titulo, estado, monto_presupuesto, created_at,
        clientes(razon_social),
        gestiones(nombre)
      `)
      .not('monto_presupuesto', 'is', null)
      .order('created_at', { ascending: false });

    if (filterEstado !== 'todos') {
      query = query.eq('estado', filterEstado);
    }

    const { data: tramites } = await query;

    if (tramites) {
      let csvContent = 'Gestion,Cliente,Tramite,Estado,Monto_Presupuesto,Fecha_Creacion\n';

      const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
      tramites.forEach((t: any) => {
        const row = [
          esc(t.gestiones?.nombre || 'Sin gestion'),
          esc(t.clientes?.razon_social || 'N/A'),
          esc(t.titulo || ''),
          esc(ESTADO_LABELS[t.estado] || t.estado),
          t.monto_presupuesto != null ? t.monto_presupuesto : 0,
          new Date(t.created_at).toLocaleDateString('es-AR'),
        ].join(',');
        csvContent += row + '\n';
      });

      downloadCSV(csvContent, `Reporte_Financiero_SGRT_${new Date().toISOString().split('T')[0]}.csv`);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Reporte Financiero (Presupuestos de Tramites)
      </h3>
      <div className="mb-4">
        <label className="text-sm font-medium text-slate-700 block mb-2">
          Filtrar por Estado
        </label>
        <select
          className="w-full p-2 border border-slate-300 rounded-md bg-white"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="todos">Todos</option>
          {Object.entries(ESTADO_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>
      <button
        onClick={generarReporte}
        disabled={loading}
        className="w-full bg-green-600 text-white p-3 rounded-md disabled:opacity-50 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
      >
        <Download className="w-5 h-5" />
        {loading ? 'Generando...' : 'Descargar Reporte Financiero (CSV)'}
      </button>
    </div>
  );
}
