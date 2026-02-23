import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  TRAMITE_ESTADO_LABELS_SHORT as ESTADO_LABELS,
  TRAMITE_ESTADO_COLORS as ESTADO_COLORS,
} from '../lib/constants/estados';
import {
  DollarSign, FileText, TrendingUp, Landmark, Users, ArrowLeft, Loader2
} from 'lucide-react';
import GestionFacturacion from './Finanzas/GestionFacturacion';
import GestionProveedores from './Finanzas/GestionProveedores';
import StatusBadge from '../components/UI/StatusBadge';

interface Props {
  onBack: () => void;
  onViewProyecto: (proyectoId: string) => void;
}

export default function ModuloFinancieroContable({ onBack, onViewProyecto }: Props) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'presupuestos' | 'facturacion' | 'proveedores'>('dashboard');

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
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Módulo Financiero y Contable</h1>

        <div className="border-b border-slate-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Dashboard Financiero
            </button>
            <button
              onClick={() => setActiveTab('presupuestos')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'presupuestos'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Presupuestos
            </button>
            <button
              onClick={() => setActiveTab('facturacion')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'facturacion'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Landmark className="w-4 h-4" />
              Facturación
            </button>
            <button
              onClick={() => setActiveTab('proveedores')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'proveedores'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Proveedores
            </button>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === 'dashboard' && <DashboardFinanciero />}
          {activeTab === 'presupuestos' && <GestionPresupuestos onNavigate={onViewProyecto} />}
          {activeTab === 'facturacion' && <GestionFacturacion onViewProyecto={onViewProyecto} />}
          {activeTab === 'proveedores' && <GestionProveedores />}
        </div>
      </div>
    </div>
  );
}

