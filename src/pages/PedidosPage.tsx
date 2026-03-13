/**
 * PedidosPage — Online order management (premium module).
 */
import { useState, useEffect } from 'react';
import {
  ClipboardList, Plus, Loader2, X, Phone, MapPin,
  User, ChevronRight, Package,
} from 'lucide-react';

const API = 'http://localhost:8500/api/v2';
const token = () => localStorage.getItem('sgrt_token') || '';
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

interface Pedido {
  id: string;
  numero: number;
  estado: string;
  total: number;
  comprador_nombre: string;
  comprador_telefono: string;
  retira_en_local: number;
  direccion_entrega: string;
  created_at: string;
}

interface Stats {
  total_pedidos: number;
  pendientes: number;
  en_curso: number;
  monto_total: number;
}

const ESTADOS = ['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'] as const;

interface Props {
  clienteId?: string;
}

export default function PedidosPage({ clienteId }: Props) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');

  const cid = clienteId || '';

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [pedR, statsR] = await Promise.all([
        fetch(`${API}/pedidos?cliente_id=${cid}&limit=100`, { headers: headers() }),
        cid ? fetch(`${API}/pedidos/stats/${cid}`, { headers: headers() }) : Promise.resolve(null),
      ]);
      if (pedR.ok) setPedidos(await pedR.json());
      if (statsR && statsR.ok) setStats(await statsR.json());
    } catch {}
    setLoading(false);
  }

  async function updateEstado(id: string, estado: string) {
    await fetch(`${API}/pedidos/${id}/estado?estado=${estado}`, { method: 'PUT', headers: headers() });
    load();
  }

  const estadoColor = (e: string) => {
    switch (e) {
      case 'pendiente': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'confirmado': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'preparando': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      case 'listo': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'entregado': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const nextEstado = (current: string): string | null => {
    const idx = ESTADOS.indexOf(current as any);
    if (idx >= 0 && idx < ESTADOS.length - 2) return ESTADOS[idx + 1]; // Skip 'cancelado'
    return null;
  };

  const filtered = pedidos.filter(p => !filtroEstado || p.estado === filtroEstado);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-blue-400" /> Pedidos
        </h1>
        <p className="text-slate-400 text-sm mt-1">Gestión de pedidos y entregas</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">Total Pedidos</p>
            <p className="text-xl font-bold text-white">{stats.total_pedidos}</p>
          </div>
          <div className="bg-slate-800 border border-amber-500/20 rounded-lg p-3">
            <p className="text-xs text-amber-400">Pendientes</p>
            <p className="text-xl font-bold text-amber-400">{stats.pendientes}</p>
          </div>
          <div className="bg-slate-800 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-blue-400">En Curso</p>
            <p className="text-xl font-bold text-blue-400">{stats.en_curso}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">Monto Total</p>
            <p className="text-xl font-bold text-emerald-400">${stats.monto_total.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltroEstado('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !filtroEstado ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}>Todos ({pedidos.length})</button>
        {ESTADOS.map(e => {
          const count = pedidos.filter(p => p.estado === e).length;
          if (!count) return null;
          return (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filtroEstado === e ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}>{e} ({count})</button>
          );
        })}
      </div>

      {/* Pedidos list */}
      <div className="space-y-3">
        {filtered.map(p => {
          const next = nextEstado(p.estado);
          return (
            <div key={p.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 font-bold text-sm">#{p.numero}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {p.comprador_nombre}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${estadoColor(p.estado)}`}>
                      {p.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{new Date(p.created_at).toLocaleString()}</span>
                    {p.comprador_telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.comprador_telefono}</span>}
                    <span className="flex items-center gap-1">
                      {p.retira_en_local ? <Package className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {p.retira_en_local ? 'Retira en local' : p.direccion_entrega || 'Envío'}
                    </span>
                  </div>
                </div>
                <span className="text-lg font-bold text-emerald-400">${p.total.toLocaleString()}</span>
                {next && (
                  <button onClick={() => updateEstado(p.id, next)}
                    className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg text-xs hover:bg-blue-600/30 flex items-center gap-1 capitalize">
                    {next} <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!filtered.length && <p className="text-center text-slate-500 py-12">No hay pedidos</p>}
      </div>
    </div>
  );
}
