import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  FileText, Users, AlertTriangle, Clock, CheckCircle,
  Plus, ChevronRight, Loader2, Calendar, ArrowUpRight
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

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  consulta: { label: 'Consulta', color: 'text-slate-600', bg: 'bg-slate-100' },
  presupuestado: { label: 'Presupuestado', color: 'text-purple-700', bg: 'bg-purple-100' },
  en_curso: { label: 'En Curso', color: 'text-blue-700', bg: 'bg-blue-100' },
  esperando_cliente: { label: 'Esperando Cliente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  esperando_organismo: { label: 'Esperando Organismo', color: 'text-orange-700', bg: 'bg-orange-100' },
  observado: { label: 'Observado', color: 'text-red-700', bg: 'bg-red-100' },
  aprobado: { label: 'Aprobado', color: 'text-green-700', bg: 'bg-green-100' },
  rechazado: { label: 'Rechazado', color: 'text-red-700', bg: 'bg-red-100' },
  vencido: { label: 'Vencido', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function DashboardV2({ onNavigate }: Props) {
  const [tramitesActivos, setTramitesActivos] = useState<TramiteResumen[]>([]);
  const [vencimientosProximos, setVencimientosProximos] = useState<Vencimiento[]>([]);
  const [stats, setStats] = useState({ activos: 0, esperando: 0, clientes: 0, vencimientos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Tramites activos (no aprobados, no rechazados)
      const { data: tramites } = await supabase
        .from('tramites')
        .select('id, titulo, estado, organismo, prioridad, fecha_vencimiento, clientes(razon_social)')
        .not('estado', 'in', '("aprobado","rechazado","vencido")')
        .order('prioridad', { ascending: true })
        .order('fecha_vencimiento', { ascending: true, nullsFirst: false })
        .limit(10);

      setTramitesActivos((tramites as any) || []);

      // Vencimientos próximos (30 días)
      const hoy = new Date().toISOString().split('T')[0];
      const en30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: vencimientos } = await supabase
        .from('vencimientos')
        .select('id, descripcion, fecha_vencimiento, tipo, clientes(razon_social)')
        .gte('fecha_vencimiento', hoy)
        .lte('fecha_vencimiento', en30dias)
        .order('fecha_vencimiento', { ascending: true });

      setVencimientosProximos((vencimientos as any) || []);

      // Stats
      const { count: activos } = await supabase
        .from('tramites')
        .select('*', { count: 'exact', head: true })
        .not('estado', 'in', '("aprobado","rechazado","vencido")');

      const { count: esperando } = await supabase
        .from('tramites')
        .select('*', { count: 'exact', head: true })
        .in('estado', ['esperando_cliente', 'esperando_organismo', 'observado']);

      const { count: clientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      const { count: vencimientosCount } = await supabase
        .from('vencimientos')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_vencimiento', hoy)
        .lte('fecha_vencimiento', en30dias);

      setStats({
        activos: activos || 0,
        esperando: esperando || 0,
        clientes: clientesCount || 0,
        vencimientos: vencimientosCount || 0,
      });
    } catch (e) {
      console.warn('Error cargando dashboard:', e);
    }

    setLoading(false);
  };

  const diasRestantes = (fecha: string) => {
    const diff = Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Vencido';
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    return `${diff} días`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <button
          onClick={() => onNavigate({ type: 'nuevo-tramite' })}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo Trámite
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => onNavigate({ type: 'tramites' })} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Trámites Activos</p>
              <p className="text-2xl font-bold text-slate-800">{stats.activos}</p>
            </div>
          </div>
        </button>

        <button onClick={() => onNavigate({ type: 'tramites' })} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">En Espera</p>
              <p className="text-2xl font-bold text-slate-800">{stats.esperando}</p>
            </div>
          </div>
        </button>

        <button onClick={() => onNavigate({ type: 'clientes' })} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Clientes</p>
              <p className="text-2xl font-bold text-slate-800">{stats.clientes}</p>
            </div>
          </div>
        </button>

        <button onClick={() => onNavigate({ type: 'vencimientos' })} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow text-left">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${stats.vencimientos > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
              <Calendar className={`w-5 h-5 ${stats.vencimientos > 0 ? 'text-red-600' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Vencimientos 30d</p>
              <p className={`text-2xl font-bold ${stats.vencimientos > 0 ? 'text-red-600' : 'text-slate-800'}`}>{stats.vencimientos}</p>
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tramites activos */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Trámites en Curso</h2>
            <button
              onClick={() => onNavigate({ type: 'tramites' })}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {tramitesActivos.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No hay trámites activos</p>
              <button
                onClick={() => onNavigate({ type: 'nuevo-tramite' })}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Crear primer trámite
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tramitesActivos.map((t) => {
                const cfg = ESTADO_CONFIG[t.estado] || ESTADO_CONFIG.consulta;
                return (
                  <button
                    key={t.id}
                    onClick={() => onNavigate({ type: 'tramite', id: t.id })}
                    className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{t.titulo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{(t.clientes as any)?.razon_social}</span>
                        {t.organismo && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t.organismo}</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {t.fecha_vencimiento && (
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {diasRestantes(t.fecha_vencimiento)}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Vencimientos */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Vencimientos</h2>
          </div>

          {vencimientosProximos.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin vencimientos próximos</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {vencimientosProximos.map((v) => {
                const dias = diasRestantes(v.fecha_vencimiento);
                const urgente = dias === 'Hoy' || dias === 'Mañana' || dias === 'Vencido';
                return (
                  <div key={v.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{v.descripcion}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{(v.clientes as any)?.razon_social}</p>
                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap px-2 py-1 rounded-full ${
                        urgente ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {dias}
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
