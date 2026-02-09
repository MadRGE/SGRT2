import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Briefcase, Plus, Search, ChevronRight, Loader2 } from 'lucide-react';

interface Props {
  onNavigate: (page: any) => void;
}

interface TramiteResumen {
  estado: string;
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

const ESTADOS = [
  { value: 'todos', label: 'Todos' },
  { value: 'relevamiento', label: 'Relevamiento' },
  { value: 'en_curso', label: 'En Curso' },
  { value: 'en_espera', label: 'En Espera' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'archivado', label: 'Archivado' },
];

const ESTADO_COLORS: Record<string, string> = {
  relevamiento: 'bg-slate-100 text-slate-600',
  en_curso: 'bg-blue-100 text-blue-700',
  en_espera: 'bg-yellow-100 text-yellow-700',
  finalizado: 'bg-green-100 text-green-700',
  archivado: 'bg-slate-100 text-slate-500',
};

const ESTADO_LABELS: Record<string, string> = {
  relevamiento: 'Relevamiento',
  en_curso: 'En Curso',
  en_espera: 'En Espera',
  finalizado: 'Finalizado',
  archivado: 'Archivado',
};

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

  return { total, segments };
}

export default function GestionesV2({ onNavigate }: Props) {
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadGestiones(); }, []);

  const loadGestiones = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('gestiones')
        .select('id, nombre, estado, prioridad, fecha_inicio, created_at, clientes(razon_social), tramites(estado)')
        .order('created_at', { ascending: false });

      setGestiones((data as any) || []);
    } catch (e) {
      console.warn('Error cargando gestiones:', e);
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] tracking-tight font-bold text-slate-800">Gestiones</h1>
          <p className="text-sm text-slate-400 mt-0.5">Proyectos y procesos regulatorios</p>
        </div>
        <button
          onClick={() => onNavigate({ type: 'nueva-gestion' })}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva Gestion
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
          {ESTADOS.map(e => (
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
              Crear primera gestion
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 divide-y divide-slate-100/80">
          {filtered.map((g) => {
            const progress = buildProgressSummary(g.tramites || []);
            const tramitesCount = g.tramites?.length || 0;

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
                  <p className="font-medium text-slate-800 truncate">{g.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {(g.clientes as any)?.razon_social && (
                      <span className="text-xs text-slate-500">{(g.clientes as any).razon_social}</span>
                    )}
                    {g.fecha_inicio && (
                      <span className="text-xs text-slate-400">
                        Inicio: {new Date(g.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                        {tramitesCount} {tramitesCount === 1 ? 'tramite' : 'tramites'}
                      </span>
                    </div>
                  )}
                  {!progress && (
                    <div className="mt-2">
                      <span className="text-xs text-slate-400">Sin tramites</span>
                    </div>
                  )}
                </div>

                {/* Estado badge */}
                <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${ESTADO_COLORS[g.estado] || 'bg-slate-100 text-slate-600'}`}>
                  {ESTADO_LABELS[g.estado] || g.estado}
                </span>

                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
