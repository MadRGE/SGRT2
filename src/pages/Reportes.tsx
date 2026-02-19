import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
    const { data: expedientes } = await supabase
      .from('expedientes')
      .select('estado, fecha_inicio, fecha_finalizacion')
      .not('fecha_finalizacion', 'is', null);

    if (expedientes && expedientes.length > 0) {
      const tiempos = expedientes
        .map((exp) => {
          const inicio = new Date(exp.fecha_inicio);
          const fin = new Date(exp.fecha_finalizacion!);
          return Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
        })
        .filter((dias) => dias > 0);

      const promedio = tiempos.length > 0 ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : 0;

      const aprobados = expedientes.filter((e) => e.estado === 'aprobado').length;
      const observados = expedientes.filter((e) => e.estado === 'observado').length;
      const total = expedientes.length;

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
              <p className="text-sm text-slate-600 mt-1">Observaciones Frecuentes</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ReporteExpedientes />
          <ReporteFinanciero />
        </div>
      </div>
    </div>
  );
}

function ReporteExpedientes() {
  const [loading, setLoading] = useState(false);
  const [filterCliente, setFilterCliente] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterOrganismo, setFilterOrganismo] = useState('todos');
  const [clientes, setClientes] = useState<any[]>([]);
  const [organismos, setOrganismos] = useState<any[]>([]);

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    const [clientesRes, organismosRes] = await Promise.all([
      supabase.from('clientes').select('id, razon_social').order('razon_social'),
      supabase.from('organismos').select('id, sigla').order('sigla')
    ]);

    if (clientesRes.data) setClientes(clientesRes.data);
    if (organismosRes.data) setOrganismos(organismosRes.data);
  };

  const generarReporte = async () => {
    setLoading(true);

    let query = supabase
      .from('expedientes')
      .select(
        `
        id,
        codigo,
        nombre,
        estado,
        fecha_limite,
        proyectos (
          nombre_proyecto,
          clientes (razon_social)
        ),
        tramite_tipos (
          nombre,
          organismos (sigla)
        )
      `
      )
      .order('created_at', { ascending: false });

    if (filterEstado !== 'todos') {
      query = query.eq('estado', filterEstado);
    }

    const { data: expedientes } = await query;

    if (expedientes) {
      let filtered = expedientes;

      if (filterCliente !== 'todos') {
        filtered = filtered.filter(
          (exp: any) => exp.proyectos?.clientes?.id === filterCliente
        );
      }

      if (filterOrganismo !== 'todos') {
        filtered = filtered.filter(
          (exp: any) => exp.tramite_tipos?.organismos?.id === filterOrganismo
        );
      }

      let csvContent = '';
      csvContent += 'Proyecto,Cliente,Codigo_Expediente,Tramite,Organismo,Estado,Fecha_Limite\n';

      const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
      filtered.forEach((exp: any) => {
        const row = [
          esc(exp.proyectos?.nombre_proyecto || 'N/A'),
          esc(exp.proyectos?.clientes?.razon_social || 'N/A'),
          esc(exp.codigo || ''),
          esc(exp.tramite_tipos?.nombre || 'N/A'),
          esc(exp.tramite_tipos?.organismos?.sigla || 'N/A'),
          esc(exp.estado || ''),
          exp.fecha_limite ? new Date(exp.fecha_limite).toLocaleDateString('es-AR') : 'N/A'
        ].join(',');
        csvContent += row + '\n';
      });

      downloadCSV(csvContent, `Reporte_Expedientes_SGT_${new Date().toISOString().split('T')[0]}.csv`);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Reporte General de Proyectos y Expedientes
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
            <option value="iniciado">Iniciado</option>
            <option value="en_evaluacion">En Evaluación</option>
            <option value="observado">Observado</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
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
              <option key={o.id} value={o.id}>
                {o.sigla}
              </option>
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
        {loading ? 'Generando...' : 'Descargar Reporte de Expedientes (CSV)'}
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
      .from('presupuestos')
      .select(
        `
        id,
        total_final,
        estado,
        fecha_envio,
        proyectos (
          nombre_proyecto,
          clientes (razon_social)
        )
      `
      )
      .order('created_at', { ascending: false });

    if (filterEstado !== 'todos') {
      query = query.eq('estado', filterEstado);
    }

    const { data: presupuestos } = await query;

    if (presupuestos) {
      let csvContent = '';
      csvContent += 'Proyecto,Cliente,Estado_Presupuesto,Monto_Total,Fecha_Envio\n';

      const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
      presupuestos.forEach((p: any) => {
        const row = [
          esc(p.proyectos?.nombre_proyecto || 'N/A'),
          esc(p.proyectos?.clientes?.razon_social || 'N/A'),
          esc(p.estado || ''),
          p.total_final,
          p.fecha_envio ? new Date(p.fecha_envio).toLocaleDateString('es-AR') : 'N/A'
        ].join(',');
        csvContent += row + '\n';
      });

      downloadCSV(csvContent, `Reporte_Financiero_SGT_${new Date().toISOString().split('T')[0]}.csv`);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Reporte Financiero (Presupuestos)
      </h3>
      <div className="mb-4">
        <label className="text-sm font-medium text-slate-700 block mb-2">
          Filtrar por Estado de Presupuesto
        </label>
        <select
          className="w-full p-2 border border-slate-300 rounded-md bg-white"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="borrador">Borrador</option>
          <option value="enviado">Enviado</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
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
