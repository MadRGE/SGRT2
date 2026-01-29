import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  FileText,
  Package,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Edit,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { ANMATTabProductos } from './ANMATTabProductos';
import { ANMATTabFamilias } from './ANMATTabFamilias';
import { ANMATTabDocumentos } from './ANMATTabDocumentos';
import { ANMATTabComunicaciones } from './ANMATTabComunicaciones';

interface Props {
  casoId: string;
  onBack: () => void;
}

interface CasoDetail {
  id: string;
  numero_caso: string;
  referencia_cliente: string | null;
  descripcion_cliente: string | null;
  estado: string;
  prioridad: number;
  es_urgente: boolean;
  cantidad_skus: number | null;
  cantidad_familias_estimada: number | null;
  cantidad_familias_final: number | null;
  fecha_ingreso_puerto: string | null;
  fecha_inicio_gestion: string | null;
  fecha_fin_estimada: string | null;
  presupuesto_aprobado: boolean;
  facturado: boolean;
  cobrado: boolean;
  notas: string | null;
  notas_internas: string | null;
  created_at: string;
  updated_at: string;
  empresa: {
    id: string;
    razon_social: string;
    nombre_fantasia: string | null;
    cuit: string;
  };
  division: {
    id: string;
    codigo: string;
    nombre: string;
  } | null;
  tramite_catalogo: {
    id: string;
    codigo: string;
    nombre: string;
  } | null;
}

const ESTADOS_CONFIG: Record<string, { label: string; color: string; bg: string; next: string[] }> = {
  INTAKE: { label: 'Intake', color: 'text-slate-700', bg: 'bg-slate-100', next: ['EVALUACION', 'CANCELADO'] },
  EVALUACION: { label: 'Evaluación', color: 'text-blue-700', bg: 'bg-blue-100', next: ['PRESUPUESTADO', 'CANCELADO'] },
  PRESUPUESTADO: { label: 'Presupuestado', color: 'text-purple-700', bg: 'bg-purple-100', next: ['APROBADO', 'CANCELADO'] },
  APROBADO: { label: 'Aprobado', color: 'text-indigo-700', bg: 'bg-indigo-100', next: ['EN_CURSO'] },
  EN_CURSO: { label: 'En Curso', color: 'text-cyan-700', bg: 'bg-cyan-100', next: ['ESPERANDO_CLIENTE', 'ESPERANDO_ANMAT', 'COMPLETADO', 'SUSPENDIDO'] },
  ESPERANDO_CLIENTE: { label: 'Esperando Cliente', color: 'text-yellow-700', bg: 'bg-yellow-100', next: ['EN_CURSO', 'CANCELADO'] },
  ESPERANDO_ANMAT: { label: 'Esperando ANMAT', color: 'text-orange-700', bg: 'bg-orange-100', next: ['EN_CURSO', 'OBSERVADO', 'COMPLETADO'] },
  OBSERVADO: { label: 'Observado', color: 'text-red-700', bg: 'bg-red-100', next: ['EN_CURSO', 'ESPERANDO_ANMAT'] },
  COMPLETADO: { label: 'Completado', color: 'text-green-700', bg: 'bg-green-100', next: [] },
  CANCELADO: { label: 'Cancelado', color: 'text-gray-700', bg: 'bg-gray-100', next: [] },
  SUSPENDIDO: { label: 'Suspendido', color: 'text-gray-700', bg: 'bg-gray-200', next: ['EN_CURSO', 'CANCELADO'] }
};

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: FileText },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'familias', label: 'Familias', icon: Users },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'comunicaciones', label: 'Comunicaciones', icon: MessageSquare }
];

