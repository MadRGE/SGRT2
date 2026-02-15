import { useState, useEffect } from 'react';
import { supabase, filterActive } from '../lib/supabase';
import { Search, FileText, ChevronRight, Loader2, AlertTriangle, CheckCircle2, Clock, CircleDot, BookOpen, DollarSign } from 'lucide-react';

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
  semaforo: string | null;
  progreso: number | null;
  fecha_vencimiento: string | null;
  created_at: string;
  gestiones: { nombre: string; clientes: { razon_social: string } | null } | null;
  docs_total?: number;
  docs_pendientes?: number;
}

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
  observaciones: string | null;
}

const ESTADO_COLORS: Record<string, string> = {
  consulta: 'bg-slate-100 text-slate-600', presupuestado: 'bg-purple-100 text-purple-700',
  en_curso: 'bg-blue-100 text-blue-700', esperando_cliente: 'bg-yellow-100 text-yellow-700',
  esperando_organismo: 'bg-orange-100 text-orange-700', observado: 'bg-red-100 text-red-700',
  aprobado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700',
};

const ESTADO_LABELS: Record<string, string> = {
  consulta: 'Consulta', presupuestado: 'Presupuestado', en_curso: 'En Curso',
  esperando_cliente: 'Esp. Cliente', esperando_organismo: 'Esp. Organismo',
  observado: 'Observado', aprobado: 'Aprobado', rechazado: 'Rechazado',
};

const SEMAFORO_COLORS: Record<string, string> = {
  verde: 'text-green-500', amarillo: 'text-yellow-500', rojo: 'text-red-500',
};

