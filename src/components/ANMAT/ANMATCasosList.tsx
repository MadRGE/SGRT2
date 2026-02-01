import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Package,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { ANMATCasoCreationModal } from './ANMATCasoCreationModal';
import { ANMATCasoDetail } from './ANMATCasoDetail';

interface ANMATCaso {
  id: string;
  estado: string;
  es_urgente: boolean;
  descripcion_cliente: string | null;
  referencia_cliente: string | null;
  fuente_contacto: string | null;
  cantidad_skus: number | null;
  fecha_ingreso_puerto: string | null;
  datos_especificos: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  // From view joins
  cliente_id: string;
  cliente_razon_social: string;
  cliente_cuit: string;
  division_id: string;
  division_codigo: string;
  division_nombre: string;
  asignado_id: string | null;
  asignado_nombre: string | null;
  total_productos: number;
  total_familias: number;
  total_documentos: number;
}

const ESTADOS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  INTAKE: { label: 'Intake', color: 'text-slate-700', bg: 'bg-slate-100' },
  EVALUACION: { label: 'Evaluación', color: 'text-blue-700', bg: 'bg-blue-100' },
  PRESUPUESTADO: { label: 'Presupuestado', color: 'text-purple-700', bg: 'bg-purple-100' },
  APROBADO: { label: 'Aprobado', color: 'text-indigo-700', bg: 'bg-indigo-100' },
  EN_CURSO: { label: 'En Curso', color: 'text-cyan-700', bg: 'bg-cyan-100' },
  ESPERANDO_CLIENTE: { label: 'Esperando Cliente', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  ESPERANDO_ANMAT: { label: 'Esperando ANMAT', color: 'text-orange-700', bg: 'bg-orange-100' },
  OBSERVADO: { label: 'Observado', color: 'text-red-700', bg: 'bg-red-100' },
  COMPLETADO: { label: 'Completado', color: 'text-green-700', bg: 'bg-green-100' },
  CANCELADO: { label: 'Cancelado', color: 'text-gray-700', bg: 'bg-gray-100' },
  SUSPENDIDO: { label: 'Suspendido', color: 'text-gray-700', bg: 'bg-gray-200' }
};

export function ANMATCasosList() {
  const [casos, setCasos] = useState<ANMATCaso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [filterDivision, setFilterDivision] = useState<string>('');
  const [divisiones, setDivisiones] = useState<{ id: string; codigo: string; nombre: string }[]>([]);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [selectedCasoId, setSelectedCasoId] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    enCurso: 0,
    esperandoCliente: 0,
    completados: 0
  });

  useEffect(() => {
    loadDivisiones();
    loadCasos();
  }, [filterEstado, filterDivision]);

  const loadDivisiones = async () => {
    const { data } = await supabase
      .from('anmat_divisiones')
      .select('id, codigo, nombre')
      .eq('activo', true)
      .order('nombre');

    if (data) setDivisiones(data);
  };

  const loadCasos = async () => {
    setLoading(true);

    let query = supabase
      .from('v_anmat_dashboard')
      .select('*')
      .order('updated_at', { ascending: false });

    if (filterEstado) {
      query = query.eq('estado', filterEstado);
    }

    if (filterDivision) {
      query = query.eq('division_codigo', filterDivision);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading casos:', error);
    } else if (data) {
      setCasos(data as any);

      // Calculate stats
      setStats({
        total: data.length,
        enCurso: data.filter(c => ['EN_CURSO', 'ESPERANDO_ANMAT'].includes(c.estado)).length,
        esperandoCliente: data.filter(c => c.estado === 'ESPERANDO_CLIENTE').length,
        completados: data.filter(c => c.estado === 'COMPLETADO').length
      });
    }

    setLoading(false);
  };

  const filteredCasos = casos.filter(caso => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      caso.id?.toLowerCase().includes(search) ||
      caso.referencia_cliente?.toLowerCase().includes(search) ||
      caso.cliente_razon_social?.toLowerCase().includes(search) ||
      caso.cliente_cuit?.includes(search)
    );
  });

  const getEstadoBadge = (estado: string) => {
    const config = ESTADOS_CONFIG[estado] || ESTADOS_CONFIG.INTAKE;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short'
    });
  };

  if (selectedCasoId) {
    return (
      <ANMATCasoDetail
        casoId={selectedCasoId}
        onBack={() => {
          setSelectedCasoId(null);
          loadCasos();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestoría ANMAT</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestión de trámites INAL, Cosméticos, Domisanitarios y Productos Médicos
          </p>
        </div>
        <button
          onClick={() => setShowCreationModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Nuevo Caso
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-600">Total Casos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.enCurso}</p>
              <p className="text-sm text-slate-600">En Curso</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.esperandoCliente}</p>
              <p className="text-sm text-slate-600">Esperando Cliente</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.completados}</p>
              <p className="text-sm text-slate-600">Completados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por número, referencia o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las divisiones</option>
            {divisiones.map(div => (
              <option key={div.id} value={div.codigo}>{div.nombre}</option>
            ))}
          </select>

          <button
            onClick={loadCasos}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Cases List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCasos.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No hay casos que mostrar</p>
            <p className="text-sm text-slate-500 mt-1">
              Crea un nuevo caso para comenzar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Caso</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Empresa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">División</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">SKUs</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Familias</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Estado</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Docs</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actualizado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCasos.map((caso) => (
                  <tr
                    key={caso.id}
                    onClick={() => setSelectedCasoId(caso.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {caso.es_urgente && (
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-mono font-medium text-slate-900 text-xs">{caso.id.slice(0, 8)}</p>
                          {caso.referencia_cliente && (
                            <p className="text-xs text-slate-500">{caso.referencia_cliente}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700 truncate max-w-[200px]">
                          {caso.cliente_razon_social}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-600">{caso.division_nombre || '—'}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-medium text-slate-700">
                        {caso.cantidad_skus || caso.total_productos || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-medium text-slate-700">
                        {caso.total_familias || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getEstadoBadge(caso.estado)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm text-slate-600">
                        {caso.total_documentos || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-slate-500">
                      {formatDate(caso.updated_at)}
                    </td>
                    <td className="px-4 py-4">
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showCreationModal && (
        <ANMATCasoCreationModal
          onClose={() => setShowCreationModal(false)}
          onSuccess={(casoId) => {
            setShowCreationModal(false);
            setSelectedCasoId(casoId);
          }}
        />
      )}
    </div>
  );
}
