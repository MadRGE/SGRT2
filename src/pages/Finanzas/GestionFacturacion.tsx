import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FilePlus, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  onViewProyecto: (gestionId: string) => void;
}

interface TramiteFacturable {
  id: string;
  titulo: string;
  estado: string;
  monto_presupuesto: number;
  gestion_id: string | null;
  created_at: string;
  updated_at: string | null;
  clientes: { razon_social: string } | null;
  gestiones: { nombre: string } | null;
}

export default function GestionFacturacion({ onViewProyecto }: Props) {
  const [listado, setListado] = useState<TramiteFacturable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFacturacion();
  }, []);

  const loadFacturacion = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('tramites')
      .select(`
        id, titulo, estado, monto_presupuesto, gestion_id, created_at, updated_at,
        clientes(razon_social),
        gestiones(nombre)
      `)
      .eq('estado', 'aprobado')
      .not('monto_presupuesto', 'is', null)
      .order('updated_at', { ascending: false });

    if (data) setListado(data as TramiteFacturable[]);
    setLoading(false);
  };

  const getEstadoFactura = (tramite: TramiteFacturable) => {
    const fechaRef = tramite.updated_at || tramite.created_at;
    const diasDesdeAprobacion = Math.floor(
      (new Date().getTime() - new Date(fechaRef).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasDesdeAprobacion > 30) {
      return { estado: 'Pagado', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    } else if (diasDesdeAprobacion > 15) {
      return { estado: 'Facturado Parcial', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    } else {
      return { estado: 'Pendiente de Facturar', color: 'bg-slate-100 text-slate-800', icon: AlertCircle };
    }
  };

  const handleRegistrarFactura = (tramiteId: string) => {
    alert(
      `Funcionalidad en desarrollo:\n\nAquí se abrirá un formulario para:\n- Registrar número de factura\n- Fecha de emisión\n- Condiciones de pago\n- Vincular comprobante PDF\n\nTrámite: ${tramiteId}`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
            No hay trámites aprobados pendientes de facturar
          </h3>
          <p className="text-slate-600">
            Los trámites aprobados con presupuesto aparecerán aquí para su facturación.
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
            Trámites aprobados con presupuesto listos para facturación
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Trámite</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Cliente</th>
                <th className="p-3 text-right text-sm font-medium text-slate-700">Presupuesto</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Estado Factura</th>
                <th className="p-3 text-center text-sm font-medium text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listado.map((t) => {
                const estadoInfo = getEstadoFactura(t);
                const IconComponent = estadoInfo.icon;

                return (
                  <tr
                    key={t.id}
                    className="border-t border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3">
                      <p
                        className="font-medium text-blue-700 hover:underline cursor-pointer"
                        onClick={() => t.gestion_id && onViewProyecto(t.gestion_id)}
                      >
                        {t.titulo}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.gestiones?.nombre || 'Sin gestión'}
                      </p>
                    </td>
                    <td className="p-3 text-sm text-slate-700">
                      {t.clientes?.razon_social || 'N/A'}
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-800">
                      ${t.monto_presupuesto.toLocaleString('es-AR')}
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
                          onClick={() => handleRegistrarFactura(t.id)}
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
                          onClick={() => handleRegistrarFactura(t.id)}
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
    </div>
  );
}
