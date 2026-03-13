/**
 * DashboardV2 — Clean, action-oriented dashboard.
 *
 * Layout: Greeting → Quick actions → Module grid → Activity feed + Alerts sidebar
 * No charts cluttering the view. Everything is clickable and leads somewhere useful.
 */
import { useState, useEffect } from 'react';
import {
  Briefcase, FileText, AlertTriangle, Calendar, Users,
  ChevronRight, Loader2, Clock, Plus, Shield, Leaf,
  FlaskConical, Bell, Sparkles, ArrowRight, Package,
  type LucideIcon,
} from 'lucide-react';
import api from '../lib/api';
import type { Page } from '../components/Layout/Layout';

interface Props {
  onNavigate: (page: Page) => void;
}

// ─── Module cards config ───

interface ModuleCardDef {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  gradient: string;
  page: Page;
}

const MODULE_CARDS: ModuleCardDef[] = [
  { id: 'anmat', label: 'ANMAT', desc: 'Dispositivos, cosméticos, medicamentos', icon: Shield, gradient: 'from-indigo-500 to-violet-600', page: { type: 'anmat' } },
  { id: 'inal', label: 'INAL', desc: 'Envases, alimentos, RNE/RNPA', icon: FlaskConical, gradient: 'from-emerald-500 to-teal-600', page: { type: 'inal' } },
  { id: 'senasa', label: 'SENASA', desc: 'Fitosanitarios, veterinarios', icon: Leaf, gradient: 'from-orange-500 to-amber-600', page: { type: 'senasa' } },
  { id: 'gestiones', label: 'Gestiones', desc: 'Proyectos y casos activos', icon: Briefcase, gradient: 'from-blue-500 to-blue-600', page: { type: 'gestiones' } },
  { id: 'clientes', label: 'Clientes', desc: 'Directorio y módulos', icon: Users, gradient: 'from-purple-500 to-purple-600', page: { type: 'clientes' } },
  { id: 'vigia', label: 'Vigía Regulatorio', desc: 'Alertas de cambios normativos', icon: Bell, gradient: 'from-amber-500 to-red-500', page: { type: 'vigia-regulatorio' } },
];

// ─── Quick actions ───

const QUICK_ACTIONS = [
  { label: 'Nuevo Trámite', icon: FileText, gradient: 'from-violet-500 to-purple-600', page: { type: 'nuevo-tramite' } as Page },
  { label: 'Nueva Gestión', icon: Briefcase, gradient: 'from-blue-500 to-indigo-600', page: { type: 'nueva-gestion' } as Page },
  { label: 'Nuevo Cliente', icon: Users, gradient: 'from-emerald-500 to-green-600', page: { type: 'nuevo-cliente' } as Page },
];

// ─── Component ───

interface DashboardStats {
  gestiones_activas: number;
  tramites_en_curso: number;
  clientes_total: number;
  tramites_atencion: number;
}

interface ActivityItem {
  id: string;
  tipo: string;
  titulo: string;
  subtitulo: string;
  estado: string;
  organismo?: string;
  fecha: string;
}

