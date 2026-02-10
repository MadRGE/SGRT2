import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Search, Save, Loader2, ChevronDown, ChevronRight, X } from 'lucide-react';

interface TramiteTipo {
  id: string;
  codigo: string;
  nombre: string;
  organismo: string;
  categoria: string | null;
  costo_organismo: number | null;
  honorarios: number | null;
}

const ORGANISMOS = ['INAL', 'ANMAT', 'SENASA', 'INTI', 'SEDRONAR', 'CITES', 'INASE', 'SIC'];

export default function PreciosV2() {
  const [tipos, setTipos] = useState<TramiteTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [expandedOrg, setExpandedOrg] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: t } = await supabase
      .from('tramite_tipos')
      .select('id, codigo, nombre, organismo, categoria, costo_organismo, honorarios')
      .eq('activo', true)
      .order('organismo')
      .order('nombre');
    setTipos((t as TramiteTipo[]) || []);
    setLoading(false);
  };

  const handleStartEdit = (tipo: TramiteTipo) => {
    setEditingId(tipo.id);
    setEditPrice((tipo.honorarios || 0).toString());
  };

  const handleSavePrice = async (tipoId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('tramite_tipos')
      .update({ honorarios: parseFloat(editPrice) || 0 })
      .eq('id', tipoId);

    if (!error) {
      setEditingId(null);
      loadData();
    }
    setSaving(false);
  };

  const toggleOrg = (org: string) => {
    setExpandedOrg(prev =>
      prev.includes(org) ? prev.filter(o => o !== org) : [...prev, org]
    );
  };

  const filtered = tipos.filter(t => {
    if (filterOrg && t.organismo !== filterOrg) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.nombre.toLowerCase().includes(q) || t.codigo.toLowerCase().includes(q);
    }
    return true;
  });

  const orgGroups = [...new Set(filtered.map(t => t.organismo))];

  const conPrecio = tipos.filter(t => (t.honorarios || 0) > 0).length;
  const sinPrecio = tipos.length - conPrecio;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-[26px] tracking-tight font-bold text-slate-800">Precios</h1>
        <p className="text-sm text-slate-400 mt-0.5">Gestiona los honorarios del catalogo de tramites</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <p className="text-3xl font-bold text-slate-800">{tipos.length}</p>
          <p className="text-xs text-slate-400">Total tramites en catalogo</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <p className="text-3xl font-bold text-green-700">{conPrecio}</p>
          <p className="text-xs text-slate-400">Con honorarios definidos</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <p className="text-3xl font-bold text-amber-600">{sinPrecio}</p>
          <p className="text-xs text-slate-400">Sin honorarios</p>
        </div>
      </div>

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
        <div className="grid grid-cols-[1fr_120px_120px_40px] gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50/80">
          <span className="text-xs font-semibold text-slate-500 uppercase">Tramite</span>
          <span className="text-xs font-semibold text-slate-500 uppercase text-right">Tasa Organismo</span>
          <span className="text-xs font-semibold text-blue-600 uppercase text-right">Honorarios</span>
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
                  <div key={tipo.id} className="grid grid-cols-[1fr_120px_120px_40px] gap-2 items-center px-4 py-2.5 border-b border-slate-100/80 hover:bg-slate-50/30">
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
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          className="w-full px-2 py-1 text-xs text-right bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          type="number"
                          placeholder="0"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSavePrice(tipo.id)}
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
                        <span className={`text-xs text-right font-medium ${(tipo.honorarios || 0) > 0 ? 'text-green-700' : 'text-slate-300'}`}>
                          {(tipo.honorarios || 0) > 0 ? `$${tipo.honorarios!.toLocaleString('es-AR')}` : '-'}
                        </span>
                        <button
                          onClick={() => handleStartEdit(tipo)}
                          className="p-1 text-slate-300 hover:text-blue-600 transition-colors"
                          title="Editar precio"
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
    </div>
  );
}
