import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  ChevronRight,
  PlayCircle,
} from 'lucide-react';
import {
  ProcedureStageService,
  ProcedureStage,
  ExpedienteStage,
} from '../../services/ProcedureStageService';

interface TabProcedureStagesProps {
  expedienteId: string;
  tramiteTipoId: string;
}

export function TabProcedureStages({ expedienteId, tramiteTipoId }: TabProcedureStagesProps) {
  const [procedureStages, setProcedureStages] = useState<ProcedureStage[]>([]);
  const [expedienteStages, setExpedienteStages] = useState<ExpedienteStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  useEffect(() => {
    loadStages();
  }, [expedienteId, tramiteTipoId]);

  const loadStages = async () => {
    setLoading(true);

    const [procedureResult, expedienteResult] = await Promise.all([
      ProcedureStageService.getStagesForTramite(tramiteTipoId),
      ProcedureStageService.getExpedienteStages(expedienteId),
    ]);

    if (!procedureResult.error) {
      setProcedureStages(procedureResult.stages);
    }

    if (!expedienteResult.error) {
      setExpedienteStages(expedienteResult.stages);
    }

    if (expedienteResult.stages.length === 0 && procedureResult.stages.length > 0) {
      await ProcedureStageService.initializeExpedienteStages(expedienteId, tramiteTipoId);
      const { stages } = await ProcedureStageService.getExpedienteStages(expedienteId);
      setExpedienteStages(stages);
    }

    setLoading(false);
  };

  const handleCompleteStage = async (stageId: string) => {
    const notas = prompt('Ingrese notas sobre la finalización de esta etapa (opcional):');
    const { stage, error } = await ProcedureStageService.completeStage(stageId, notas || '');
    if (!error && stage) {
      await loadStages();
    }
  };

  const handleBlockStage = async (stageId: string) => {
    const notas = prompt('Ingrese el motivo del bloqueo:');
    if (!notas) return;

    const { stage, error } = await ProcedureStageService.blockStage(stageId, notas);
    if (!error && stage) {
      await loadStages();
    }
  };

  const handleUnblockStage = async (stageId: string) => {
    const { stage, error } = await ProcedureStageService.unblockStage(stageId);
    if (!error && stage) {
      await loadStages();
    }
  };

  const getStageStatus = (stageId: string) => {
    return expedienteStages.find((es) => es.stage_id === stageId);
  };

  const getStatusIcon = (estado?: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'en_proceso':
        return <PlayCircle className="w-6 h-6 text-blue-600" />;
      case 'bloqueado':
        return <Lock className="w-6 h-6 text-red-600" />;
      case 'pendiente':
        return <Clock className="w-6 h-6 text-gray-400" />;
      default:
        return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getStatusBadge = (estado?: string) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium';
    switch (estado) {
      case 'completado':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'en_proceso':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'bloqueado':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pendiente':
        return `${baseClasses} bg-gray-100 text-gray-600`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Cargando etapas del procedimiento...</div>;
  }

  if (procedureStages.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        No hay etapas configuradas para este tipo de trámite
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Progreso del Procedimiento</h3>
        <p className="text-sm text-gray-600 mb-4">
          {expedienteStages.filter((es) => es.estado === 'completado').length} de{' '}
          {procedureStages.length} etapas completadas
        </p>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{
              width: `${
                (expedienteStages.filter((es) => es.estado === 'completado').length /
                  procedureStages.length) *
                100
              }%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {procedureStages.map((stage, index) => {
          const status = getStageStatus(stage.id);
          const isExpanded = selectedStage === stage.id;

          return (
            <div
              key={stage.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedStage(isExpanded ? null : stage.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{getStatusIcon(status?.estado)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        Etapa {index + 1}
                      </span>
                      <span className={getStatusBadge(status?.estado)}>
                        {status?.estado?.toUpperCase() || 'NO INICIADO'}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold mb-1">{stage.nombre}</h4>
                    {stage.descripcion && (
                      <p className="text-sm text-gray-600">{stage.descripcion}</p>
                    )}
                    {stage.duracion_estimada_dias && (
                      <p className="text-xs text-gray-500 mt-2">
                        Duración estimada: {stage.duracion_estimada_dias} días
                      </p>
                    )}
                  </div>

                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {isExpanded && status && (
                <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
                  {status.fecha_inicio && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Fecha de inicio:</span>
                      <p className="text-sm text-gray-600">
                        {new Date(status.fecha_inicio).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  )}

                  {status.fecha_completado && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Fecha de finalización:
                      </span>
                      <p className="text-sm text-gray-600">
                        {new Date(status.fecha_completado).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  )}

                  {status.notas && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Notas:</span>
                      <p className="text-sm text-gray-600 mt-1">{status.notas}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {status.estado === 'en_proceso' && (
                      <>
                        <button
                          onClick={() => handleCompleteStage(status.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Completar Etapa
                        </button>
                        <button
                          onClick={() => handleBlockStage(status.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Bloquear
                        </button>
                      </>
                    )}
                    {status.estado === 'bloqueado' && (
                      <button
                        onClick={() => handleUnblockStage(status.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Desbloquear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
