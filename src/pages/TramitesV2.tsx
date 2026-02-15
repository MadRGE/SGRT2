import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, FileText, ChevronRight, Loader2 } from 'lucide-react';

interface Props {
  onNavigate: (page: any) => void;
}

interface Tramite {
  id: string;
  titulo: string;
  estado: string;
  tipo: string;
  organismo: string | null;
  prioridad: string;
  fecha_vencimiento: string | null;
  created_at: string;
  gestiones: { nombre: string; clientes: { razon_social: string } | null } | null;
}

const ESTADOS = [
  { value: 'todos', label: 'Todos' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'presupuestado', label: 'Presupuestado' },
  { value: 'en_curso', label: 'En Curso' },
  { value: 'esperando_cliente', label: 'Esp. Cliente' },
  { value: 'esperando_organismo', label: 'Esp. Organismo' },
  { value: 'observado', label: 'Observado' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
];

const ESTADO_COLORS: Record<string, string> = {
  consulta: 'bg-slate-100 text-slate-600', presupuestado: 'bg-purple-100 text-purple-700',
  en_curso: 'bg-blue-100 text-blue-700', esperando_cliente: 'bg-yellow-100 text-yellow-700',
  esperando_organismo: 'bg-orange-100 text-orange-700', observado: 'bg-red-100 text-red-700',
  aprobado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700', vencido: 'bg-red-100 text-red-700',
};

const ESTADO_LABELS: Record<string, string> = {
  consulta: 'Consulta', presupuestado: 'Presupuestado', en_curso: 'En Curso',
  esperando_cliente: 'Esp. Cliente', esperando_organismo: 'Esp. Organismo',
  observado: 'Observado', aprobado: 'Aprobado', rechazado: 'Rechazado', vencido: 'Vencido',
};

export default function TramitesV2({ onNavigate }: Props) {
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTramites(); }, []);

  const loadTramites = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tramites')
        .select('id, titulo, estado, tipo, organismo, prioridad, fecha_vencimiento, created_at, gestiones(nombre, clientes(razon_social))')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      setTramites((data as any) || []);
    } catch (e) {
      console.warn('Error:', e);
    }
    setLoading(false);
  };

  const filtered = tramites.filter(t => {
    if (filtroEstado !== 'todos' && t.estado !== filtroEstado) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return t.titulo.toLowerCase().includes(s) ||
        (t.gestiones as any)?.nombre?.toLowerCase().includes(s) ||
        (t.gestiones as any)?.clientes?.razon_social?.toLowerCase().includes(s) ||
        t.organismo?.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] tracking-tight font-bold text-slate-800">Trámites</h1>
          <p className="text-sm text-slate-400 mt-0.5">Procesos regulatorios dentro de tus gestiones</p>
        </div>
        <button
          onClick={() => onNavigate({ type: 'nuevo-tramite' })}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo Trámite
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar trámite, cliente u organismo..."
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
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">{search || filtroEstado !== 'todos' ? 'No se encontraron trámites' : 'No hay trámites cargados'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 divide-y divide-slate-100/80">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => onNavigate({ type: 'tramite', id: t.id })}
              className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${
                t.prioridad === 'urgente' ? 'bg-red-500' :
                t.prioridad === 'alta' ? 'bg-orange-400' :
                t.prioridad === 'normal' ? 'bg-blue-400' : 'bg-slate-300'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{t.titulo}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {(t.gestiones as any)?.nombre && (
                    <span className="text-xs text-blue-600 font-medium">{(t.gestiones as any).nombre}</span>
                  )}
                  {(t.gestiones as any)?.clientes?.razon_social && (
                    <span className="text-xs text-slate-500">{(t.gestiones as any).clientes.razon_social}</span>
                  )}
                  {t.organismo && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t.organismo}</span>}
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${ESTADO_COLORS[t.estado] || 'bg-slate-100'}`}>
                {ESTADO_LABELS[t.estado] || t.estado}
              </span>
              {t.fecha_vencimiento && (
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(t.fecha_vencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
