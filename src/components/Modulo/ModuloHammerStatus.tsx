/**
 * ModuloHammerStatus — Live panel showing Hammer automation executions.
 * Shows running, completed, and failed procedures for the current module.
 */
import { useState, useEffect } from 'react';
import {
  Hammer, Loader2, CheckCircle, XCircle, Clock, AlertTriangle,
  Play, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import * as InalApi from '../../services/InalApiService';

interface Props {
  organismo: string;
  color: string;
}

export default function ModuloHammerStatus({ organismo, color }: Props) {
  const [ejecuciones, setEjecuciones] = useState<InalApi.HammerEjecucion[]>([]);
  const [procedures, setProcedures] = useState<InalApi.HammerProcedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Poll every 10 seconds for running executions
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [organismo]);

  const loadData = async () => {
    try {
      const [ejecs, procs] = await Promise.all([
        InalApi.getHammerEjecuciones(),
        InalApi.getHammerProceduresForOrganismo(organismo).catch(() => []),
      ]);
      setEjecuciones(ejecs);
      setProcedures(procs);
    } catch {
      // Backend might not be running
    }
    setLoading(false);
  };

  const handleExecute = async (procedimiento: string) => {
    try {
      await InalApi.executeHammer({ procedimiento, tipo_tramite: organismo });
      await loadData();
    } catch (err: any) {
      console.error('Hammer execution failed:', err);
    }
  };

  const estadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fallido': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'ejecutando': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pendiente': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  const estadoLabel: Record<string, string> = {
    pendiente: 'Pendiente',
    ejecutando: 'Ejecutando...',
    completado: 'Completado',
    fallido: 'Fallido',
  };

  const estadoBg: Record<string, string> = {
    pendiente: 'bg-amber-50 border-amber-200',
    ejecutando: 'bg-blue-50 border-blue-200',
    completado: 'bg-green-50 border-green-200',
    fallido: 'bg-red-50 border-red-200',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available procedures */}
      {procedures.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Hammer className="w-4 h-4" />
            Procedimientos disponibles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {procedures.map((proc) => (
              <div key={proc.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{proc.nombre}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{proc.pasos.length} pasos &middot; {proc.dominio.toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => handleExecute(proc.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${color} text-white rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all`}
                  >
                    <Play className="w-3 h-3" />
                    Ejecutar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Historial de ejecuciones
          </h3>
          <button onClick={loadData} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Actualizar
          </button>
        </div>

        {ejecuciones.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <Hammer className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No hay ejecuciones todavía</p>
            <p className="text-xs text-slate-400 mt-1">Ejecutá un procedimiento para comenzar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ejecuciones.slice(0, 10).map((ejec) => {
              const isExpanded = expandedId === ejec.id;
              const progress = ejec.pasos_totales > 0
                ? Math.round((ejec.pasos_ejecutados / ejec.pasos_totales) * 100)
                : 0;

              return (
                <div key={ejec.id} className={`rounded-xl border ${estadoBg[ejec.estado] || 'bg-white border-slate-200'} overflow-hidden`}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ejec.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    {estadoIcon(ejec.estado)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{ejec.procedimiento_nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">
                          {estadoLabel[ejec.estado] || ejec.estado}
                        </span>
                        {ejec.estado === 'ejecutando' && (
                          <span className="text-xs text-blue-600 font-medium">{progress}%</span>
                        )}
                        <span className="text-xs text-slate-400">
                          {new Date(ejec.created_at).toLocaleString('es-AR', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar for running */}
                    {ejec.estado === 'ejecutando' && (
                      <div className="w-20 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    )}

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-slate-200/50">
                      {/* Steps */}
                      <div className="mt-3 space-y-1.5">
                        {ejec.pasos.map((paso, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            {i < ejec.pasos_ejecutados ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            ) : i === ejec.pasos_ejecutados && ejec.estado === 'ejecutando' ? (
                              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex-shrink-0" />
                            )}
                            <span className={i < ejec.pasos_ejecutados ? 'text-slate-700' : 'text-slate-400'}>{paso}</span>
                          </div>
                        ))}
                      </div>

                      {/* Error */}
                      {ejec.error && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                          {ejec.error}
                        </div>
                      )}

                      {/* Result */}
                      {ejec.resultado && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                          <pre className="whitespace-pre-wrap">{JSON.stringify(ejec.resultado, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
