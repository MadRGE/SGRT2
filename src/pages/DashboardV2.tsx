import { useState, useEffect } from 'react';
import { supabase, filterActive } from '../lib/supabase';
import {
  Briefcase, FileText, AlertTriangle, Calendar,
  ChevronRight, Loader2, TrendingUp, Clock
} from 'lucide-react';

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

const GESTION_ESTADO_COLORS: Record<string, string> = {
  relevamiento: 'bg-purple-100 text-purple-700',
  en_curso: 'bg-blue-100 text-blue-700',
  en_espera: 'bg-yellow-100 text-yellow-700',
  finalizado: 'bg-green-100 text-green-700',
  archivado: 'bg-slate-100 text-slate-500',
};

const GESTION_ESTADO_LABELS: Record<string, string> = {
  relevamiento: 'Relevamiento',
  en_curso: 'En Curso',
  en_espera: 'En Espera',
  finalizado: 'Finalizado',
  archivado: 'Archivado',
};

const TRAMITE_ESTADO_COLORS: Record<string, string> = {
  consulta: 'bg-slate-100 text-slate-600',
  presupuestado: 'bg-purple-100 text-purple-700',
  en_curso: 'bg-blue-100 text-blue-700',
  esperando_cliente: 'bg-yellow-100 text-yellow-700',
  esperando_organismo: 'bg-orange-100 text-orange-700',
  observado: 'bg-red-100 text-red-700',
  aprobado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700',
  vencido: 'bg-red-100 text-red-700',
};

const TRAMITE_ESTADO_LABELS: Record<string, string> = {
  consulta: 'Consulta',
  presupuestado: 'Presupuestado',
  en_curso: 'En Curso',
  esperando_cliente: 'Esp. Cliente',
  esperando_organismo: 'Esp. Organismo',
  observado: 'Observado',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  vencido: 'Vencido',
};

const SEMAFORO_COLORS: Record<string, string> = {
  verde: 'bg-green-500',
  amarillo: 'bg-yellow-400',
  rojo: 'bg-red-500',
};

const PRIORIDAD_COLORS: Record<string, string> = {
  urgente: 'bg-red-500',
  alta: 'bg-orange-400',
  normal: 'bg-blue-400',
  baja: 'bg-slate-300',
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
    } catch (e) {
      console.warn('Error cargando dashboard:', e);
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

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <div className="max-w-[1100px] mx-auto space-y-8 py-2">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Resumen de tu actividad</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
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

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
  bgLight,
  textColor,
  onClick,
}: {
  icon: any;
  label: string;
  value: number;
  gradient: string;
  bgLight: string;
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
      <p className={`text-3xl font-bold ${textColor} tracking-tight`}>{value}</p>
      <p className="text-[12px] text-slate-400 font-medium mt-0.5">{label}</p>
    </button>
  );
}