function DashboardFinanciero() {
  const [stats, setStats] = useState({
    ingresosMes: 0,
    totalPresupuestado: 0,
    presupuestosAprobados: 0,
    presupuestosPendientes: 0,
    totalTramites: 0,
    cotizacionesEnviadas: 0,
    cotizacionesAceptadas: 0,
    cotizacionesMontoTotal: 0,
    gastosProveedoresMes: 0,
    gastosProveedoresTotal: 0,
    tramitesEnCurso: 0,
    tramitesAprobadosTotal: 0,
  });
  const [recentCotizaciones, setRecentCotizaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const primerDiaMes = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;

    // Tramites with budget
    const { data: tramites } = await supabase
      .from('tramites')
      .select('estado, monto_presupuesto, created_at')
      .not('monto_presupuesto', 'is', null);

    // Cotizaciones
    const { data: cotizaciones } = await supabase
      .from('cotizaciones')
      .select('id, estado, precio_final, precio_total, nombre_cliente, numero_cotizacion, created_at')
      .order('created_at', { ascending: false });

    // Gastos proveedores
    const { data: facturas } = await supabase
      .from('facturas_proveedores')
      .select('monto, fecha_factura');

    let ingresosMes = 0, totalPresupuestado = 0, presupuestosAprobados = 0;
    let presupuestosPendientes = 0, tramitesEnCurso = 0, tramitesAprobadosTotal = 0;

    if (tramites) {
      const aprobadosEsteMes = tramites.filter((t) => {
        if (t.estado !== 'aprobado') return false;
        const fecha = new Date(t.created_at);
        return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
      });
      ingresosMes = aprobadosEsteMes.reduce((sum, t) => sum + (t.monto_presupuesto || 0), 0);
      totalPresupuestado = tramites.reduce((sum, t) => sum + (t.monto_presupuesto || 0), 0);
      presupuestosAprobados = aprobadosEsteMes.length;
      presupuestosPendientes = tramites.filter((t) => t.estado === 'presupuestado').length;
      tramitesEnCurso = tramites.filter((t) => t.estado === 'en_curso').length;
      tramitesAprobadosTotal = tramites.filter((t) => t.estado === 'aprobado').length;
    }

    let cotizacionesEnviadas = 0, cotizacionesAceptadas = 0, cotizacionesMontoTotal = 0;
    if (cotizaciones) {
      cotizacionesEnviadas = cotizaciones.filter(c => c.estado === 'enviada' || c.estado === 'negociacion').length;
      cotizacionesAceptadas = cotizaciones.filter(c => c.estado === 'aceptada' || c.estado === 'convertida').length;
      cotizacionesMontoTotal = cotizaciones
        .filter(c => c.estado === 'aceptada' || c.estado === 'convertida')
        .reduce((sum, c) => sum + (c.precio_final || c.precio_total || 0), 0);
      setRecentCotizaciones(cotizaciones.slice(0, 5));
    }

    let gastosProveedoresMes = 0, gastosProveedoresTotal = 0;
    if (facturas) {
      gastosProveedoresTotal = facturas.reduce((sum, f) => sum + (f.monto || 0), 0);
      gastosProveedoresMes = facturas
        .filter(f => f.fecha_factura && f.fecha_factura >= primerDiaMes)
        .reduce((sum, f) => sum + (f.monto || 0), 0);
    }

    setStats({
      ingresosMes,
      totalPresupuestado,
      presupuestosAprobados,
      presupuestosPendientes,
      totalTramites: tramites?.length || 0,
      cotizacionesEnviadas,
      cotizacionesAceptadas,
      cotizacionesMontoTotal,
      gastosProveedoresMes,
      gastosProveedoresTotal,
      tramitesEnCurso,
      tramitesAprobadosTotal,
    });

    setLoading(false);
  };

  const COTIZ_ESTADO_COLOR: Record<string, string> = {
    borrador: 'bg-slate-100 text-slate-700',
    enviada: 'bg-blue-100 text-blue-700',
    negociacion: 'bg-yellow-100 text-yellow-700',
    aceptada: 'bg-green-100 text-green-700',
    rechazada: 'bg-red-100 text-red-700',
    vencida: 'bg-orange-100 text-orange-700',
    convertida: 'bg-emerald-100 text-emerald-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const margenNeto = stats.ingresosMes - stats.gastosProveedoresMes;

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Ingresos Mes</p>
              <p className="text-xl font-bold text-slate-900">
                ${stats.ingresosMes.toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-slate-400">{stats.presupuestosAprobados} aprobados</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Gastos Proveedores (Mes)</p>
              <p className="text-xl font-bold text-slate-900">
                ${stats.gastosProveedoresMes.toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-slate-400">Total: ${stats.gastosProveedoresTotal.toLocaleString('es-AR')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${margenNeto >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <Landmark className={`w-6 h-6 ${margenNeto >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Margen Neto (Mes)</p>
              <p className={`text-xl font-bold ${margenNeto >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                ${margenNeto.toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-slate-400">Ingresos - Gastos</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Presupuestado</p>
              <p className="text-xl font-bold text-slate-900">
                ${stats.totalPresupuestado.toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-slate-400">{stats.totalTramites} trámites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda fila: Cotizaciones + Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Pipeline de Cotizaciones</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700">Pendientes/Enviadas</p>
              <p className="text-3xl font-bold text-blue-900">{stats.cotizacionesEnviadas}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Aceptadas</p>
              <p className="text-3xl font-bold text-green-700">{stats.cotizacionesAceptadas}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Monto Aceptado</p>
              <p className="text-2xl font-bold text-green-700">${stats.cotizacionesMontoTotal.toLocaleString('es-AR')}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Estado Operativo</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-600">Presup. Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.presupuestosPendientes}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">En Curso</p>
              <p className="text-3xl font-bold text-blue-600">{stats.tramitesEnCurso}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Aprobados</p>
              <p className="text-3xl font-bold text-green-600">{stats.tramitesAprobadosTotal}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cotizaciones recientes */}
      {recentCotizaciones.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700">Últimas Cotizaciones</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {recentCotizaciones.map(c => (
              <div key={c.id} className="px-6 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.nombre_cliente}</p>
                  <p className="text-xs text-slate-400">{c.numero_cotizacion}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${COTIZ_ESTADO_COLOR[c.estado] || 'bg-slate-100 text-slate-600'}`}>
                  {c.estado}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  ${(c.precio_final || c.precio_total || 0).toLocaleString('es-AR')}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(c.created_at).toLocaleDateString('es-AR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TramitePresupuesto {
  id: string;
  titulo: string;
  estado: string;
  monto_presupuesto: number;
  gestion_id: string | null;
  created_at: string;
  clientes: { razon_social: string } | null;
  gestiones: { nombre: string } | null;
}

function GestionPresupuestos({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [tramites, setTramites] = useState<TramitePresupuesto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTramites();
  }, []);

  const loadTramites = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('tramites')
      .select(`
        id, titulo, estado, monto_presupuesto, gestion_id, created_at,
        clientes(razon_social),
        gestiones(nombre)
      `)
      .not('monto_presupuesto', 'is', null)
      .order('created_at', { ascending: false });

    if (data) setTramites(data as unknown as TramitePresupuesto[]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (tramites.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p>No hay trámites con presupuesto asignado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Presupuestos por Trámite</h3>
        <p className="text-sm text-slate-600 mt-1">
          Trámites con monto de presupuesto asignado
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-slate-700">Trámite</th>
              <th className="p-3 text-left text-sm font-medium text-slate-700">Gestión</th>
              <th className="p-3 text-left text-sm font-medium text-slate-700">Cliente</th>
              <th className="p-3 text-left text-sm font-medium text-slate-700">Estado</th>
              <th className="p-3 text-right text-sm font-medium text-slate-700">Presupuesto</th>
              <th className="p-3 text-left text-sm font-medium text-slate-700">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {tramites.map((t) => (
              <tr
                key={t.id}
                className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => t.gestion_id && onNavigate(t.gestion_id)}
              >
                <td className="p-3">
                  <p className="font-medium text-blue-700">{t.titulo}</p>
                </td>
                <td className="p-3 text-sm text-slate-700">
                  {t.gestiones?.nombre || 'Sin gestión'}
                </td>
                <td className="p-3 text-sm text-slate-700">
                  {t.clientes?.razon_social || 'N/A'}
                </td>
                <td className="p-3">
                  <StatusBadge
                    label={ESTADO_LABELS[t.estado] || t.estado}
                    colorClass={ESTADO_COLORS[t.estado]}
                  />
                </td>
                <td className="p-3 text-right font-semibold text-slate-800">
                  ${t.monto_presupuesto.toLocaleString('es-AR')}
                </td>
                <td className="p-3 text-sm text-slate-600">
                  {new Date(t.created_at).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
