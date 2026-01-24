import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FilePlus, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Props {
  onViewProyecto: (proyectoId: string) => void;
}

interface PresupuestoParaFacturar {
  id: string;
  proyecto_id: string;
  total_final: number;
  fecha_envio: string | null;
  created_at: string;
  proyectos: {
    nombre_proyecto: string;
    clientes: {
      razon_social: string;
    };
  };
}

export default function GestionFacturacion({ onViewProyecto }: Props) {
  const [listado, setListado] = useState<PresupuestoParaFacturar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFacturacion();
  }, []);

  const loadFacturacion = async () => {
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
      .eq('estado', 'aprobado')
      .order('created_at', { ascending: false });

    if (data) setListado(data as any);
    setLoading(false);
  };

  const getEstadoFactura = (presupuesto: PresupuestoParaFacturar) => {
    const diasDesdeAprobacion = presupuesto.fecha_envio
      ? Math.floor(
          (new Date().getTime() - new Date(presupuesto.fecha_envio).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    if (diasDesdeAprobacion > 30) {
      return { estado: 'Pagado', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else if (diasDesdeAprobacion > 15) {
      return {
        estado: 'Facturado Parcial',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock
      };
    } else {
      return {
        estado: 'Pendiente de Facturar',
        color: 'bg-slate-100 text-slate-800',
        icon: AlertCircle
      };
    }
  };

  const handleRegistrarFactura = (presupuestoId: string) => {
    alert(
      `Funcionalidad en desarrollo:\n\nAquí se abrirá un formulario para:\n- Registrar número de factura\n- Fecha de emisión\n- Condiciones de pago\n- Vincular comprobante PDF\n\nPresupuesto: ${presupuestoId}`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (listado.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-12 rounded-lg border border-slate-200">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FilePlus className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            No hay presupuestos aprobados pendientes de facturar
          </h3>
          <p className="text-slate-600">
            Los presupuestos aprobados aparecerán aquí para su facturación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800">
            Gestión de Facturación (Cuentas por Cobrar)
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Presupuestos aprobados listos para facturación y seguimiento de cobros
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Proyecto</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Cliente</th>
                <th className="p-3 text-right text-sm font-medium text-slate-700">
                  Monto Aprobado
                </th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">
                  Estado Factura
                </th>
                <th className="p-3 text-center text-sm font-medium text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listado.map((p) => {
                const estadoInfo = getEstadoFactura(p);
                const IconComponent = estadoInfo.icon;

                return (
                  <tr
                    key={p.id}
                    className="border-t border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3">
                      <p
                        className="font-medium text-blue-700 hover:underline cursor-pointer"
                        onClick={() => onViewProyecto(p.proyecto_id)}
                      >
                        {p.proyectos.nombre_proyecto}
                      </p>
                      <p className="text-xs text-slate-500">
                        Aprobado:{' '}
                        {p.fecha_envio
                          ? new Date(p.fecha_envio).toLocaleDateString('es-AR')
                          : 'N/A'}
                      </p>
                    </td>
                    <td className="p-3 text-sm text-slate-700">
                      {p.proyectos.clientes.razon_social}
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-800">
                      ${p.total_final.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}
                      >
                        <IconComponent className="w-3 h-3" />
                        {estadoInfo.estado}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {estadoInfo.estado === 'Pendiente de Facturar' && (
                        <button
                          onClick={() => handleRegistrarFactura(p.id)}
                          className="inline-flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <FilePlus className="w-4 h-4" />
                          Registrar Factura
                        </button>
                      )}
                      {estadoInfo.estado === 'Pagado' && (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Pagado
                        </span>
                      )}
                      {estadoInfo.estado === 'Facturado Parcial' && (
                        <button
                          onClick={() => handleRegistrarFactura(p.id)}
                          className="inline-flex items-center gap-1 text-sm bg-yellow-600 text-white px-3 py-1.5 rounded-md hover:bg-yellow-700 transition-colors"
                        >
                          <Clock className="w-4 h-4" />
                          Ver Estado
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          📋 Próximas funcionalidades
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Registro completo de facturas con número y fecha</li>
          <li>• Upload de comprobantes PDF</li>
          <li>• Seguimiento de pagos parciales y totales</li>
          <li>• Reportes de antigüedad de saldos</li>
          <li>• Integración con sistemas contables</li>
        </ul>
      </div>
    </div>
  );
}
