import { useState, useEffect } from 'react';
import { Loader2, BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { DespachoService } from '../../services/DespachoService';

const COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1'];

export default function DespachanteReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<{ month: string; importacion: number; exportacion: number }[]>([]);
  const [revenueData, setRevenueData] = useState<{ cliente: string; total: number }[]>([]);
  const [avgDays, setAvgDays] = useState(0);

  useEffect(() => {
    if (user?.id) loadReports();
  }, [user?.id]);

  const loadReports = async () => {
    setLoading(true);
    const [monthly, revenue, avg] = await Promise.all([
      DespachoService.getReportDespachosPorMes(user!.id, 12),
      DespachoService.getRevenueByCliente(user!.id),
      DespachoService.getAvgProcessingTime(user!.id),
    ]);
    setMonthlyData(monthly);
    setRevenueData(revenue);
    setAvgDays(avg);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const totalDespachos = monthlyData.reduce((s, m) => s + m.importacion + m.exportacion, 0);
  const totalRevenue = revenueData.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-amber-600" />
          Reportes
        </h1>
        <p className="text-sm text-slate-500 mt-1">Análisis de operaciones (últimos 12 meses)</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{totalDespachos}</p>
            <p className="text-xs text-slate-500">Despachos (12 meses)</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{DespachoService.formatMonto(totalRevenue, 'USD')}</p>
            <p className="text-xs text-slate-500">Valor FOB Total</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{avgDays} días</p>
            <p className="text-xs text-slate-500">Tiempo Promedio Procesamiento</p>
          </div>
        </div>
      </div>

      {/* Despachos por mes (stacked bar) */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Despachos por Mes</h2>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="importacion" name="Importación" fill="#06b6d4" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="exportacion" name="Exportación" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-slate-400 text-center py-10">Sin datos aún</p>
        )}
      </div>

      {/* Revenue by client */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Valor FOB por Cliente</h2>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  dataKey="total"
                  nameKey="cliente"
                  paddingAngle={2}
                >
                  {revenueData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => DespachoService.formatMonto(value, 'USD')} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 text-center py-10">Sin datos aún</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Top Clientes (FOB)</h2>
          {revenueData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {revenueData.map((r, i) => (
                <div key={r.cliente} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{r.cliente}</p>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${totalRevenue > 0 ? (r.total / totalRevenue) * 100 : 0}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                    {DespachoService.formatMonto(r.total, 'USD')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
