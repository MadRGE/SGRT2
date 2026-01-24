import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { List, AlertTriangle, CheckCircle, FileText, ChevronRight, Package } from 'lucide-react';

interface Props {
  clienteId: string;
  onViewProyecto: (proyectoId: string) => void;
}

interface ProyectoResumen {
  id: string;
  nombre_proyecto: string;
  estado: string;
  created_at: string;
  expedientes: Array<{
    semaforo: string;
  }>;
}

interface Stats {
  activos: number;
  pendientes: number;
  completados: number;
}

export default function PortalDashboard({ clienteId, onViewProyecto }: Props) {
  const [proyectos, setProyectos] = useState<ProyectoResumen[]>([]);
  const [stats, setStats] = useState<Stats>({
    activos: 0,
    pendientes: 0,
    completados: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProyectos();
  }, [clienteId]);

  const loadProyectos = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('proyectos')
      .select(
        `
        id,
        nombre_proyecto,
        estado,
        created_at,
        expedientes (semaforo)
      `
      )
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (data) {
      setProyectos(data as any);

      const activos = data.filter(
        (p: any) => p.estado !== 'finalizado' && p.estado !== 'archivado'
      ).length;

      const pendientes = data.filter((p: any) => p.estado === 'pendiente_cliente').length;

      const completados = data.filter(
        (p: any) => p.estado === 'finalizado' || p.estado === 'archivado'
      ).length;

      setStats({
        activos,
        pendientes,
        completados
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
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Mis Proyectos</h1>
        <p className="text-slate-600 mt-2">
          Bienvenido a su portal de gestión. Aquí puede ver el estado de sus trámites y cargar la
          documentación requerida.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <List className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Proyectos Activos</p>
              <p className="text-3xl font-bold text-slate-900">{stats.activos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Acción Requerida</p>
              <p className="text-3xl font-bold text-slate-900">{stats.pendientes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Proyectos Completados</p>
              <p className="text-3xl font-bold text-slate-900">{stats.completados}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Proyectos List */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Detalle de Proyectos Activos</h2>

        {proyectos.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 mb-4">No tiene proyectos registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proyectos.map((proyecto) => (
              <ProyectoClienteCard
                key={proyecto.id}
                proyecto={proyecto}
                onClick={() => onViewProyecto(proyecto.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProyectoCardProps {
  proyecto: ProyectoResumen;
  onClick: () => void;
}

function ProyectoClienteCard({ proyecto, onClick }: ProyectoCardProps) {
  const numExpedientes = proyecto.expedientes?.length || 0;
  const numEnRiesgo =
    proyecto.expedientes?.filter((e) => e.semaforo === 'amarillo' || e.semaforo === 'rojo')
      .length || 0;

  let semaforoGeneral: 'verde' | 'amarillo' | 'rojo' = 'verde';
  if (numEnRiesgo > 0) {
    const tieneRojo = proyecto.expedientes?.some((e) => e.semaforo === 'rojo');
    semaforoGeneral = tieneRojo ? 'rojo' : 'amarillo';
  }

  const getSemaforoColor = (semaforo: string) => {
    if (semaforo === 'rojo') return 'border-l-red-500 bg-red-50';
    if (semaforo === 'amarillo') return 'border-l-amber-500 bg-amber-50';
    return 'border-l-green-500 bg-white';
  };

  const getSemaforoIcon = (semaforo: string) => {
    if (semaforo === 'rojo') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (semaforo === 'amarillo') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg shadow-sm border-l-4 ${getSemaforoColor(
        semaforoGeneral
      )} cursor-pointer hover:shadow-md transition-all border border-slate-200`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {getSemaforoIcon(semaforoGeneral)}
            <h3 className="font-semibold text-blue-800">{proyecto.nombre_proyecto}</h3>
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              <span>{numExpedientes} expedientes</span>
            </div>
            {numEnRiesgo > 0 && (
              <div className="flex items-center font-medium text-amber-700">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span>{numEnRiesgo} requieren atención</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-medium text-blue-600 capitalize">{proyecto.estado}</span>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </div>
    </div>
  );
}