export default function DashboardV2({ onNavigate }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Try local API first
      const [statsRes, tramitesRes, gestionesRes] = await Promise.allSettled([
        api.auth.me().then(() =>
          fetch('http://localhost:8500/api/v2/dashboard/stats', {
            headers: { Authorization: `Bearer ${localStorage.getItem('sgrt_token')}` },
          }).then(r => r.json())
        ),
        fetch('http://localhost:8500/api/v2/dashboard/tramites-atencion', {
          headers: { Authorization: `Bearer ${localStorage.getItem('sgrt_token')}` },
        }).then(r => r.json()),
        fetch('http://localhost:8500/api/v2/dashboard/gestiones-recientes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('sgrt_token')}` },
        }).then(r => r.json()),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }

      // Build activity feed from tramites + gestiones
      const items: ActivityItem[] = [];

      if (tramitesRes.status === 'fulfilled' && Array.isArray(tramitesRes.value)) {
        for (const t of tramitesRes.value.slice(0, 5)) {
          items.push({
            id: t.id,
            tipo: 'tramite',
            titulo: t.titulo,
            subtitulo: t.cliente_nombre || t.organismo || '',
            estado: t.estado,
            organismo: t.organismo,
            fecha: t.created_at,
          });
        }
      }

      if (gestionesRes.status === 'fulfilled' && Array.isArray(gestionesRes.value)) {
        for (const g of gestionesRes.value.slice(0, 5)) {
          items.push({
            id: g.id,
            tipo: 'gestion',
            titulo: g.nombre,
            subtitulo: g.cliente_nombre || '',
            estado: g.estado,
            fecha: g.created_at,
          });
        }
      }

      // Sort by date desc
      items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setActivity(items.slice(0, 8));
    } catch {
      // Fallback to zeros
      setStats({ gestiones_activas: 0, tramites_en_curso: 0, clientes_total: 0, tramites_atencion: 0 });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="max-w-[1100px] mx-auto space-y-8 py-2">
      {/* ── Header + Quick Actions ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{greeting}</h1>
          <p className="text-sm text-slate-400 mt-0.5">Sistema de Gestión Regulatoria de Trámites</p>
        </div>
        <div className="flex items-center gap-2">
          {QUICK_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => onNavigate(action.page)}
                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-300 hover:shadow-sm transition-all group"
              >
                <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${action.gradient} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="hidden sm:inline">{action.label}</span>
                <Plus className="w-3 h-3 text-slate-400 sm:hidden" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── KPI Strip ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiPill label="Gestiones" value={stats.gestiones_activas} icon={Briefcase} color="text-blue-600" bg="bg-blue-50" onClick={() => onNavigate({ type: 'gestiones' })} />
          <KpiPill label="Trámites" value={stats.tramites_en_curso} icon={FileText} color="text-indigo-600" bg="bg-indigo-50" onClick={() => onNavigate({ type: 'tramites' })} />
          <KpiPill label="Atención" value={stats.tramites_atencion} icon={AlertTriangle} color="text-red-600" bg="bg-red-50" onClick={() => onNavigate({ type: 'tramites' })} />
          <KpiPill label="Clientes" value={stats.clientes_total} icon={Users} color="text-purple-600" bg="bg-purple-50" onClick={() => onNavigate({ type: 'clientes' })} />
        </div>
      )}

      {/* ── Module Grid ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Módulos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MODULE_CARDS.map(mod => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => onNavigate(mod.page)}
                className="group relative bg-white rounded-2xl border border-slate-200/60 p-5 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                {/* Gradient accent line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mod.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-sm mb-3`}>
                  <Icon className="w-5.5 h-5.5 text-white" />
                </div>
                <p className="text-[15px] font-bold text-slate-800">{mod.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{mod.desc}</p>

                <ArrowRight className="absolute bottom-5 right-5 w-4 h-4 text-slate-200 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Activity Feed + Right Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Actividad reciente
              </h2>
            </div>

            {activity.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Sin actividad reciente</p>
                <p className="text-xs text-slate-300 mt-1">Creá un trámite o gestión para empezar</p>
              </div>
            ) : (
              <div>
                {activity.map((item, i) => (
                  <button
                    key={`${item.tipo}-${item.id}`}
                    onClick={() => onNavigate(
                      item.tipo === 'tramite'
                        ? { type: 'tramite', id: item.id }
                        : { type: 'gestion', id: item.id }
                    )}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/80 transition-colors text-left ${
                      i > 0 ? 'border-t border-slate-50' : ''
                    }`}
                  >
                    {/* Type indicator */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.tipo === 'tramite' ? 'bg-violet-50 text-violet-500' : 'bg-blue-50 text-blue-500'
                    }`}>
                      {item.tipo === 'tramite' ? <FileText className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{item.titulo}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {item.subtitulo}
                        {item.organismo && item.subtitulo && <span className="mx-1">·</span>}
                        {item.organismo && <span>{item.organismo}</span>}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        item.estado === 'en_curso' ? 'bg-blue-50 text-blue-600' :
                        item.estado === 'observado' ? 'bg-amber-50 text-amber-600' :
                        item.estado === 'aprobado' ? 'bg-green-50 text-green-600' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {item.estado.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-300">
                        {timeAgo(item.fecha)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Vencimientos + Alertas */}
        <div className="lg:col-span-2 space-y-4">
          {/* Vencimientos */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                Vencimientos
              </h3>
              <button onClick={() => onNavigate({ type: 'vencimientos' })} className="text-xs text-blue-600 font-medium">
                Ver todos
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-slate-400 text-center py-4">
                Los vencimientos aparecen acá cuando hay trámites con fechas próximas
              </p>
            </div>
          </div>

          {/* Regulatory alerts */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-100">
              <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Vigía Regulatorio
              </h3>
              <button onClick={() => onNavigate({ type: 'vigia-regulatorio' })} className="text-xs text-amber-700 font-medium">
                Gestionar
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-amber-700 leading-relaxed">
                Creá alertas de cambios normativos y el sistema notifica automáticamente a los clientes afectados según sus módulos.
              </p>
              <button
                onClick={() => onNavigate({ type: 'vigia-regulatorio' })}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-800 hover:text-amber-900"
              >
                Ir al Vigía <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function KpiPill({ label, value, icon: Icon, color, bg, onClick }: {
  label: string; value: number; icon: LucideIcon; color: string; bg: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 bg-white rounded-xl border border-slate-200/60 px-4 py-3 hover:shadow-sm transition-all group"
    >
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
        <Icon className={`w-4.5 h-4.5 ${color}`} />
      </div>
      <div className="text-left">
        <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-[11px] text-slate-400 font-medium">{label}</p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-slate-200 ml-auto group-hover:text-slate-400 transition-colors" />
    </button>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}
