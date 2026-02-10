import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Search, Save, Loader2, ChevronDown, ChevronRight, Plus, X, Trash2 } from 'lucide-react';

interface TramiteTipo {
  id: string;
  codigo: string;
  nombre: string;
  organismo: string;
  categoria: string | null;
  costo_organismo: number | null;
  precio_banda_1: number | null;
  precio_banda_2: number | null;
  precio_banda_3: number | null;
}

interface ListaPrecio {
  id: string;
  nombre: string;
  descripcion: string | null;
  banda_default: number;
  descuento_global: number;
  activa: boolean;
}

interface ListaItem {
  id: string;
  lista_id: string;
  tramite_tipo_id: string;
  precio_custom: number;
  notas: string | null;
}

const BANDA_LABELS: Record<number, { label: string; color: string; desc: string }> = {
  1: { label: 'Estandar', color: 'bg-blue-100 text-blue-700', desc: 'Plazo normal' },
  2: { label: 'Prioritario', color: 'bg-orange-100 text-orange-700', desc: 'Gestion acelerada' },
  3: { label: 'Urgente', color: 'bg-red-100 text-red-700', desc: 'Maxima prioridad, costo premium' },
};

const ORGANISMOS = ['INAL', 'ANMAT', 'SENASA', 'INTI', 'SEDRONAR', 'CITES', 'INASE', 'SIC'];

