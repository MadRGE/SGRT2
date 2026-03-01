import { useState, useEffect, useMemo } from 'react';
import { Loader2, Ship, Search, Plus, ArrowUpDown, ChevronLeft, ChevronRight, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { DespachoService, type Despacho } from '../../services/DespachoService';
import {
  DESPACHO_ESTADO_LABELS,
  DESPACHO_ESTADO_COLORS,
  DESPACHO_ESTADO_FILTER_OPTIONS,
  DESPACHO_TIPO_LABELS,
  DESPACHO_TIPO_COLORS,
  DESPACHO_TRANSITIONS,
} from '../../lib/constants/despacho';

interface Props {
  onNavigate: (view: any) => void;
  onNewDespacho: () => void;
}

type SortKey = 'numero_despacho' | 'tipo' | 'cliente' | 'estado' | 'valor_fob' | 'created_at';

export default function DespachosListPage({ onNavigate, onNewDespacho }: Props) {
  const { user } = useAuth();
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) { setSortAsc(!sortAsc); } else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  };

  const filtered = (search
    ? despachos.filter((d) => {
        const s = search.toLowerCase();
        return (
          d.numero_despacho.toLowerCase().includes(s) ||
          d.descripcion?.toLowerCase().includes(s) ||
          d.clientes?.razon_social?.toLowerCase().includes(s) ||
          d.posicion_arancelaria?.toLowerCase().includes(s)
        );
      })
    : despachos
  ).slice().sort((a, b) => {
    let va: string | number = '';
    let vb: string | number = '';
    switch (sortKey) {
      case 'numero_despacho': va = a.numero_despacho; vb = b.numero_despacho; break;
      case 'tipo': va = a.tipo; vb = b.tipo; break;
      case 'cliente': va = a.clientes?.razon_social || ''; vb = b.clientes?.razon_social || ''; break;
      case 'estado': va = a.estado; vb = b.estado; break;
      case 'valor_fob': va = a.valor_fob || 0; vb = b.valor_fob || 0; break;
      case 'created_at': va = a.created_at; vb = b.created_at; break;
    }
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  // Reset page when search changes
  const searchRef = search; // used to track search changes
  useMemo(() => setPage(1), [searchRef]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((d) => d.id)));
    }
  };

  const getCommonTransitions = (): string[] => {
    if (selectedIds.size === 0) return [];
    const selected = despachos.filter((d) => selectedIds.has(d.id));
    const sets = selected.map((d) => new Set(DESPACHO_TRANSITIONS[d.estado] || []));
    const common = [...sets[0]].filter((t) => sets.every((s) => s.has(t)));
    return common;
  };

  const handleBulkEstado = async (nuevoEstado: string) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const { success, error } = await DespachoService.bulkUpdateEstado([...selectedIds], nuevoEstado);
    if (success) {
      toast.success(`${selectedIds.size} despacho(s) actualizados`);
      setSelectedIds(new Set());
      loadData();
    } else {
      toast.error(error || 'Error en actualización masiva');
    }
    setBulkLoading(false);
  };

  const commonTransitions = getCommonTransitions();

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

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-amber-800">
            {selectedIds.size} despacho{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            {commonTransitions.map((est) => (
              <button
                key={est}
                onClick={() => handleBulkEstado(est)}
                disabled={bulkLoading}
                className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {bulkLoading ? 'Actualizando...' : `→ ${DESPACHO_ESTADO_LABELS[est]}`}
              </button>
            ))}
            {commonTransitions.length === 0 && (
              <span className="text-xs text-amber-600">Sin transiciones comunes disponibles</span>
            )}
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-500 hover:text-slate-700 ml-2">
              Deseleccionar
            </button>
          </div>
        </div>
      )}

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
          {/* Table header — sortable */}
          <div className="hidden md:flex items-center gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <button onClick={toggleSelectAll} className="flex-shrink-0 text-slate-400 hover:text-amber-600">
              {selectedIds.size > 0 && selectedIds.size === paginated.length
                ? <CheckSquare className="w-4 h-4 text-amber-600" />
                : <Square className="w-4 h-4" />}
            </button>
            <div className="flex-1 grid grid-cols-12 gap-4">
              <SortHeader col="col-span-2" sortKey={sortKey} sortAsc={sortAsc} field="numero_despacho" label="Número" onSort={handleSort} />
              <SortHeader col="col-span-1" sortKey={sortKey} sortAsc={sortAsc} field="tipo" label="Tipo" onSort={handleSort} />
              <SortHeader col="col-span-3" sortKey={sortKey} sortAsc={sortAsc} field="cliente" label="Cliente" onSort={handleSort} />
              <SortHeader col="col-span-2" sortKey={sortKey} sortAsc={sortAsc} field="estado" label="Estado" onSort={handleSort} />
              <SortHeader col="col-span-2" sortKey={sortKey} sortAsc={sortAsc} field="valor_fob" label="Valor FOB" onSort={handleSort} />
              <SortHeader col="col-span-2" sortKey={sortKey} sortAsc={sortAsc} field="created_at" label="Fecha" onSort={handleSort} />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {paginated.map((d) => {
              const isSelected = selectedIds.has(d.id);
              return (
                <div
                  key={d.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-amber-50/50' : ''}`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(d.id); }}
                    className="flex-shrink-0 text-slate-400 hover:text-amber-600"
                  >
                    {isSelected
                      ? <CheckSquare className="w-4 h-4 text-amber-600" />
                      : <Square className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onNavigate({ type: 'despacho', id: d.id })}
                    className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 text-left items-center"
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
                </div>
              );
            })}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    typeof p === 'string' ? (
                      <span key={`e${i}`} className="px-1 text-xs text-slate-400">…</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium ${page === p ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-200'}`}>
                        {p}
                      </button>
                    )
                  )}
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SortHeader({ col, sortKey, sortAsc, field, label, onSort }: {
  col: string; sortKey: SortKey; sortAsc: boolean; field: SortKey; label: string; onSort: (k: SortKey) => void;
}) {
  const active = sortKey === field;
  return (
    <button onClick={() => onSort(field)}
      className={`${col} flex items-center gap-1 hover:text-slate-700 transition-colors ${active ? 'text-amber-600' : ''}`}>
      <ArrowUpDown className="w-3 h-3" /> {label}
      {active && <span className="text-[9px]">{sortAsc ? '▲' : '▼'}</span>}
    </button>
  );
}