export default function TramitesV2({ onNavigate }: Props) {
  const [tab, setTab] = useState<'activos' | 'catalogo'>('catalogo');
  // Activos state
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroSemaforo, setFiltroSemaforo] = useState('todos');
  const [loading, setLoading] = useState(true);
  // Catálogo state
  const [catalogo, setCatalogo] = useState<TramiteTipo[]>([]);
  const [catalogoOrganismo, setCatalogoOrganismo] = useState('');
  const [searchCatalogo, setSearchCatalogo] = useState('');
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);
  const [expandedTipo, setExpandedTipo] = useState<string | null>(null);

  useEffect(() => {
    loadTramites();
    loadCatalogo();
  }, []);

  const loadTramites = async () => {
    setLoading(true);
    try {
      const { data } = await filterActive(supabase
        .from('tramites')
        .select('id, titulo, estado, tipo, organismo, prioridad, semaforo, progreso, fecha_vencimiento, created_at, gestiones(nombre, clientes(razon_social))'))
        .order('created_at', { ascending: false });

      const tramitesList = (data as any) || [];

      if (tramitesList.length > 0) {
        const ids = tramitesList.map((t: any) => t.id);
        const { data: docs } = await supabase
          .from('documentos_tramite')
          .select('tramite_id, estado')
          .in('tramite_id', ids);

        if (docs) {
          const docMap: Record<string, { total: number; pendientes: number }> = {};
          docs.forEach((d: any) => {
            if (!docMap[d.tramite_id]) docMap[d.tramite_id] = { total: 0, pendientes: 0 };
            docMap[d.tramite_id].total++;
            if (d.estado === 'pendiente') docMap[d.tramite_id].pendientes++;
          });
          tramitesList.forEach((t: any) => {
            if (docMap[t.id]) {
              t.docs_total = docMap[t.id].total;
              t.docs_pendientes = docMap[t.id].pendientes;
            }
          });
        }
      }

      setTramites(tramitesList);
    } catch (e) {
      console.warn('Error:', e);
    }
    setLoading(false);
  };

  const loadCatalogo = async () => {
    setLoadingCatalogo(true);
    const { data } = await supabase
      .from('tramite_tipos')
      .select('*')
      .order('organismo')
      .order('nombre');
    setCatalogo((data as TramiteTipo[]) || []);
    // Auto-select first organismo
    if (data && data.length > 0 && !catalogoOrganismo) {
      setCatalogoOrganismo(data[0].organismo);
    }
    setLoadingCatalogo(false);
  };

  // Organismos from catalog
  const catalogoOrganismos = [...new Set(catalogo.map(t => t.organismo))];

  // Filtered catalog
  const filteredCatalogo = catalogo.filter(t => {
    if (catalogoOrganismo && t.organismo !== catalogoOrganismo) return false;
    if (searchCatalogo.trim()) {
      const q = searchCatalogo.toLowerCase();
      return t.nombre.toLowerCase().includes(q) || t.codigo.toLowerCase().includes(q) ||
        (t.categoria || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Group filtered catalog by categoria
  const categorias = [...new Set(filteredCatalogo.map(t => t.categoria || 'General'))];

  // Filtered active tramites
  const filtered = tramites.filter(t => {
    if (filtroEstado !== 'todos' && t.estado !== filtroEstado) return false;
    if (filtroSemaforo !== 'todos' && t.semaforo !== filtroSemaforo) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return t.titulo.toLowerCase().includes(s) ||
        (t.gestiones as any)?.nombre?.toLowerCase().includes(s) ||
        (t.gestiones as any)?.clientes?.razon_social?.toLowerCase().includes(s) ||
        t.organismo?.toLowerCase().includes(s);
    }
    return true;
  });

  const stats = {
    total: tramites.length,
    enCurso: tramites.filter(t => t.estado === 'en_curso').length,
    rojo: tramites.filter(t => t.semaforo === 'rojo').length,
    docsPendientes: tramites.filter(t => (t.docs_pendientes || 0) > 0).length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-[26px] tracking-tight font-bold text-slate-800">Trámites</h1>
        <p className="text-sm text-slate-400 mt-0.5">Catálogo de servicios y supervisión de procesos activos</p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setTab('catalogo')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'catalogo' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Catálogo ({catalogo.length})
        </button>
        <button
          onClick={() => setTab('activos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'activos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Activos ({tramites.length})
          {stats.rojo > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{stats.rojo}</span>
          )}
        </button>
      </div>

      {/* ========== CATÁLOGO TAB ========== */}
      {tab === 'catalogo' && (
        <>
          {/* Organismo tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {catalogoOrganismos.map(org => {
              const count = catalogo.filter(t => t.organismo === org).length;
              return (
                <button
                  key={org}
                  onClick={() => setCatalogoOrganismo(org)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    catalogoOrganismo === org
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {org} <span className={`ml-1 ${catalogoOrganismo === org ? 'text-blue-200' : 'text-slate-400'}`}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search catalog */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={searchCatalogo}
              onChange={(e) => setSearchCatalogo(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {loadingCatalogo ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : filteredCatalogo.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No hay trámites en el catálogo{catalogoOrganismo ? ` para ${catalogoOrganismo}` : ''}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categorias.map(cat => (
                <div key={cat} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{cat}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      ({filteredCatalogo.filter(t => (t.categoria || 'General') === cat).length})
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100/80">
                    {filteredCatalogo.filter(t => (t.categoria || 'General') === cat).map(tipo => (
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
                            {tipo.observaciones && (
                              <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">{tipo.observaciones}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <p className="text-xs text-slate-400 text-center">
                {filteredCatalogo.length} trámites en {catalogoOrganismo || 'catálogo'}
              </p>
            </div>
          )}
        </>
      )}

      {/* ========== ACTIVOS TAB ========== */}
      {tab === 'activos' && (
        <>
          {/* KPI strip */}
          {!loading && tramites.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Total activos</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.enCurso}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">En curso</p>
              </div>
              <button
                onClick={() => { setFiltroSemaforo(filtroSemaforo === 'rojo' ? 'todos' : 'rojo'); }}
                className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-3 text-center hover:border-red-300 transition-colors"
              >
                <p className="text-2xl font-bold text-red-600">{stats.rojo}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Semáforo rojo</p>
              </button>
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.docsPendientes}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Docs pendientes</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar trámite, gestión, cliente..."
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
                <option value="todos">Estado</option>
                {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Semáforo pills */}
            <div className="flex gap-1.5">
              {['todos', 'verde', 'amarillo', 'rojo'].map(s => (
                <button
                  key={s}
                  onClick={() => setFiltroSemaforo(s)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    filtroSemaforo === s
                      ? s === 'rojo' ? 'bg-red-100 text-red-700 border-red-300'
                      : s === 'amarillo' ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                      : s === 'verde' ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Active tramites list */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">{search || filtroEstado !== 'todos' || filtroSemaforo !== 'todos' ? 'No se encontraron trámites con esos filtros' : 'No hay trámites activos'}</p>
              <p className="text-xs text-slate-400 mt-1">Los trámites se crean desde una gestión</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm divide-y divide-slate-100/80">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onNavigate({ type: 'tramite', id: t.id })}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex-shrink-0">
                    <CircleDot className={`w-5 h-5 ${SEMAFORO_COLORS[t.semaforo || 'verde'] || 'text-slate-300'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 truncate">{t.titulo}</p>
                      {t.prioridad === 'urgente' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">URGENTE</span>}
                      {t.prioridad === 'alta' && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">ALTA</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {(t.gestiones as any)?.nombre && <span className="text-xs text-blue-600 font-medium">{(t.gestiones as any).nombre}</span>}
                      {(t.gestiones as any)?.clientes?.razon_social && <span className="text-xs text-slate-400">· {(t.gestiones as any).clientes.razon_social}</span>}
                      {t.organismo && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t.organismo}</span>}
                    </div>
                  </div>
                  {t.docs_total != null && t.docs_total > 0 && (
                    <div className="flex-shrink-0 text-right">
                      {t.docs_pendientes && t.docs_pendientes > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <AlertTriangle className="w-3 h-3" /> {t.docs_pendientes}/{t.docs_total}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="w-3 h-3" /> {t.docs_total}
                        </span>
                      )}
                      <p className="text-[10px] text-slate-400">docs</p>
                    </div>
                  )}
                  {t.progreso != null && t.progreso > 0 && (
                    <div className="flex-shrink-0 w-12">
                      <p className="text-xs font-medium text-slate-600 text-center">{t.progreso}%</p>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-0.5">
                        <div className={`h-full rounded-full ${t.progreso >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(t.progreso, 100)}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${ESTADO_COLORS[t.estado] || 'bg-slate-100'}`}>
                      {ESTADO_LABELS[t.estado] || t.estado}
                    </span>
                    {t.fecha_vencimiento && (
                      <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {new Date(t.fecha_vencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <p className="text-xs text-slate-400 text-center">
              {filtered.length === tramites.length ? `${tramites.length} trámites` : `${filtered.length} de ${tramites.length} trámites`}
            </p>
          )}
        </>
      )}
    </div>
  );
}
