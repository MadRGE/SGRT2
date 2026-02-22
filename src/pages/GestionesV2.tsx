import { useState, useEffect } from 'react';
import { supabase, filterActive } from '../lib/supabase';
import {
  GESTION_ESTADO_FILTER_OPTIONS, GESTION_ESTADO_COLORS, GESTION_ESTADO_LABELS,
} from '../lib/constants/estados';
import { Briefcase, Plus, Search, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import StatusBadge from '../components/UI/StatusBadge';

interface Props {
  onNavigate: (page: any) => void;
}

interface TramiteResumen {
  estado: string;
  semaforo: string | null;
}

interface Gestion {
  id: string;
  nombre: string;
  estado: string;
  prioridad: string;
  fecha_inicio: string | null;
  created_at: string;
  clientes: { razon_social: string } | null;
  tramites: TramiteResumen[];
}


function buildProgressSummary(tramites: TramiteResumen[]) {
  const total = tramites.length;
  if (total === 0) return null;

  const counts: Record<string, number> = {};
  for (const t of tramites) {
    counts[t.estado] = (counts[t.estado] || 0) + 1;
  }

  const segments: { label: string; count: number; color: string }[] = [];

  const aprobados = (counts['aprobado'] || 0) + (counts['finalizado'] || 0);
  if (aprobados > 0) segments.push({ label: 'Finalizados', count: aprobados, color: 'bg-green-400' });

  const enCurso = (counts['en_curso'] || 0) + (counts['presupuestado'] || 0);
  if (enCurso > 0) segments.push({ label: 'En curso', count: enCurso, color: 'bg-blue-400' });

  const esperando = (counts['esperando_cliente'] || 0) + (counts['esperando_organismo'] || 0) + (counts['en_espera'] || 0);
  if (esperando > 0) segments.push({ label: 'En espera', count: esperando, color: 'bg-yellow-400' });

  const problemas = (counts['observado'] || 0) + (counts['rechazado'] || 0);
  if (problemas > 0) segments.push({ label: 'Observados', count: problemas, color: 'bg-red-400' });

  const otros = total - aprobados - enCurso - esperando - problemas;
  if (otros > 0) segments.push({ label: 'Otros', count: otros, color: 'bg-slate-300' });

  // Compute attention items
  const needsAttention = (counts['esperando_cliente'] || 0) + (counts['observado'] || 0);

  return { total, segments, needsAttention, aprobados };
}

export default function GestionesV2({ onNavigate }: Props) {
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadGestiones(); }, []);

  const loadGestiones = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await filterActive(supabase
        .from('gestiones')
        .select('id, nombre, estado, prioridad, fecha_inicio, created_at, clientes(razon_social), tramites(estado, semaforo)'))
        .order('created_at', { ascending: false });

      setGestiones((data as any) || []);
    } catch (e) {
      console.warn('Error cargando gestiones:', e);
      setError('Error al cargar datos. Verifique su conexión.');
    }
    setLoading(false);
  };

  const filtered = gestiones.filter(g => {
    if (filtroEstado !== 'todos' && g.estado !== filtroEstado) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return g.nombre.toLowerCase().includes(s) ||
        (g.clientes as any)?.razon_social?.toLowerCase().includes(s);
    }
    return true;
  });

  // Summary counts
  const totalActive = gestiones.filter(g => !['finalizado', 'archivado'].includes(g.estado)).length;
  const totalAttention = gestiones.reduce((sum, g) => {
    const p = buildProgressSummary(g.tramites || []);
    return sum + (p?.needsAttention || 0);
  }, 0);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-slate-600 mb-4">{error}</p>
        <button onClick={loadGestiones} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] tracking-tight font-bold text-slate-800">Gestiones</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalActive} activas
            {totalAttention > 0 && <span className="text-yellow-600 ml-2">· {totalAttention} requieren atención</span>}
          </p>
        </div>
        <button
          onClick={() => onNavigate({ type: 'nueva-gestion' })}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva Gestión
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
        >
          {GESTION_ESTADO_FILTER_OPTIONS.map(e => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-12 text-center">
          <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">
            {search || filtroEstado !== 'todos' ? 'No se encontraron gestiones' : 'No hay gestiones cargadas'}
          </p>
          {!search && filtroEstado === 'todos' && (
            <button
              onClick={() => onNavigate({ type: 'nueva-gestion' })}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Crear primera gestión
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 divide-y divide-slate-100/80">
          {filtered.map((g) => {
            const progress = buildProgressSummary(g.tramites || []);
            const tramitesCount = g.tramites?.length || 0;
            const hasRedSemaforo = g.tramites?.some(t => t.semaforo === 'rojo');

            return (
              <button
                key={g.id}
                onClick={() => onNavigate({ type: 'gestion', id: g.id })}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
              >
                {/* Priority bar */}
                <div className={`w-1.5 h-14 rounded-full flex-shrink-0 ${
                  g.prioridad === 'urgente' ? 'bg-red-500' :
                  g.prioridad === 'alta' ? 'bg-orange-400' :
                  g.prioridad === 'normal' ? 'bg-blue-400' : 'bg-slate-300'
                }`} />

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 truncate">{g.nombre}</p>
                    {(progress?.needsAttention ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        <AlertTriangle className="w-3 h-3" /> {progress!.needsAttention}
                      </span>
                    )}
                    {hasRedSemaforo && (
                      <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" title="Tiene trámites con semáforo rojo" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {(g.clientes as any)?.razon_social && (
                      <span className="text-xs text-slate-500">{(g.clientes as any).razon_social}</span>
                    )}
                    {g.fecha_inicio && (
                      <span className="text-xs text-slate-400">
                        · {new Date(g.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {progress && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                        {progress.segments.map((seg, i) => (
                          <div
                            key={i}
                            className={`h-full ${seg.color}`}
                            style={{ width: `${(seg.count / progress.total) * 100}%` }}
                            title={`${seg.label}: ${seg.count}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {progress.aprobados}/{tramitesCount}
                      </span>
                    </div>
                  )}
                  {!progress && (
                    <div className="mt-2">
                      <span className="text-xs text-slate-400">Sin trámites</span>
                    </div>
                  )}
                </div>

                {/* Estado badge */}
                <StatusBadge
                  label={GESTION_ESTADO_LABELS[g.estado] || g.estado}
                  colorClass={GESTION_ESTADO_COLORS[g.estado]}
                />

                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
