import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TRAMITE_ESTADO_LABELS as ESTADO_LABELS } from '../lib/constants/estados';
import { Download, ArrowLeft, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const downloadCSV = (csvContent: string, fileName: string) => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default function Reportes({ onBack }: Props) {
  const [stats, setStats] = useState({
    diasPromedioTramitacion: 0,
    tasaAprobacion: 0,
    observacionesFrecuentes: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: tramites } = await supabase
      .from('tramites')
      .select('estado, created_at');

    if (tramites && tramites.length > 0) {
      const now = new Date();
      const tiempos = tramites
        .map((t) => {
          const inicio = new Date(t.created_at);
          return Math.floor((now.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
        })
        .filter((dias) => dias > 0);

      const promedio = tiempos.length > 0 ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : 0;

      const aprobados = tramites.filter((t) => t.estado === 'aprobado').length;
      const observados = tramites.filter((t) => t.estado === 'observado').length;
      const total = tramites.length;

      setStats({
        diasPromedioTramitacion: Math.round(promedio),
        tasaAprobacion: total > 0 ? Math.round((aprobados / total) * 100) : 0,
        observacionesFrecuentes: total > 0 ? Math.round((observados / total) * 100) : 0
      });
    }
  };

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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Reportes y Análisis</h1>
          <p className="text-slate-600 mt-1">
            Genera y exporta informes clave sobre la operación del sistema.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Reporte de Productividad</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-4xl font-bold text-blue-600">
                {stats.diasPromedioTramitacion}
              </p>
              <p className="text-sm text-slate-600 mt-1">Días Promedio de Tramitación</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-4xl font-bold text-green-600">{stats.tasaAprobacion}%</p>
              <p className="text-sm text-slate-600 mt-1">Tasa de Aprobación</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <TrendingUp className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-4xl font-bold text-yellow-600">
                {stats.observacionesFrecuentes}%
              </p>
              <p className="text-sm text-slate-600 mt-1">Tasa de Observaciones</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ReporteTramites />
          <ReporteFinanciero />
        </div>
      </div>
    </div>
  );
}

function ReporteTramites() {
  const [loading, setLoading] = useState(false);
  const [filterCliente, setFilterCliente] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterOrganismo, setFilterOrganismo] = useState('todos');
  const [clientes, setClientes] = useState<{ id: string; razon_social: string }[]>([]);
  const [organismos, setOrganismos] = useState<string[]>([]);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    const [clientesRes, orgRes] = await Promise.all([
      supabase.from('clientes').select('id, razon_social').order('razon_social'),
      supabase.from('tramites').select('organismo').not('organismo', 'is', null),
    ]);

    if (clientesRes.data) setClientes(clientesRes.data);
    if (orgRes.data) {
      const unique = [...new Set(orgRes.data.map((t: { organismo: string | null }) => t.organismo).filter(Boolean))] as string[];
      setOrganismos(unique.sort());
    }
  };

  const generarReporte = async () => {
    setLoading(true);

    let query = supabase
      .from('tramites')
      .select(`
        id, titulo, organismo, estado, fecha_vencimiento, monto_presupuesto, created_at,
        clientes(razon_social),
        gestiones(nombre)
      `)
      .order('created_at', { ascending: false });

    if (filterEstado !== 'todos') {
      query = query.eq('estado', filterEstado);
    }
    if (filterCliente !== 'todos') {
      query = query.eq('cliente_id', filterCliente);
    }
    if (filterOrganismo !== 'todos') {
      query = query.eq('organismo', filterOrganismo);
    }

    const { data: tramites } = await query;

    if (tramites) {
      let csvContent = 'Gestion,Cliente,Titulo_Tramite,Organismo,Estado,Fecha_Vencimiento,Presupuesto\n';

      const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
      tramites.forEach((t: any) => {
        const row = [
          esc(t.gestiones?.nombre || 'Sin gestión'),
          esc(t.clientes?.razon_social || 'N/A'),
          esc(t.titulo || ''),
          esc(t.organismo || 'N/A'),
          esc(ESTADO_LABELS[t.estado] || t.estado),
          t.fecha_vencimiento ? new Date(t.fecha_vencimiento).toLocaleDateString('es-AR') : 'N/A',
          t.monto_presupuesto != null ? t.monto_presupuesto : 'N/A',
        ].join(',');
        csvContent += row + '\n';
      });

      downloadCSV(csvContent, `Reporte_Tramites_SGRT_${new Date().toISOString().split('T')[0]}.csv`);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Reporte General de Trámites
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Cliente</label>
          <select
            className="w-full p-2 border border-slate-300 rounded-md bg-white"
            value={filterCliente}
            onChange={(e) => setFilterCliente(e.target.value)}
          >
            <option value="todos">Todos</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razon_social}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Estado</label>
          <select
            className="w-full p-2 border border-slate-300 rounded-md bg-white"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            {Object.entries(ESTADO_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Organismo</label>
          <select
            className="w-full p-2 border border-slate-300 rounded-md bg-white"
            value={filterOrganismo}
            onChange={(e) => setFilterOrganismo(e.target.value)}
          >
            <option value="todos">Todos</option>
            {organismos.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={generarReporte}
        disabled={loading}
        className="w-full bg-blue-600 text-white p-3 rounded-md disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <Download className="w-5 h-5" />
        {loading ? 'Generando...' : 'Descargar Reporte de Trámites (CSV)'}
      </button>
    </div>
  );
}

function ReporteFinanciero() {
  const [loading, setLoading] = useState(false);
  const [filterEstado, setFilterEstado] = useState('todos');

  const generarReporte = async () => {
    setLoading(true);

    let query = supabase
      .from('tramites')
      .select(`
        id, titulo, estado, monto_presupuesto, created_at,
        clientes(razon_social),
        gestiones(nombre)
      `)
      .not('monto_presupuesto', 'is', null)
      .order('created_at', { ascending: false });

    if (filterEstado !== 'todos') {
      query = query.eq('estado', filterEstado);
    }

    const { data: tramites } = await query;

    if (tramites) {
      let csvContent = 'Gestion,Cliente,Tramite,Estado,Monto_Presupuesto,Fecha_Creacion\n';

      const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
      tramites.forEach((t: any) => {
        const row = [
          esc(t.gestiones?.nombre || 'Sin gestión'),
          esc(t.clientes?.razon_social || 'N/A'),
          esc(t.titulo || ''),
          esc(ESTADO_LABELS[t.estado] || t.estado),
          t.monto_presupuesto != null ? t.monto_presupuesto : 0,
          new Date(t.created_at).toLocaleDateString('es-AR'),
        ].join(',');
        csvContent += row + '\n';
      });

      downloadCSV(csvContent, `Reporte_Financiero_SGRT_${new Date().toISOString().split('T')[0]}.csv`);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Reporte Financiero (Presupuestos de Trámites)
      </h3>
      <div className="mb-4">
        <label className="text-sm font-medium text-slate-700 block mb-2">
          Filtrar por Estado
        </label>
        <select
          className="w-full p-2 border border-slate-300 rounded-md bg-white"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="todos">Todos</option>
          {Object.entries(ESTADO_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>
      <button
        onClick={generarReporte}
        disabled={loading}
        className="w-full bg-green-600 text-white p-3 rounded-md disabled:opacity-50 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
      >
        <Download className="w-5 h-5" />
        {loading ? 'Generando...' : 'Descargar Reporte Financiero (CSV)'}
      </button>
    </div>
  );
}
