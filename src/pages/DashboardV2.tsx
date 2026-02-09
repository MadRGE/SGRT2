import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  FileText, Users, Clock, CheckCircle,
  Plus, ChevronRight, Loader2, Calendar, TrendingUp, AlertTriangle
} from 'lucide-react';

interface Props {
  onNavigate: (page: any) => void;
}

interface TramiteResumen {
  id: string;
  titulo: string;
  estado: string;
  organismo: string;
  prioridad: string;
  fecha_vencimiento: string | null;
  clientes: { razon_social: string } | null;
}

interface Vencimiento {
  id: string;
  descripcion: string;
  fecha_vencimiento: string;
  tipo: string;
  clientes: { razon_social: string } | null;
}

const ESTADO_CONFIG: Record<string, { label: string; dot: string }> = {
  consulta: { label: 'Consulta', dot: 'bg-slate-400' },
  presupuestado: { label: 'Presupuestado', dot: 'bg-violet-500' },
  en_curso: { label: 'En Curso', dot: 'bg-blue-500' },
  esperando_cliente: { label: 'Esp. Cliente', dot: 'bg-amber-500' },
  esperando_organismo: { label: 'Esp. Organismo', dot: 'bg-orange-500' },
  observado: { label: 'Observado', dot: 'bg-red-500' },
  aprobado: { label: 'Aprobado', dot: 'bg-emerald-500' },
  rechazado: { label: 'Rechazado', dot: 'bg-red-500' },
  vencido: { label: 'Vencido', dot: 'bg-red-500' },
};

export default function DashboardV2({ onNavigate }: Props) {
  const [tramitesActivos, setTramitesActivos] = useState<TramiteResumen[]>([]);
  const [vencimientosProximos, setVencimientosProximos] = useState<Vencimiento[]>([]);
  const [stats, setStats] = useState({ activos: 0, esperando: 0, clientes: 0, vencimientos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data: tramites } = await supabase
        .from('tramites')
        .select('id, titulo, estado, organismo, prioridad, fecha_vencimiento, clientes(razon_social)')
        .not('estado', 'in', '("aprobado","rechazado","vencido")')
        .order('created_at', { ascending: false })
        .limit(8);
      setTramitesActivos((tramites as any) || []);

      const hoy = new Date().toISOString().split('T')[0];
      const en30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: vencimientos } = await supabase
        .from('vencimientos')
        .select('id, descripcion, fecha_vencimiento, tipo, clientes(razon_social)')
        .gte('fecha_vencimiento', hoy).lte('fecha_vencimiento', en30dias)
        .order('fecha_vencimiento', { ascending: true });
      setVencimientosProximos((vencimientos as any) || []);

      const { count: activos } = await supabase.from('tramites').select('*', { count: 'exact', head: true }).not('estado', 'in', '("aprobado","rechazado","vencido")');
      const { count: esperando } = await supabase.from('tramites').select('*', { count: 'exact', head: true }).in('estado', ['esperando_cliente', 'esperando_organismo', 'observado']);
      const { count: clientesCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
      const { count: vencimientosCount } = await supabase.from('vencimientos').select('*', { count: 'exact', head: true }).gte('fecha_vencimiento', hoy).lte('fecha_vencimiento', en30dias);

      setStats({ activos: activos || 0, esperando: esperando || 0, clientes: clientesCount || 0, vencimientos: vencimientosCount || 0 });
    } catch (e) { console.warn('Error cargando dashboard:', e); }
    setLoading(false);
  };

  const diasRestantes = (fecha: string) => {
    const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: 'Vencido', urgent: true };
    if (diff === 0) return { text: 'Hoy', urgent: true };
    if (diff === 1) return { text: 'Mañana', urgent: true };
    if (diff <= 7) return { text: `${diff}d`, urgent: true };
    return { text: `${diff}d`, urgent: false };
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-[1100px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">Resumen de tu actividad</p>
        </div>
        <button
          onClick={() => onNavigate({ type: 'nuevo-tramite' })}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Nuevo Trámite
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard icon={TrendingUp} label="Trámites Activos" value={stats.activos}
          color="blue" onClick={() => onNavigate({ type: 'tramites' })} />
        <KpiCard icon={Clock} label="En Espera" value={stats.esperando}
          color="amber" onClick={() => onNavigate({ type: 'tramites' })} />
        <KpiCard icon={Users} label="Clientes" value={stats.clientes}
          color="emerald" onClick={() => onNavigate({ type: 'clientes' })} />
        <KpiCard icon={AlertTriangle} label="Vencimientos 30d" value={stats.vencimientos}
          color={stats.vencimientos > 0 ? 'red' : 'slate'} onClick={() => onNavigate({ type: 'vencimientos' })} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Tramites activos */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-[15px]">Trámites en Curso</h2>
            <button onClick={() => onNavigate({ type: 'tramites' })} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
              Ver todos
            </button>
          </div>

          {tramitesActivos.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">No hay trámites activos</p>
              <button onClick={() => onNavigate({ type: 'nuevo-tramite' })} className="mt-2 text-xs text-blue-600 font-semibold hover:text-blue-700">
                Crear primer trámite
              </button>
            </div>
          ) : (
            <div>
              {tramitesActivos.map((t, i) => {
                const cfg = ESTADO_CONFIG[t.estado] || ESTADO_CONFIG.consulta;
                return (
                  <button
                    key={t.id}
                    onClick={() => onNavigate({ type: 'tramite', id: t.id })}
                    className={`w-full flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/80 transition-colors text-left ${i > 0 ? 'border-t border-slate-100/80' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{t.titulo}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {(t.clientes as any)?.razon_social}
                        {t.organismo && <span className="ml-2 text-slate-300">·</span>}
                        {t.organismo && <span className="ml-2">{t.organismo}</span>}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg whitespace-nowrap">
                      {cfg.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-200 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Vencimientos */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-[15px]">Vencimientos</h2>
          </div>

          {vencimientosProximos.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-300" />
              </div>
              <p className="text-sm text-slate-400">Todo al día</p>
            </div>
          ) : (
            <div>
              {vencimientosProximos.map((v, i) => {
                const d = diasRestantes(v.fecha_vencimiento);
                return (
                  <div key={v.id} className={`px-6 py-3.5 ${i > 0 ? 'border-t border-slate-100/80' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">{v.descripcion}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{(v.clientes as any)?.razon_social}</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${
                        d.urgent ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {d.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, onClick }: {
  icon: any; label: string; value: number; color: string; onClick: () => void;
}) {
  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-600' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', text: 'text-amber-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-600' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', text: 'text-red-600' },
    slate: { bg: 'bg-slate-50', icon: 'text-slate-400', text: 'text-slate-600' },
  };
  const c = colorMap[color] || colorMap.slate;

  return (
    <button onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-md hover:shadow-slate-200/50 transition-all duration-200 text-left group shadow-sm shadow-slate-200/50">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
      </div>
      <p className={`text-3xl font-bold ${c.text} tracking-tight`}>{value}</p>
      <p className="text-[12px] text-slate-400 font-medium mt-0.5">{label}</p>
    </button>
  );
}
