import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Info, List, CheckSquare, X, ArrowLeft, Plus } from 'lucide-react';
import TramiteTipoFormModal from '../components/Catalogo/TramiteTipoFormModal';

interface Props {
  onBack: () => void;
}

interface TramiteTipo {
  id: string;
  codigo: string;
  nombre: string;
  organismo_id: string;
  rubro: string;
  base_legal: string[];
  renovacion: string;
  sla_total_dias: number;
  admite_equivalencia: boolean;
  logica_especial: string | null;
  es_habilitacion_previa: boolean;
}

interface Organismo {
  id: string;
  sigla: string;
  nombre: string;
}

interface ChecklistItem {
  id: string;
  item: string;
  obligatorio: boolean;
  responsable: string;
  grupo: string | null;
}

interface Paso {
  id: string;
  orden: number;
  nombre: string;
  rol_responsable: string;
}

export default function Catalogo({ onBack }: Props) {
  const [tramites, setTramites] = useState<TramiteTipo[]>([]);
  const [organismos, setOrganismos] = useState<Organismo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOrganismoTab, setActiveOrganismoTab] = useState('todos');
  const [filterRubro, setFilterRubro] = useState('todos');
  const [selectedTramite, setSelectedTramite] = useState<TramiteTipo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const [tramitesRes, organismosRes] = await Promise.all([
      supabase.from('tramite_tipos').select('*').order('nombre'),
      supabase.from('organismos').select('*').order('sigla')
    ]);

    if (tramitesRes.data) setTramites(tramitesRes.data);
    if (organismosRes.data) setOrganismos(organismosRes.data);

    setLoading(false);
  };

  const rubrosUnicos = useMemo(() => {
    return [...new Set(tramites.map((t) => t.rubro))].sort();
  }, [tramites]);

  const organismoTramiteCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: tramites.length };
    organismos.forEach((org) => {
      counts[org.id] = tramites.filter((t) => t.organismo_id === org.id).length;
    });
    return counts;
  }, [tramites, organismos]);

  const filteredTramites = useMemo(() => {
    return tramites.filter((t) => {
      if (activeOrganismoTab !== 'todos' && t.organismo_id !== activeOrganismoTab) return false;
      if (filterRubro !== 'todos' && t.rubro !== filterRubro) return false;
      if (
        searchTerm &&
        !t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !t.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });
  }, [tramites, searchTerm, activeOrganismoTab, filterRubro]);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver al Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Catálogo de Trámites</h1>
            <p className="text-slate-600 mt-1">
              Biblioteca de todos los trámites, habilitaciones y registros gestionados por el
              sistema.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nuevo Trámite
          </button>
        </div>

        <div className="mb-6 border-b border-slate-200">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveOrganismoTab('todos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-all ${
                activeOrganismoTab === 'todos'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeOrganismoTab === 'todos'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {organismoTramiteCounts['todos']}
              </span>
            </button>
            {organismos.map((org) => (
              <button
                key={org.id}
                onClick={() => setActiveOrganismoTab(org.id)}
                title={org.nombre}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-all ${
                  activeOrganismoTab === org.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {org.sigla}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeOrganismoTab === org.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {organismoTramiteCounts[org.id] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 md:space-y-0 md:flex md:gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Buscar por nombre o código
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 p-2 border border-slate-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Rubro</label>
            <select
              className="w-full p-2 border border-slate-300 rounded-md bg-white"
              value={filterRubro}
              onChange={(e) => setFilterRubro(e.target.value)}
            >
              <option value="todos">Todos los Rubros</option>
              {rubrosUnicos.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTramites.map((tramite) => {
              const organismo = organismos.find((o) => o.id === tramite.organismo_id);
              return (
                <div
                  key={tramite.id}
                  onClick={() => setSelectedTramite(tramite)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <h3 className="font-semibold text-blue-700 mb-1">{tramite.nombre}</h3>
                  <p className="text-sm text-slate-500 mb-3">{tramite.codigo}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                      {organismo?.sigla}
                    </span>
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {tramite.rubro}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    <strong>SLA:</strong> {tramite.sla_total_dias} días
                  </p>
                  {tramite.es_habilitacion_previa && (
                    <span className="inline-block mt-2 text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Habilitación Previa
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredTramites.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p>No se encontraron trámites con los filtros seleccionados</p>
          </div>
        )}
      </div>

      {selectedTramite && (
        <TramiteDetailModal
          tramite={selectedTramite}
          organismos={organismos}
          onClose={() => setSelectedTramite(null)}
        />
      )}

      {showCreateModal && (
        <TramiteTipoFormModal
          organismos={organismos}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function TramiteDetailModal({
  tramite,
  organismos,
  onClose
}: {
  tramite: TramiteTipo;
  organismos: Organismo[];
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'checklist' | 'pasos'>('info');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [pasos, setPasos] = useState<Paso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTramiteDetails();
  }, [tramite.id]);

  const loadTramiteDetails = async () => {
    setLoading(true);

    const [checklistRes, pasosRes] = await Promise.all([
      supabase
        .from('tramite_checklists')
        .select('*')
        .eq('tramite_tipo_id', tramite.id)
        .order('grupo'),
      supabase.from('procedure_stages').select('*').eq('tramite_tipo_id', tramite.id).order('orden')
    ]);

    if (checklistRes.data) setChecklist(checklistRes.data);
    if (pasosRes.data) setPasos(pasosRes.data);

    setLoading(false);
  };

  const organismo = organismos.find((o) => o.id === tramite.organismo_id);

  const checklistByGroup = useMemo(() => {
    const grouped: Record<string, ChecklistItem[]> = {};
    checklist.forEach((item) => {
      const grupo = item.grupo || 'General';
      if (!grouped[grupo]) grouped[grupo] = [];
      grouped[grupo].push(item);
    });
    return grouped;
  }, [checklist]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-start p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{tramite.nombre}</h2>
            <p className="text-sm text-slate-500 mt-1">{tramite.codigo}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'info'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Info className="w-4 h-4" />
              Información
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'checklist'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Checklist ({checklist.length})
            </button>
            <button
              onClick={() => setActiveTab('pasos')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'pasos'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
              Pasos ({pasos.length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="block text-slate-500 mb-1">Organismo:</strong>
                    <p className="text-slate-800">
                      {organismo?.nombre} ({organismo?.sigla})
                    </p>
                  </div>
                  <div>
                    <strong className="block text-slate-500 mb-1">Rubro:</strong>
                    <p className="text-slate-800">{tramite.rubro}</p>
                  </div>
                  <div>
                    <strong className="block text-slate-500 mb-1">SLA Estimado:</strong>
                    <p className="text-slate-800">{tramite.sla_total_dias} días</p>
                  </div>
                  <div>
                    <strong className="block text-slate-500 mb-1">Renovación:</strong>
                    <p className="text-slate-800">{tramite.renovacion}</p>
                  </div>
                  <div className="col-span-2">
                    <strong className="block text-slate-500 mb-1">Base Legal:</strong>
                    <p className="text-slate-800">{tramite.base_legal?.join(', ') || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <strong className="block text-slate-500 mb-1">Lógica Especial:</strong>
                    <p className="text-slate-800">{tramite.logica_especial || 'N/A'}</p>
                  </div>
                  <div>
                    <strong className="block text-slate-500 mb-1">Habilitación Previa:</strong>
                    <p className="text-slate-800">{tramite.es_habilitacion_previa ? 'Sí' : 'No'}</p>
                  </div>
                  <div>
                    <strong className="block text-slate-500 mb-1">Admite Equivalencia:</strong>
                    <p className="text-slate-800">{tramite.admite_equivalencia ? 'Sí' : 'No'}</p>
                  </div>
                </div>
              )}

              {activeTab === 'checklist' && (
                <div className="space-y-6">
                  {Object.entries(checklistByGroup).map(([grupoNombre, items]) => (
                    <div key={grupoNombre}>
                      <h4 className="font-semibold text-slate-800 mb-3 text-lg">{grupoNombre}</h4>
                      <ul className="space-y-2">
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start gap-3 p-3 bg-slate-50 rounded-md border border-slate-200"
                          >
                            <CheckSquare
                              className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                                item.obligatorio ? 'text-red-600' : 'text-slate-400'
                              }`}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">{item.item}</p>
                              {item.obligatorio && (
                                <span className="text-xs text-red-600 font-semibold">
                                  * Obligatorio
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {checklist.length === 0 && (
                    <p className="text-center text-slate-500 py-8">
                      No hay checklist definido para este trámite
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'pasos' && (
                <div>
                  {pasos.length > 0 ? (
                    <ol className="space-y-3">
                      {pasos.map((paso) => (
                        <li
                          key={paso.id}
                          className="flex gap-4 p-4 bg-slate-50 rounded-md border border-slate-200"
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold flex-shrink-0">
                            {paso.orden}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{paso.nombre}</p>
                            <p className="text-sm text-slate-600 mt-1">
                              Responsable: <span className="font-medium">{paso.rol_responsable}</span>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-center text-slate-500 py-8">
                      No hay pasos definidos para este trámite
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
