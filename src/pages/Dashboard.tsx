import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CotizacionService } from '../services/CotizacionService';
import {
  Plus, List, AlertTriangle, ShieldOff, CheckCircle, Clock,
  FileText, User, ChevronRight, Loader2, DollarSign, Building2,
  Book, Settings, BarChart3, TrendingUp, Send, Archive, RotateCcw
} from 'lucide-react';

interface Props {
  onCreateProject: () => void;
  onViewProject: (proyectoId: string) => void;
}

interface ProyectoResumen {
  id: string;
  nombre_proyecto: string;
  estado: string;
  created_at: string;
  archivado?: boolean;
  clientes: {
    razon_social: string;
  };
  expedientes: Array<{
    semaforo: string;
  }>;
  presupuestos?: Array<{
    estado: string;
    total_final: number;
  }>;
}

interface Stats {
  proyectosActivos: number;
  expedientesEnRiesgo: number;
  habilitacionesPendientes: number;
}

interface CotizacionStats {
  cotizacionesMes: number;
  cotizacionesPendientes: number;
  tasaConversion: number;
}

export default function Dashboard({ onCreateProject, onViewProject }: Props) {
  const [proyectos, setProyectos] = useState<ProyectoResumen[]>([]);
  const [showArchivados, setShowArchivados] = useState(false);
  const [stats, setStats] = useState<Stats>({
    proyectosActivos: 0,
    expedientesEnRiesgo: 0,
    habilitacionesPendientes: 0
  });
  const [cotizacionStats, setCotizacionStats] = useState<CotizacionStats>({
    cotizacionesMes: 0,
    cotizacionesPendientes: 0,
    tasaConversion: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      // Intentar query completa con relaciones
      const { data: proyectosData, error: proyectosError } = await supabase
        .from('proyectos')
        .select(`
          id,
          nombre_proyecto,
          estado,
          created_at,
          clientes (razon_social),
          expedientes (semaforo),
          presupuestos (estado, total_final)
        `)
        .order('created_at', { ascending: false });

      if (proyectosError) {
        console.warn('Error cargando proyectos con relaciones, intentando query simple:', proyectosError);
        // Si falla, intentar query simple sin relaciones
        const { data: proyectosSimple } = await supabase
          .from('proyectos')
          .select('id, nombre_proyecto, estado, created_at')
          .order('created_at', { ascending: false });

        if (proyectosSimple) {
          // Mapear a la estructura esperada con valores por defecto
          const proyectosMapeados = proyectosSimple.map((p: any) => ({
            ...p,
            archivado: false,
            clientes: { razon_social: 'Sin cliente' },
            expedientes: [],
            presupuestos: []
          }));
          setProyectos(proyectosMapeados as any);
          setStats({
            proyectosActivos: proyectosSimple.filter((p: any) => p.estado !== 'finalizado').length,
            expedientesEnRiesgo: 0,
            habilitacionesPendientes: 0
          });
        }
      } else if (proyectosData) {
        // Agregar archivado: false por defecto si no existe
        const proyectosConDefaults = proyectosData.map((p: any) => ({
          ...p,
          archivado: p.archivado ?? false
        }));
        setProyectos(proyectosConDefaults as any);

        const proyectosActivos = proyectosConDefaults.filter(
          (p: any) => !p.archivado && p.estado !== 'finalizado'
        ).length;

        const expedientesEnRiesgo = proyectosData.reduce((count: number, p: any) => {
          return (
            count +
            (p.expedientes?.filter(
              (e: any) => e.semaforo === 'amarillo' || e.semaforo === 'rojo'
            ).length || 0)
          );
        }, 0);

        let habilitacionesPendientes = 0;
        try {
          const { data: habilitacionesData } = await supabase
            .from('expedientes')
            .select('tramite_tipos!inner(es_habilitacion_previa)')
            .eq('tramite_tipos.es_habilitacion_previa', true)
            .neq('estado', 'aprobado');
          habilitacionesPendientes = habilitacionesData?.length || 0;
        } catch (e) {
          console.warn('Error cargando habilitaciones:', e);
        }

        setStats({
          proyectosActivos,
          expedientesEnRiesgo,
          habilitacionesPendientes
        });
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      setProyectos([]);
      setStats({ proyectosActivos: 0, expedientesEnRiesgo: 0, habilitacionesPendientes: 0 });
    }

    try {
      const cotizacionesStats = await CotizacionService.obtenerEstadisticasCotizaciones();
      setCotizacionStats({
        cotizacionesMes: cotizacionesStats.cotizacionesMes,
        cotizacionesPendientes: cotizacionesStats.cotizacionesPendientes,
        tasaConversion: cotizacionesStats.tasaConversion
      });
    } catch (e) {
      console.warn('Error cargando estadísticas de cotizaciones:', e);
    }

    setLoading(false);
  };

  const handleRestaurarProyecto = async (proyectoId: string) => {
    try {
      await supabase
        .from('proyectos')
        .update({ archivado: false })
        .eq('id', proyectoId);

      await loadData();
    } catch (error) {
      console.error('Error restaurando proyecto:', error);
      alert('Error al restaurar el proyecto');
    }
  };

  const proyectosFiltrados = showArchivados
    ? proyectos.filter(p => p.archivado)
    : proyectos.filter(p => !p.archivado);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <List className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Proyectos Activos</p>
              <p className="text-3xl font-bold text-slate-900">{stats.proyectosActivos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Expedientes en Riesgo</p>
              <p className="text-3xl font-bold text-slate-900">{stats.expedientesEnRiesgo}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-full">
              <ShieldOff className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Habilitaciones Pendientes</p>
              <p className="text-3xl font-bold text-slate-900">{stats.habilitacionesPendientes}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-6 rounded-lg shadow-md text-white">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white bg-opacity-20 rounded-full">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">Cotizaciones del Mes</p>
              <p className="text-3xl font-bold">{cotizacionStats.cotizacionesMes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cotizaciones Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Actividad Comercial
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-60 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Cotizaciones Pendientes</p>
            <p className="text-2xl font-bold text-blue-600">{cotizacionStats.cotizacionesPendientes}</p>
          </div>
          <div className="bg-white bg-opacity-60 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Tasa de Conversión</p>
            <p className="text-2xl font-bold text-green-600">{cotizacionStats.tasaConversion.toFixed(1)}%</p>
          </div>
          <div className="bg-white bg-opacity-60 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Este Mes</p>
            <p className="text-2xl font-bold text-purple-600">{cotizacionStats.cotizacionesMes}</p>
          </div>
        </div>
      </div>

      {/* Active Projects Section */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">
            {showArchivados ? 'Proyectos Archivados' : 'Proyectos Activos'}
          </h2>
          <button
            onClick={() => setShowArchivados(!showArchivados)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {showArchivados ? (
              <>
                <List className="w-4 h-4" />
                Ver Activos
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Ver Archivados
              </>
            )}
          </button>
        </div>

        {proyectosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            {showArchivados ? (
              <>
                <Archive className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600">No hay proyectos archivados</p>
              </>
            ) : (
              <>
                <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 mb-4">No hay proyectos creados todavía</p>
                <button
                  onClick={onCreateProject}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear tu primer proyecto
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {proyectosFiltrados.map((proyecto) => (
              <ProyectoCard
                key={proyecto.id}
                proyecto={proyecto}
                onClick={() => onViewProject(proyecto.id)}
                onRestaurar={showArchivados ? () => handleRestaurarProyecto(proyecto.id) : undefined}
                isArchivado={showArchivados}
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
  onRestaurar?: () => void;
  isArchivado?: boolean;
}

function ProyectoCard({ proyecto, onClick, onRestaurar, isArchivado }: ProyectoCardProps) {
  const numExpedientes = proyecto.expedientes?.length || 0;
  const numEnRiesgo =
    proyecto.expedientes?.filter(
      (e) => e.semaforo === 'amarillo' || e.semaforo === 'rojo'
    ).length || 0;

  let semaforoGeneral: 'verde' | 'amarillo' | 'rojo' = 'verde';
  if (numEnRiesgo > 0) {
    const tieneRojo = proyecto.expedientes?.some((e) => e.semaforo === 'rojo');
    semaforoGeneral = tieneRojo ? 'rojo' : 'amarillo';
  }

  const getSemaforoColor = (semaforo: string) => {
    if (semaforo === 'rojo') return 'border-l-red-500 bg-red-50';
    if (semaforo === 'amarillo') return 'border-l-yellow-500 bg-yellow-50';
    return 'border-l-green-500 bg-white';
  };

  const getSemaforoIcon = (semaforo: string) => {
    if (semaforo === 'rojo') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (semaforo === 'amarillo') return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  return (
    <div
      className={`p-4 rounded-lg shadow-sm border-l-4 ${
        isArchivado ? 'border-l-slate-400 bg-slate-50' : getSemaforoColor(semaforoGeneral)
      } transition-all border border-slate-200 ${!isArchivado && 'cursor-pointer hover:shadow-md'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1" onClick={!isArchivado ? onClick : undefined}>
          <div className="flex items-center space-x-2 mb-2">
            {isArchivado ? (
              <Archive className="w-5 h-5 text-slate-500" />
            ) : (
              getSemaforoIcon(semaforoGeneral)
            )}
            <h3 className={`font-semibold ${isArchivado ? 'text-slate-600' : 'text-blue-800'}`}>
              {proyecto.nombre_proyecto}
            </h3>
            {isArchivado && (
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full font-medium">
                Archivado
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              <span>{proyecto.clientes.razon_social}</span>
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              <span>{numExpedientes} expedientes</span>
            </div>
            {!isArchivado && numEnRiesgo > 0 && (
              <div className="flex items-center text-yellow-700">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span>{numEnRiesgo} en riesgo</span>
              </div>
            )}
          </div>
          {!isArchivado && proyecto.presupuestos && proyecto.presupuestos.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <DollarSign className="w-4 h-4" />
              <span>Presupuesto:</span>
              {proyecto.presupuestos[0].estado === 'aprobado' && (
                <span className="flex items-center gap-1 text-green-700 font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Aprobado (${proyecto.presupuestos[0].total_final.toLocaleString('es-AR')})
                </span>
              )}
              {proyecto.presupuestos[0].estado === 'enviado' && (
                <span className="flex items-center gap-1 text-purple-700 font-medium">
                  <Send className="w-3 h-3" />
                  Enviado al cliente
                </span>
              )}
              {proyecto.presupuestos[0].estado === 'borrador' && (
                <span className="flex items-center gap-1 text-yellow-700 font-medium">
                  <Clock className="w-3 h-3" />
                  Borrador
                </span>
              )}
            </div>
          )}
          {!isArchivado && (!proyecto.presupuestos || proyecto.presupuestos.length === 0) && (
            <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Sin presupuesto</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isArchivado && onRestaurar ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestaurar();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar
            </button>
          ) : (
            <>
              <span className="font-medium text-blue-600 capitalize">{proyecto.estado}</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
