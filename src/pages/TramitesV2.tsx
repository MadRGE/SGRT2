import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Loader2, BookOpen, DollarSign, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  onNavigate: (page: any) => void;
}

// Normalized interface used by the UI
interface TramiteTipo {
  id: string;
  codigo: string;
  nombre: string;
  organismo: string;
  categoria: string | null;
  subcategoria: string | null;
  plataforma: string | null;
  plazo_dias: number | null;
  costo_organismo: number | null;
  honorarios: number | null;
  documentacion_obligatoria: string[] | null;
}

// Map raw DB row to our normalized interface
// Handles both v4 schema (organismo_id, rubro, etc.) and v5+ schema (organismo, categoria, etc.)
function mapRow(row: any): TramiteTipo {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    organismo: row.organismo || row.organismo_id || '',
    categoria: row.categoria || row.rubro || null,
    subcategoria: row.subcategoria || null,
    plataforma: row.plataforma || row.plataforma_gestion || null,
    plazo_dias: row.plazo_dias ?? row.sla_total_dias ?? null,
    costo_organismo: row.costo_organismo ?? row.costo_tasas_base ?? null,
    honorarios: row.honorarios ?? row.costo_honorarios_base ?? null,
    documentacion_obligatoria: row.documentacion_obligatoria || null,
  };
}

export default function TramitesV2({ onNavigate }: Props) {
  const [catalogo, setCatalogo] = useState<TramiteTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrganismo, setSelectedOrganismo] = useState('');
  const [search, setSearch] = useState('');
  const [expandedTipo, setExpandedTipo] = useState<string | null>(null);

  useEffect(() => {
    loadCatalogo();
  }, []);

  const loadCatalogo = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('tramite_tipos')
      .select('*')
      .order('organismo')
      .order('nombre');

    if (fetchError) {
      console.error('Error loading catalogo:', fetchError);
      setError(fetchError.message);
      setCatalogo([]);
    } else {
      const mapped = (data || []).map(mapRow);
      setCatalogo(mapped);
      // Auto-select first organismo
      if (mapped.length > 0 && !selectedOrganismo) {
        const orgs = [...new Set(mapped.map(t => t.organismo))];
        setSelectedOrganismo(orgs[0]);
      }
    }
    setLoading(false);
  };

  // Get unique organismos from data
  const organismos = [...new Set(catalogo.map(t => t.organismo))];

  // Filter by selected organismo and search
  const filtered = catalogo.filter(t => {
    if (selectedOrganismo && t.organismo !== selectedOrganismo) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.nombre.toLowerCase().includes(q) || t.codigo.toLowerCase().includes(q) ||
        (t.categoria || '').toLowerCase().includes(q) ||
        (t.subcategoria || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Group by categoria
  const categorias = [...new Set(filtered.map(t => t.categoria || 'General'))];

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-[26px] tracking-tight font-bold text-slate-800">Trámites</h1>
        <p className="text-sm text-slate-400 mt-0.5">Catálogo de servicios por organismo</p>
      </div>

      {/* Error or empty state */}
      {(error || (!loading && catalogo.length === 0)) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {error ? 'No se pudo cargar el catálogo' : 'El catálogo está vacío'}
              </p>
              <p className="text-sm text-amber-600 mt-1">
                Ejecutá la migración <strong>68_seed_catalogo_final.sql</strong> en el <strong>SQL Editor</strong> de Supabase
                para cargar los 104 trámites del catálogo (INAL + ANMAT PM).
              </p>
              {error && <p className="text-xs text-amber-500 mt-2">Error: {error}</p>}
              <button onClick={loadCatalogo} className="mt-3 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors">
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content - only when we have data */}
      {catalogo.length > 0 && (
        <>
          {/* Organismo tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {organismos.map(org => {
              const count = catalogo.filter(t => t.organismo === org).length;
              return (
                <button
                  key={org}
                  onClick={() => { setSelectedOrganismo(org); setSearch(''); }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    selectedOrganismo === org
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {org} <span className={`ml-1 ${selectedOrganismo === org ? 'text-blue-200' : 'text-slate-400'}`}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Catalog list grouped by categoria */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No se encontraron trámites{search ? ' con esa búsqueda' : ''}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categorias.map(cat => {
                const items = filtered.filter(t => (t.categoria || 'General') === cat);
                return (
                  <div key={cat} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{cat}</span>
                      <span className="text-xs text-slate-400 ml-2">({items.length})</span>
                    </div>
                    <div className="divide-y divide-slate-100/80">
                      {items.map(tipo => (
                        <div key={tipo.id}>
                          <button
                            onClick={() => setExpandedTipo(expandedTipo === tipo.id ? null : tipo.id)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-slate-400">{tipo.codigo}</span>
                                  {tipo.subcategoria && (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{tipo.subcategoria}</span>
                                  )}
                                </div>
                                <p className="text-sm font-medium text-slate-800 mt-0.5">{tipo.nombre}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  {tipo.plataforma && <span className="text-[10px] text-slate-400">Plataforma: {tipo.plataforma}</span>}
                                  {tipo.plazo_dias && <span className="text-[10px] text-slate-400">{tipo.plazo_dias} días</span>}
                                  {tipo.documentacion_obligatoria?.length ? (
                                    <span className="text-[10px] text-amber-600 font-medium">{tipo.documentacion_obligatoria.length} docs requeridos</span>
                                  ) : null}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {tipo.honorarios ? (
                                  <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    {tipo.honorarios.toLocaleString('es-AR')}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">Sin precio</span>
                                )}
                                {tipo.costo_organismo ? (
                                  <p className="text-[10px] text-slate-400">Tasa: ${tipo.costo_organismo.toLocaleString('es-AR')}</p>
                                ) : null}
                              </div>
                              {expandedTipo === tipo.id
                                ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                                : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                              }
                            </div>
                          </button>

                          {/* Expanded detail */}
                          {expandedTipo === tipo.id && (
                            <div className="px-4 pb-3 space-y-2">
                              {tipo.documentacion_obligatoria?.length ? (
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                  <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5">
                                    Documentación requerida ({tipo.documentacion_obligatoria.length})
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {tipo.documentacion_obligatoria.map((doc, i) => (
                                      <span key={i} className="text-[11px] bg-white border border-amber-200 text-amber-800 px-2 py-0.5 rounded">
                                        {doc}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">Sin documentación obligatoria definida</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <p className="text-xs text-slate-400 text-center">
                {filtered.length} trámites en {selectedOrganismo}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
