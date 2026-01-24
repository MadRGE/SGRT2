import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  ChevronRight
} from 'lucide-react';

interface Props {
  proyectoId: string;
  onDireccionarClick?: () => void;
  onVerDetallesClick?: () => void;
}

interface PresupuestoStatus {
  id: string;
  estado: string;
  total_final: number;
  fecha_enviado: string | null;
  fecha_aprobado: string | null;
  totalItems: number;
  itemsDireccionados: number;
  itemsSinDireccionar: number;
}

export function PresupuestoStatusWidget({
  proyectoId,
  onDireccionarClick,
  onVerDetallesClick
}: Props) {
  const [status, setStatus] = useState<PresupuestoStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresupuestoStatus();
  }, [proyectoId]);

  const loadPresupuestoStatus = async () => {
    setLoading(true);

    const { data: presupuesto } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .maybeSingle();

    if (!presupuesto) {
      setLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from('presupuesto_items')
      .select('*')
      .eq('presupuesto_id', presupuesto.id);

    const totalItems = items?.length || 0;
    const itemsDireccionados = items?.filter(i => i.direccionado === true).length || 0;
    const itemsSinDireccionar = totalItems - itemsDireccionados;

    setStatus({
      id: presupuesto.id,
      estado: presupuesto.estado,
      total_final: presupuesto.total_final || 0,
      fecha_enviado: presupuesto.fecha_enviado,
      fecha_aprobado: presupuesto.fecha_aprobado,
      totalItems,
      itemsDireccionados,
      itemsSinDireccionar
    });

    setLoading(false);
  };

  const getEstadoInfo = () => {
    if (!status) return { label: 'Sin Presupuesto', color: 'gray', icon: AlertCircle };

    const porcentaje = status.totalItems > 0
      ? (status.itemsDireccionados / status.totalItems) * 100
      : 0;

    if (status.estado === 'aprobado') {
      return {
        label: 'Aprobado',
        color: 'green',
        icon: CheckCircle,
        description: `Aprobado el ${new Date(status.fecha_aprobado!).toLocaleDateString()}`
      };
    }

    if (status.estado === 'enviado') {
      return {
        label: 'Enviado al Cliente',
        color: 'purple',
        icon: Send,
        description: `Enviado el ${new Date(status.fecha_enviado!).toLocaleDateString()}`
      };
    }

    if (porcentaje === 100) {
      return {
        label: 'Listo para Enviar',
        color: 'blue',
        icon: CheckCircle,
        description: 'Todos los items direccionados'
      };
    }

    if (porcentaje > 0) {
      return {
        label: 'Borrador Incompleto',
        color: 'yellow',
        icon: Clock,
        description: `${status.itemsSinDireccionar} items sin direccionar`
      };
    }

    return {
      label: 'Borrador',
      color: 'yellow',
      icon: AlertCircle,
      description: 'Ningún item direccionado'
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900">Sin Presupuesto</h3>
            <p className="text-sm text-red-700 mt-1">
              Este proyecto no tiene un presupuesto asociado.
            </p>
            <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
              Crear Presupuesto
            </button>
          </div>
        </div>
      </div>
    );
  }

  const estadoInfo = getEstadoInfo();
  const IconComponent = estadoInfo.icon;

  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    gray: 'bg-slate-50 border-slate-200 text-slate-900'
  };

  const iconColorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    yellow: 'text-yellow-600',
    gray: 'text-slate-600'
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[estadoInfo.color as keyof typeof colorClasses]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${estadoInfo.color === 'green' ? 'bg-green-100' :
            estadoInfo.color === 'blue' ? 'bg-blue-100' :
            estadoInfo.color === 'purple' ? 'bg-purple-100' :
            estadoInfo.color === 'yellow' ? 'bg-yellow-100' : 'bg-slate-100'}`}>
            <IconComponent className={`w-6 h-6 ${iconColorClasses[estadoInfo.color as keyof typeof iconColorClasses]}`} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Presupuesto del Proyecto</h3>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Estado:</span>
              <span className="font-semibold">{estadoInfo.label}</span>
            </div>

            <p className="text-sm mb-3">{estadoInfo.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-sm opacity-75">Total</p>
                <p className="text-xl font-bold">
                  ${status.total_final.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm opacity-75">Items</p>
                <p className="text-xl font-bold">{status.totalItems} conceptos</p>
              </div>
            </div>

            {status.itemsSinDireccionar > 0 && status.estado === 'borrador' && (
              <div className="flex items-center gap-2 p-3 bg-white bg-opacity-50 rounded-lg mb-3">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {status.itemsSinDireccionar} items sin direccionar
                  </p>
                  <p className="text-xs opacity-75">
                    {status.itemsDireccionados} de {status.totalItems} direccionados
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium">
                    {Math.round((status.itemsDireccionados / status.totalItems) * 100)}%
                  </p>
                </div>
              </div>
            )}

            {status.itemsSinDireccionar === 0 && status.totalItems > 0 && status.estado === 'borrador' && (
              <div className="flex items-center gap-2 p-3 bg-white bg-opacity-50 rounded-lg mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium">
                  Todos los items direccionados
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {status.itemsSinDireccionar > 0 && status.estado === 'borrador' && (
                <button
                  onClick={onDireccionarClick}
                  className="px-4 py-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg transition-colors text-sm font-medium border border-current"
                >
                  Direccionar Items
                </button>
              )}

              <button
                onClick={onVerDetallesClick}
                className="px-4 py-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg transition-colors text-sm font-medium border border-current flex items-center gap-2"
              >
                Ver Detalles
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
