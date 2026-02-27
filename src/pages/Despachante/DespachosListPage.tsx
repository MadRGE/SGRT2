import { useState, useEffect } from 'react';
import { Loader2, Ship, Search, Plus, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DespachoService, type Despacho } from '../../services/DespachoService';
import {
  DESPACHO_ESTADO_LABELS,
  DESPACHO_ESTADO_COLORS,
  DESPACHO_ESTADO_FILTER_OPTIONS,
  DESPACHO_TIPO_LABELS,
  DESPACHO_TIPO_COLORS,
} from '../../lib/constants/despacho';

interface Props {
  onNavigate: (view: any) => void;
  onNewDespacho: () => void;
}

export default function DespachosListPage({ onNavigate, onNewDespacho }: Props) {
  const { user } = useAuth();
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id, filtroEstado, filtroTipo]);

  const loadData = async () => {
    setLoading(true);
    const data = await DespachoService.getDespachosByDespachante(user!.id, {
      estado: filtroEstado,
      tipo: filtroTipo,
    });
    setDespachos(data);
    setLoading(false);
  };

  const filtered = search
    ? despachos.filter((d) => {
        const s = search.toLowerCase();
        return (
          d.numero_despacho.toLowerCase().includes(s) ||
          d.descripcion?.toLowerCase().includes(s) ||
          d.clientes?.razon_social?.toLowerCase().includes(s) ||
          d.posicion_arancelaria?.toLowerCase().includes(s)
        );
      })
    : despachos;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Ship className="w-6 h-6 text-amber-600" />
            Despachos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} despacho{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onNewDespacho}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo Despacho
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, descripción, cliente..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {DESPACHO_ESTADO_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="todos">Todos los tipos</option>
          <option value="importacion">Importación</option>
          <option value="exportacion">Exportación</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
          <Ship className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No se encontraron despachos</p>
          <button onClick={onNewDespacho} className="text-sm text-amber-600 font-medium mt-2 hover:underline">
            Crear nuevo despacho
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <div className="col-span-2 flex items-center gap-1"><ArrowUpDown className="w-3 h-3" /> Número</div>
            <div className="col-span-1">Tipo</div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-2">Valor FOB</div>
            <div className="col-span-2">Fecha</div>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => onNavigate({ type: 'despacho', id: d.id })}
                className="w-full grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left items-center"
              >
                <div className="md:col-span-2">
                  <span className="font-mono text-sm font-semibold text-slate-800">{d.numero_despacho}</span>
                </div>
                <div className="md:col-span-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${DESPACHO_TIPO_COLORS[d.tipo] || 'bg-slate-100 text-slate-600'}`}>
                    {DESPACHO_TIPO_LABELS[d.tipo] || d.tipo}
                  </span>
                </div>
                <div className="md:col-span-3">
                  <p className="text-sm text-slate-700 truncate">{d.clientes?.razon_social || '-'}</p>
                  {d.descripcion && <p className="text-xs text-slate-400 truncate">{d.descripcion}</p>}
                </div>
                <div className="md:col-span-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${DESPACHO_ESTADO_COLORS[d.estado] || 'bg-slate-100 text-slate-600'}`}>
                    {DESPACHO_ESTADO_LABELS[d.estado] || d.estado}
                  </span>
                </div>
                <div className="md:col-span-2 text-sm text-slate-600">
                  {d.valor_fob ? DespachoService.formatMonto(d.valor_fob, d.moneda || 'USD') : '-'}
                </div>
                <div className="md:col-span-2 text-xs text-slate-400">
                  {new Date(d.created_at).toLocaleDateString('es-AR')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
