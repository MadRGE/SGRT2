import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  DollarSign, FileText, TrendingUp, Landmark, Users, ArrowLeft, Loader2
} from 'lucide-react';
import GestionFacturacion from './Finanzas/GestionFacturacion';
import GestionProveedores from './Finanzas/GestionProveedores';

interface Props {
  onBack: () => void;
  onViewProyecto: (proyectoId: string) => void;
}

const ESTADO_LABELS: Record<string, string> = {
  consulta: 'Consulta', presupuestado: 'Presupuestado', en_curso: 'En Curso',
  esperando_cliente: 'Esp. Cliente', esperando_organismo: 'Esp. Organismo',
  observado: 'Observado', aprobado: 'Aprobado', rechazado: 'Rechazado', vencido: 'Vencido',
};

const ESTADO_COLORS: Record<string, string> = {
  consulta: 'bg-slate-100 text-slate-700', presupuestado: 'bg-purple-100 text-purple-700',
  en_curso: 'bg-blue-100 text-blue-700', esperando_cliente: 'bg-yellow-100 text-yellow-700',
  esperando_organismo: 'bg-orange-100 text-orange-700', observado: 'bg-red-100 text-red-700',
  aprobado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700', vencido: 'bg-red-100 text-red-700',
};

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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);

    const { data: tramites } = await supabase
      .from('tramites')
      .select('estado, monto_presupuesto, created_at')
      .not('monto_presupuesto', 'is', null);

    if (tramites) {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const aprobadosEsteMes = tramites.filter((t) => {
        if (t.estado !== 'aprobado') return false;
        const fecha = new Date(t.created_at);
        return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
      });

      const ingresosMes = aprobadosEsteMes.reduce((sum, t) => sum + (t.monto_presupuesto || 0), 0);
      const totalPresupuestado = tramites.reduce((sum, t) => sum + (t.monto_presupuesto || 0), 0);
      const presupuestosAprobados = aprobadosEsteMes.length;
      const presupuestosPendientes = tramites.filter((t) => t.estado === 'presupuestado').length;

      setStats({
        ingresosMes,
        totalPresupuestado,
        presupuestosAprobados,
        presupuestosPendientes,
        totalTramites: tramites.length,
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Aprobados (Mes)</p>
              <p className="text-2xl font-bold text-slate-900">
                ${stats.ingresosMes.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Landmark className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Presupuestado</p>
              <p className="text-2xl font-bold text-slate-900">
                ${stats.totalPresupuestado.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Trámites con Presup.</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalTramites}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Resumen de Presupuestos</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-700">Aprobados este mes</p>
            <p className="text-3xl font-bold text-blue-900">{stats.presupuestosAprobados}</p>
          </div>
          <div>
            <p className="text-sm text-blue-700">Pendientes (presupuestado)</p>
            <p className="text-3xl font-bold text-blue-900">{stats.presupuestosPendientes}</p>
          </div>
        </div>
      </div>
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ESTADO_COLORS[t.estado] || 'bg-slate-100 text-slate-700'}`}>
                    {ESTADO_LABELS[t.estado] || t.estado}
                  </span>
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
