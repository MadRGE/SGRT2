/**
 * ModuloTramites — Shows tramites filtered by organismo for the current module.
 * Reads from Supabase (will migrate to local API later).
 */
import { useState, useEffect } from 'react';
import { FileText, Clock, AlertTriangle, CheckCircle, Loader2, Plus, ChevronRight, Search } from 'lucide-react';
import { supabase, filterActive } from '../../lib/supabase';
import {
  TRAMITE_ESTADO_COLORS, TRAMITE_ESTADO_LABELS_SHORT as TRAMITE_ESTADO_LABELS,
  SEMAFORO_COLORS,
} from '../../lib/constants/estados';

interface Props {
  organismo: string;       // 'INAL', 'SENASA', 'ANMAT'
  color: string;           // gradient classes
  onNavigate?: (page: any) => void;
}

interface TramiteRow {
  id: string;
  titulo: string;
  tipo: string | null;
  estado: string;
  semaforo: string | null;
  numero_expediente: string | null;
  created_at: string;
  gestiones: { nombre: string; clientes: { razon_social: string } | null } | null;
}

export default function ModuloTramites({ organismo, color, onNavigate }: Props) {
  const [tramites, setTramites] = useState<TramiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadTramites(); }, [organismo]);

  const loadTramites = async () => {
    setLoading(true);
    try {
      const { data } = await filterActive(
        supabase
          .from('tramites')
          .select('id, titulo, tipo, estado, semaforo, numero_expediente, created_at, gestiones(nombre, clientes(razon_social))')
          .eq('organismo', organismo)
      ).order('created_at', { ascending: false });
      setTramites(data || []);
    } catch {
      setTramites([]);
    }
    setLoading(false);
  };

  const filtered = tramites.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return t.titulo.toLowerCase().includes(s) ||
      t.numero_expediente?.toLowerCase().includes(s) ||
      (t.gestiones as any)?.nombre?.toLowerCase().includes(s) ||
      (t.gestiones as any)?.clientes?.razon_social?.toLowerCase().includes(s);
  });

  const stats = {
    total: tramites.length,
    enCurso: tramites.filter(t => t.estado === 'en_curso').length,
    rojos: tramites.filter(t => t.semaforo === 'rojo').length,
    aprobados: tramites.filter(t => t.estado === 'aprobado').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total" value={stats.total} color="bg-slate-100 text-slate-600" />
        <StatCard icon={Clock} label="En curso" value={stats.enCurso} color="bg-blue-100 text-blue-600" />
        <StatCard icon={AlertTriangle} label="Atención" value={stats.rojos} color="bg-red-100 text-red-600" />
        <StatCard icon={CheckCircle} label="Aprobados" value={stats.aprobados} color="bg-green-100 text-green-600" />
      </div>

      {/* Search + New */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar trámite, expediente, cliente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate({ type: 'nuevo-tramite' })}
            className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${color} text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all`}
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            {tramites.length === 0
              ? `No hay trámites de ${organismo} todavía`
              : 'No se encontraron resultados'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filtered.map((t, i) => {
            const estadoColor = TRAMITE_ESTADO_COLORS[t.estado] || 'bg-slate-100 text-slate-600';
            const estadoLabel = TRAMITE_ESTADO_LABELS[t.estado] || t.estado;
            const semaforoColor = t.semaforo ? SEMAFORO_COLORS[t.semaforo] || '' : '';
            const cliente = (t.gestiones as any)?.clientes?.razon_social;

            return (
              <button
                key={t.id}
                onClick={() => onNavigate?.({ type: 'tramite', id: t.id })}
                className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors ${
                  i > 0 ? 'border-t border-slate-100' : ''
                }`}
              >
                {/* Semaforo dot */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${semaforoColor || 'bg-slate-200'}`} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{t.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {cliente && <span className="text-xs text-slate-400 truncate">{cliente}</span>}
                    {t.numero_expediente && (
                      <span className="text-xs text-slate-400 font-mono">#{t.numero_expediente}</span>
                    )}
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${estadoColor}`}>
                  {estadoLabel}
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

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof FileText;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