export function ANMATCasoDetail({ casoId, onBack }: Props) {
  const [caso, setCaso] = useState<CasoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');
  const [showEstadoMenu, setShowEstadoMenu] = useState(false);
  const [updatingEstado, setUpdatingEstado] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    productosTotal: 0,
    familiasTotal: 0,
    docsPendientes: 0,
    docsValidados: 0
  });

  useEffect(() => {
    loadCaso();
    loadStats();
  }, [casoId]);

  const loadCaso = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('anmat_casos')
      .select(`
        *,
        empresa:empresas(id, razon_social, nombre_fantasia, cuit),
        division:anmat_divisiones(id, codigo, nombre),
        tramite_catalogo:tramites_catalogo(id, codigo, nombre)
      `)
      .eq('id', casoId)
      .single();

    if (error) {
      console.error('Error loading caso:', error);
    } else {
      setCaso(data as any);
    }

    setLoading(false);
  };

  const loadStats = async () => {
    const [productosRes, familiasRes, docsRes] = await Promise.all([
      supabase.from('anmat_caso_productos').select('id', { count: 'exact' }).eq('caso_id', casoId),
      supabase.from('anmat_familias').select('id', { count: 'exact' }).eq('caso_id', casoId),
      supabase.from('anmat_documentos').select('id, estado').eq('caso_id', casoId)
    ]);

    setStats({
      productosTotal: productosRes.count || 0,
      familiasTotal: familiasRes.count || 0,
      docsPendientes: docsRes.data?.filter(d => d.estado === 'PENDIENTE').length || 0,
      docsValidados: docsRes.data?.filter(d => d.estado === 'VALIDADO').length || 0
    });
  };

  const handleChangeEstado = async (nuevoEstado: string) => {
    if (!caso) return;

    setUpdatingEstado(true);

    const { error } = await supabase
      .from('anmat_casos')
      .update({ estado: nuevoEstado })
      .eq('id', casoId);

    if (error) {
      alert('Error al cambiar estado: ' + error.message);
    } else {
      await loadCaso();
    }

    setUpdatingEstado(false);
    setShowEstadoMenu(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading || !caso) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const estadoConfig = ESTADOS_CONFIG[caso.estado] || ESTADOS_CONFIG.INTAKE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="mt-1 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{caso.numero_caso}</h1>
              {caso.es_urgente && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  URGENTE
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {caso.empresa.nombre_fantasia || caso.empresa.razon_social}
              </span>
              {caso.division && (
                <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                  {caso.division.nombre}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Estado dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowEstadoMenu(!showEstadoMenu)}
              disabled={updatingEstado}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${estadoConfig.bg} ${estadoConfig.color}`}
            >
              {updatingEstado ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : null}
              {estadoConfig.label}
              {estadoConfig.next.length > 0 && (
                <MoreVertical className="w-4 h-4" />
              )}
            </button>

            {showEstadoMenu && estadoConfig.next.length > 0 && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                <p className="px-3 py-2 text-xs text-slate-500 border-b">Cambiar estado a:</p>
                {estadoConfig.next.map(nextEstado => {
                  const nextConfig = ESTADOS_CONFIG[nextEstado];
                  return (
                    <button
                      key={nextEstado}
                      onClick={() => handleChangeEstado(nextEstado)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                    >
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${nextConfig.bg}`}></span>
                      {nextConfig.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <Edit className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.productosTotal}</p>
              <p className="text-sm text-slate-600">Productos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.familiasTotal}</p>
              <p className="text-sm text-slate-600">Familias</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.docsPendientes}</p>
              <p className="text-sm text-slate-600">Docs Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.docsValidados}</p>
              <p className="text-sm text-slate-600">Docs Validados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">Información del Caso</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Número:</span>
                      <span className="font-mono font-medium">{caso.numero_caso}</span>
                    </div>
                    {caso.referencia_cliente && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Referencia Cliente:</span>
                        <span className="font-medium">{caso.referencia_cliente}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">División:</span>
                      <span className="font-medium">{caso.division?.nombre || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">SKUs:</span>
                      <span className="font-medium">{caso.cantidad_skus || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Familias:</span>
                      <span className="font-medium">{caso.cantidad_familias_final || caso.cantidad_familias_estimada || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">Fechas</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Creado:</span>
                      <span className="font-medium">{formatDate(caso.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Última actualización:</span>
                      <span className="font-medium">{formatDate(caso.updated_at)}</span>
                    </div>
                    {caso.fecha_ingreso_puerto && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Ingreso Puerto:</span>
                        <span className="font-medium text-orange-600">{formatDate(caso.fecha_ingreso_puerto)}</span>
                      </div>
                    )}
                    {caso.fecha_inicio_gestion && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Inicio Gestión:</span>
                        <span className="font-medium">{formatDate(caso.fecha_inicio_gestion)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {caso.descripcion_cliente && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-800">Descripción del Cliente</h3>
                  <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
                    {caso.descripcion_cliente}
                  </p>
                </div>
              )}

              {/* Facturación */}
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-800">Estado Comercial</h3>
                <div className="flex gap-4">
                  <div className={`px-4 py-2 rounded-lg text-sm ${caso.presupuesto_aprobado ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {caso.presupuesto_aprobado ? '✓ Presupuesto Aprobado' : '○ Presupuesto Pendiente'}
                  </div>
                  <div className={`px-4 py-2 rounded-lg text-sm ${caso.facturado ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {caso.facturado ? '✓ Facturado' : '○ Sin Facturar'}
                  </div>
                  <div className={`px-4 py-2 rounded-lg text-sm ${caso.cobrado ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {caso.cobrado ? '✓ Cobrado' : '○ Pendiente Cobro'}
                  </div>
                </div>
              </div>

              {/* Notas */}
              {(caso.notas || caso.notas_internas) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {caso.notas && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-slate-800">Notas</h3>
                      <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
                        {caso.notas}
                      </p>
                    </div>
                  )}
                  {caso.notas_internas && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-slate-800">Notas Internas</h3>
                      <p className="text-sm text-slate-600 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        {caso.notas_internas}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'productos' && (
            <ANMATTabProductos casoId={casoId} divisionId={caso.division?.id} />
          )}

          {activeTab === 'familias' && (
            <ANMATTabFamilias casoId={casoId} />
          )}

          {activeTab === 'documentos' && (
            <ANMATTabDocumentos casoId={casoId} tramiteCatalogoId={caso.tramite_catalogo?.id} />
          )}

          {activeTab === 'comunicaciones' && (
            <ANMATTabComunicaciones casoId={casoId} />
          )}
        </div>
      </div>
    </div>
  );
}
