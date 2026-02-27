import { useState, useEffect } from 'react';
import { Loader2, Ship, Clock, CheckCircle2, DollarSign, Plus, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { DespachoService, type DashboardStats } from '../../services/DespachoService';
import { supabase, filterActive } from '../../lib/supabase';
import {
  DESPACHO_ESTADO_LABELS,
  DESPACHO_CHART_COLORS,
  DESPACHO_ESTADO_COLORS,
} from '../../lib/constants/despacho';

interface Props {
  onNavigate: (view: any) => void;
  onNewDespacho: () => void;
}

export default function DespachanteDashboard({ onNavigate, onNewDespacho }: Props) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ activos: 0, pendientesCanal: 0, liberadosMes: 0, montoUsd: 0 });
  const [chartData, setChartData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [recentDespachos, setRecentDespachos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpis, despachos] = await Promise.all([
        DespachoService.getDashboardStats(user!.id),
        filterActive(
          supabase
            .from('despachos')
            .select('id, numero_despacho, tipo, estado, descripcion, valor_fob, created_at, clientes(razon_social)')
            .eq('despachante_id', user!.id)
        ).order('created_at', { ascending: false }).limit(5),
      ]);

      setStats(kpis);
      setRecentDespachos(despachos.data || []);

      // Chart: distribution by estado
      const allDespachos = await filterActive(
        supabase
          .from('despachos')
          .select('estado')
          .eq('despachante_id', user!.id)
      );

      const counts: Record<string, number> = {};
      (allDespachos.data || []).forEach((d: { estado: string }) => {
        counts[d.estado] = (counts[d.estado] || 0) + 1;
      });

      setChartData(
        Object.entries(counts).map(([estado, value]) => ({
          name: DESPACHO_ESTADO_LABELS[estado] || estado,
          value,
          color: DESPACHO_CHART_COLORS[estado] || '#94a3b8',
        }))
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const kpiCards = [
    { label: 'Despachos Activos', value: stats.activos, icon: Ship, color: 'from-blue-500 to-indigo-600', iconColor: 'text-blue-100' },
    { label: 'Pendientes Canal', value: stats.pendientesCanal, icon: Clock, color: 'from-amber-500 to-orange-600', iconColor: 'text-amber-100' },
    { label: 'Liberados (Mes)', value: stats.liberadosMes, icon: CheckCircle2, color: 'from-emerald-500 to-green-600', iconColor: 'text-emerald-100' },
    { label: 'Monto USD Activo', value: DespachoService.formatMonto(stats.montoUsd, 'USD'), icon: DollarSign, color: 'from-violet-500 to-purple-600', iconColor: 'text-violet-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Resumen de operaciones aduaneras</p>
        </div>
        <button
          onClick={onNewDespacho}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Despacho
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`bg-gradient-to-br ${kpi.color} rounded-2xl p-5 text-white shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-medium">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <Icon className={`w-10 h-10 ${kpi.iconColor} opacity-80`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Distribución por Estado</h2>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              Sin datos aún
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {chartData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Recent despachos */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Últimos Despachos</h2>
            <button
              onClick={() => onNavigate({ type: 'despachos' })}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recentDespachos.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Ship className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay despachos aún</p>
              <button onClick={onNewDespacho} className="text-sm text-amber-600 font-medium mt-2 hover:underline">
                Crear el primero
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDespachos.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onNavigate({ type: 'despacho', id: d.id })}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-slate-800">{d.numero_despacho}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${DESPACHO_ESTADO_COLORS[d.estado] || 'bg-slate-100 text-slate-600'}`}>
                        {DESPACHO_ESTADO_LABELS[d.estado] || d.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {d.clientes?.razon_social} {d.descripcion ? `· ${d.descripcion}` : ''}
                    </p>
                  </div>
                  {d.valor_fob && (
                    <span className="text-sm font-medium text-slate-700">
                      {DespachoService.formatMonto(d.valor_fob, 'USD')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onNewDespacho}
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-slate-800 group-hover:text-amber-700 transition-colors">Nuevo Despacho</p>
            <p className="text-xs text-slate-500">Iniciar trámite de importación o exportación</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate({ type: 'despachos' })}
          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-medium text-slate-800 group-hover:text-blue-700 transition-colors">Ver Pendientes</p>
            <p className="text-xs text-slate-500">Despachos en curso que requieren atención</p>
          </div>
        </button>
      </div>
    </div>
  );
}