export default function PreciosV2() {
  const [tipos, setTipos] = useState<TramiteTipo[]>([]);
  const [listas, setListas] = useState<ListaPrecio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [expandedOrg, setExpandedOrg] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrices, setEditPrices] = useState({ banda1: '', banda2: '', banda3: '' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'bandas' | 'listas'>('bandas');
  const [showNewLista, setShowNewLista] = useState(false);
  const [newListaForm, setNewListaForm] = useState({ nombre: '', descripcion: '', banda_default: 1, descuento_global: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: t } = await supabase
      .from('tramite_tipos')
      .select('id, codigo, nombre, organismo, categoria, costo_organismo, precio_banda_1, precio_banda_2, precio_banda_3')
      .eq('activo', true)
      .order('organismo')
      .order('nombre');
    setTipos((t as TramiteTipo[]) || []);

    const { data: l } = await supabase
      .from('listas_precios')
      .select('*')
      .order('nombre');
    setListas((l as ListaPrecio[]) || []);

    setLoading(false);
  };

  const handleStartEdit = (tipo: TramiteTipo) => {
    setEditingId(tipo.id);
    setEditPrices({
      banda1: (tipo.precio_banda_1 || 0).toString(),
      banda2: (tipo.precio_banda_2 || 0).toString(),
      banda3: (tipo.precio_banda_3 || 0).toString(),
    });
  };

  const handleSavePrices = async (tipoId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('tramite_tipos')
      .update({
        precio_banda_1: parseFloat(editPrices.banda1) || 0,
        precio_banda_2: parseFloat(editPrices.banda2) || 0,
        precio_banda_3: parseFloat(editPrices.banda3) || 0,
        honorarios: parseFloat(editPrices.banda1) || 0,
      })
      .eq('id', tipoId);

    if (!error) {
      setEditingId(null);
      loadData();
    }
    setSaving(false);
  };

  const handleCreateLista = async () => {
    if (!newListaForm.nombre.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('listas_precios').insert({
      nombre: newListaForm.nombre,
      descripcion: newListaForm.descripcion || null,
      banda_default: newListaForm.banda_default,
      descuento_global: newListaForm.descuento_global,
    });
    if (!error) {
      setShowNewLista(false);
      setNewListaForm({ nombre: '', descripcion: '', banda_default: 1, descuento_global: 0 });
      loadData();
    }
    setSaving(false);
  };

  const handleDeleteLista = async (id: string) => {
    if (!confirm('Eliminar esta lista de precios?')) return;
    await supabase.from('listas_precios').delete().eq('id', id);
    loadData();
  };

  const handleToggleListaActiva = async (lista: ListaPrecio) => {
    await supabase.from('listas_precios').update({ activa: !lista.activa, updated_at: new Date().toISOString() }).eq('id', lista.id);
    loadData();
  };

  const toggleOrg = (org: string) => {
    setExpandedOrg(prev =>
      prev.includes(org) ? prev.filter(o => o !== org) : [...prev, org]
    );
  };

  // Filter
  const filtered = tipos.filter(t => {
    if (filterOrg && t.organismo !== filterOrg) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.nombre.toLowerCase().includes(q) || t.codigo.toLowerCase().includes(q);
    }
    return true;
  });

  const orgGroups = [...new Set(filtered.map(t => t.organismo))];

  // Stats
  const conPrecio = tipos.filter(t => (t.precio_banda_1 || 0) > 0).length;
  const sinPrecio = tipos.length - conPrecio;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-[26px] tracking-tight font-bold text-slate-800">Precios</h1>
        <p className="text-sm text-slate-400 mt-0.5">Gestiona honorarios por banda y listas especiales por cliente</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(banda => {
          const info = BANDA_LABELS[banda];
          const count = tipos.filter(t => {
            const p = banda === 1 ? t.precio_banda_1 : banda === 2 ? t.precio_banda_2 : t.precio_banda_3;
            return (p || 0) > 0;
          }).length;
          return (
            <div key={banda} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.color}`}>Banda {banda}</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{info.label}</p>
              <p className="text-xs text-slate-400">{info.desc}</p>
              <p className="text-xs text-slate-500 mt-2">{count}/{tipos.length} con precio</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('bandas')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'bandas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Bandas de Precio ({tipos.length})
        </button>
        <button
          onClick={() => setTab('listas')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'listas' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Listas Especiales ({listas.length})
        </button>
      </div>

      {tab === 'bandas' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          {/* Filters */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button
                onClick={() => setFilterOrg('')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  !filterOrg ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                }`}
              >
                Todos
              </button>
              {ORGANISMOS.map(org => {
                const count = tipos.filter(t => t.organismo === org).length;
                if (count === 0) return null;
                return (
                  <button
                    key={org}
                    onClick={() => setFilterOrg(org === filterOrg ? '' : org)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      filterOrg === org ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {org} ({count})
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar tramite..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_100px_100px_100px_100px_40px] gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50/80">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tramite</span>
            <span className="text-xs font-semibold text-slate-500 uppercase text-right">Tasa</span>
            <span className="text-xs font-semibold text-blue-600 uppercase text-right">Banda 1</span>
            <span className="text-xs font-semibold text-orange-600 uppercase text-right">Banda 2</span>
            <span className="text-xs font-semibold text-red-600 uppercase text-right">Banda 3</span>
            <span></span>
          </div>

          {/* Items by org */}
          <div className="max-h-[600px] overflow-y-auto">
            {orgGroups.map(org => {
              const orgTipos = filtered.filter(t => t.organismo === org);
              const isExpanded = expandedOrg.includes(org) || filterOrg !== '' || search !== '';

              return (
                <div key={org}>
                  <button
                    onClick={() => toggleOrg(org)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="text-xs font-bold text-slate-600 uppercase">{org}</span>
                    <span className="text-xs text-slate-400">({orgTipos.length})</span>
                  </button>

                  {isExpanded && orgTipos.map(tipo => (
                    <div key={tipo.id} className="grid grid-cols-[1fr_100px_100px_100px_100px_40px] gap-2 items-center px-4 py-2.5 border-b border-slate-100/80 hover:bg-slate-50/30">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{tipo.nombre}</p>
                        <span className="text-[10px] font-mono text-slate-400">{tipo.codigo}</span>
                      </div>

                      <span className="text-xs text-slate-500 text-right">
                        {tipo.costo_organismo ? `$${tipo.costo_organismo.toLocaleString('es-AR')}` : '-'}
                      </span>

                      {editingId === tipo.id ? (
                        <>
                          <input
                            value={editPrices.banda1}
                            onChange={e => setEditPrices({ ...editPrices, banda1: e.target.value })}
                            className="w-full px-2 py-1 text-xs text-right bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            type="number"
                            placeholder="0"
                          />
                          <input
                            value={editPrices.banda2}
                            onChange={e => setEditPrices({ ...editPrices, banda2: e.target.value })}
                            className="w-full px-2 py-1 text-xs text-right bg-orange-50 border border-orange-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500"
                            type="number"
                            placeholder="0"
                          />
                          <input
                            value={editPrices.banda3}
                            onChange={e => setEditPrices({ ...editPrices, banda3: e.target.value })}
                            className="w-full px-2 py-1 text-xs text-right bg-red-50 border border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                            type="number"
                            placeholder="0"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSavePrices(tipo.id)}
                              disabled={saving}
                              className="p-1 text-green-600 hover:text-green-700"
                              title="Guardar"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className={`text-xs text-right font-medium ${(tipo.precio_banda_1 || 0) > 0 ? 'text-blue-700' : 'text-slate-300'}`}>
                            {(tipo.precio_banda_1 || 0) > 0 ? `$${tipo.precio_banda_1!.toLocaleString('es-AR')}` : '-'}
                          </span>
                          <span className={`text-xs text-right font-medium ${(tipo.precio_banda_2 || 0) > 0 ? 'text-orange-700' : 'text-slate-300'}`}>
                            {(tipo.precio_banda_2 || 0) > 0 ? `$${tipo.precio_banda_2!.toLocaleString('es-AR')}` : '-'}
                          </span>
                          <span className={`text-xs text-right font-medium ${(tipo.precio_banda_3 || 0) > 0 ? 'text-red-700' : 'text-slate-300'}`}>
                            {(tipo.precio_banda_3 || 0) > 0 ? `$${tipo.precio_banda_3!.toLocaleString('es-AR')}` : '-'}
                          </span>
                          <button
                            onClick={() => handleStartEdit(tipo)}
                            className="p-1 text-slate-300 hover:text-blue-600 transition-colors"
                            title="Editar precios"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'listas' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowNewLista(true)}
              className="flex items-center gap-1 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-blue-500/25"
            >
              <Plus className="w-4 h-4" /> Nueva Lista
            </button>
          </div>

          {showNewLista && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-slate-800">Nueva Lista de Precios</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
                  <input
                    value={newListaForm.nombre}
                    onChange={e => setNewListaForm({ ...newListaForm, nombre: e.target.value })}
                    placeholder="Ej: MercadoLibre 2025"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Banda por defecto</label>
                  <select
                    value={newListaForm.banda_default}
                    onChange={e => setNewListaForm({ ...newListaForm, banda_default: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Banda 1 - Estandar</option>
                    <option value={2}>Banda 2 - Prioritario</option>
                    <option value={3}>Banda 3 - Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Descuento global (%)</label>
                  <input
                    type="number"
                    value={newListaForm.descuento_global}
                    onChange={e => setNewListaForm({ ...newListaForm, descuento_global: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Descripcion</label>
                  <input
                    value={newListaForm.descripcion}
                    onChange={e => setNewListaForm({ ...newListaForm, descripcion: e.target.value })}
                    placeholder="Contrato anual, etc."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowNewLista(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                <button
                  onClick={handleCreateLista}
                  disabled={saving || !newListaForm.nombre.trim()}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
                >
                  Crear
                </button>
              </div>
            </div>
          )}

          {listas.length === 0 && !showNewLista ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-8 text-center text-slate-400">
              <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Sin listas de precios especiales</p>
              <p className="text-xs mt-1">Las listas te permiten asignar precios especiales a clientes frecuentes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listas.map(lista => (
                <div key={lista.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{lista.nombre}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          lista.activa ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {lista.activa ? 'Activa' : 'Inactiva'}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BANDA_LABELS[lista.banda_default]?.color || 'bg-slate-100'}`}>
                          Banda {lista.banda_default}
                        </span>
                      </div>
                      {lista.descripcion && <p className="text-xs text-slate-400 mt-0.5">{lista.descripcion}</p>}
                      {lista.descuento_global > 0 && (
                        <p className="text-xs text-green-600 mt-1">Descuento global: {lista.descuento_global}%</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleListaActiva(lista)}
                        className="text-xs text-slate-500 hover:text-blue-600"
                      >
                        {lista.activa ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDeleteLista(lista.id)}
                        className="p-1 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
