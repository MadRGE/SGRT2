import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  DollarSign, FileText, TrendingUp, TrendingDown, Landmark, Users, ArrowLeft
} from 'lucide-react';
import GestionFacturacion from './Finanzas/GestionFacturacion';
import GestionProveedores from './Finanzas/GestionProveedores';

interface Props {
  onBack: () => void;
  onViewProyecto: (proyectoId: string) => void;
}

interface PresupuestoResumen {
  id: string;
  proyecto_id: string;
  estado: string;
  total_final: number;
  fecha_envio: string | null;
  proyectos: {
    nombre_proyecto: string;
    clientes: {
      razon_social: string;
    };
  };
}

interface FinancialStats {
  ingresosMes: number;
  gastosMes: number;
  balance: number;
  presupuestosAprobados: number;
  presupuestosPendientes: number;
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
          {activeTab === 'presupuestos' && <GestionPresupuestos onViewProyecto={onViewProyecto} />}
          {activeTab === 'facturacion' && <GestionFacturacion onViewProyecto={onViewProyecto} />}
          {activeTab === 'proveedores' && <GestionProveedores />}
        </div>
      </div>
    </div>
  );
}

function DashboardFinanciero() {
  const [stats, setStats] = useState<FinancialStats>({
    ingresosMes: 0,
    gastosMes: 0,
    balance: 0,
    presupuestosAprobados: 0,
    presupuestosPendientes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);

    const { data: presupuestos } = await supabase
      .from('presupuestos')
      .select('estado, total_final, fecha_envio');

    if (presupuestos) {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const aprobadosEsteMes = presupuestos.filter((p: any) => {
        if (p.estado !== 'aprobado' || !p.fecha_envio) return false;
        const fecha = new Date(p.fecha_envio);
        return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
      });

      const ingresosMes = aprobadosEsteMes.reduce((sum: number, p: any) => sum + (p.total_final || 0), 0);

      const gastosMes = ingresosMes * 0.3;

      const balance = ingresosMes - gastosMes;

      const presupuestosAprobados = aprobadosEsteMes.length;
      const presupuestosPendientes = presupuestos.filter((p: any) => p.estado === 'borrador').length;

      setStats({
        ingresosMes,
        gastosMes,
        balance,
        presupuestosAprobados,
        presupuestosPendientes
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <p className="text-sm text-slate-500 font-medium">Ingresos (Mes)</p>
              <p className="text-2xl font-bold text-slate-900">
                ${stats.ingresosMes.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Gastos (Mes)</p>
              <p className="text-2xl font-bold text-slate-900">
                ${stats.gastosMes.toLocaleString('es-AR')}
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
              <p className="text-sm text-slate-500 font-medium">Balance (Mes)</p>
              <p className="text-2xl font-bold text-slate-900">
                ${stats.balance.toLocaleString('es-AR')}
              </p>
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
            <p className="text-sm text-blue-700">Pendientes de envío</p>
            <p className="text-3xl font-bold text-blue-900">{stats.presupuestosPendientes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GestionPresupuestos({ onViewProyecto }: { onViewProyecto: (proyectoId: string) => void }) {
  const [presupuestos, setPresupuestos] = useState<PresupuestoResumen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresupuestos();
  }, []);

  const loadPresupuestos = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('presupuestos')
      .select(`
        *,
        proyectos (
          nombre_proyecto,
          clientes (razon_social)
        )
      `)
      .order('created_at', { ascending: false });

    if (data) setPresupuestos(data as any);
    setLoading(false);
  };

  const getEstadoColor = (estado: string) => {
    if (estado === 'aprobado') return 'bg-green-100 text-green-800';
    if (estado === 'enviado') return 'bg-blue-100 text-blue-800';
    if (estado === 'rechazado') return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (presupuestos.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p>No hay presupuestos en el sistema</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">Gestión de Presupuestos</h3>
        <p className="text-sm text-slate-600 mt-1">
          Vista consolidada de todos los presupuestos del sistema
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-slate-700">Proyecto</th>
              <th className="p-3 text-left text-sm font-medium text-slate-700">Cliente</th>
              <th className="p-3 text-left text-sm font-medium text-slate-700">Estado</th>
              <th className="p-3 text-right text-sm font-medium text-slate-700">Monto Total</th>
              <th className="p-3 text-left text-sm font-medium text-slate-700">Fecha Envío</th>
            </tr>
          </thead>
          <tbody>
            {presupuestos.map((p) => (
              <tr
                key={p.id}
                className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onViewProyecto(p.proyecto_id)}
              >
                <td className="p-3">
                  <p className="font-medium text-blue-700">{p.proyectos.nombre_proyecto}</p>
                  <p className="text-xs text-slate-500">ID: {p.proyecto_id.substring(0, 8)}...</p>
                </td>
                <td className="p-3 text-sm text-slate-700">{p.proyectos.clientes.razon_social}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                      p.estado
                    )}`}
                  >
                    {p.estado}
                  </span>
                </td>
                <td className="p-3 text-right font-semibold text-slate-800">
                  ${p.total_final.toLocaleString('es-AR')}
                </td>
                <td className="p-3 text-sm text-slate-600">
                  {p.fecha_envio ? new Date(p.fecha_envio).toLocaleDateString('es-AR') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

