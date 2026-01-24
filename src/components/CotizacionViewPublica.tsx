import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  urlPublica: string;
}

interface Cotizacion {
  id: string;
  numero_cotizacion: string;
  nombre_cliente: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  precio_total: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  precio_final: number;
  motivo_descuento: string | null;
  observaciones: string | null;
  estado: string;
}

interface CotizacionItem {
  concepto: string;
  tipo: string;
  precio_venta: number;
  cantidad: number;
  subtotal_precio: number;
}

export default function CotizacionViewPublica({ urlPublica }: Props) {
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadCotizacion();
  }, [urlPublica]);

  const loadCotizacion = async () => {
    setLoading(true);
    setError(false);

    const { data: cotizacionData, error: cotizError } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('url_publica', urlPublica)
      .single();

    if (cotizError || !cotizacionData) {
      setError(true);
      setLoading(false);
      return;
    }

    const { data: itemsData } = await supabase
      .from('cotizacion_items')
      .select('concepto, tipo, precio_venta, cantidad, subtotal_precio')
      .eq('cotizacion_id', cotizacionData.id)
      .order('id');

    setCotizacion(cotizacionData);
    setItems(itemsData || []);
    setLoading(false);

    await supabase
      .from('cotizaciones')
      .update({ veces_compartida: (cotizacionData.veces_compartida || 0) + 1 })
      .eq('id', cotizacionData.id);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      honorarios: 'Honorarios Profesionales',
      tasas: 'Tasas Oficiales',
      analisis: 'Análisis y Certificaciones',
      otros: 'Otros Servicios'
    };
    return labels[tipo] || tipo;
  };

  const estaVencida = () => {
    if (!cotizacion?.fecha_vencimiento) return false;
    return new Date(cotizacion.fecha_vencimiento) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !cotizacion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Cotización no encontrada</h2>
          <p className="text-slate-600">
            El enlace que intentas acceder no existe o ha expirado.
          </p>
        </div>
      </div>
    );
  }

  const vencida = estaVencida();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 md:p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-8 h-8" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Cotización</h1>
                <p className="text-blue-100">{cotizacion.numero_cotizacion}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-sm text-blue-100 mb-1">Cliente</p>
                <p className="font-semibold text-lg">{cotizacion.nombre_cliente}</p>
              </div>

              <div>
                <p className="text-sm text-blue-100 mb-1">Fecha de Emisión</p>
                <p className="font-semibold">{formatearFecha(cotizacion.fecha_emision)}</p>
              </div>
            </div>

            {cotizacion.fecha_vencimiento && (
              <div className="mt-4 flex items-center gap-2 bg-white bg-opacity-20 rounded-lg p-3">
                <Calendar className="w-5 h-5" />
                <div>
                  <p className="text-sm">Válida hasta</p>
                  <p className="font-semibold">{formatearFecha(cotizacion.fecha_vencimiento)}</p>
                </div>
                {vencida && (
                  <span className="ml-auto bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Vencida
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Detalle de Servicios</h2>

            <div className="space-y-3 mb-6">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-start p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{item.concepto}</p>
                    <p className="text-sm text-slate-600 capitalize mt-1">{getTipoLabel(item.tipo)}</p>
                    {item.cantidad > 1 && (
                      <p className="text-sm text-slate-500 mt-1">
                        Cantidad: {item.cantidad} × ${item.precio_venta.toLocaleString('es-AR')}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg text-blue-600">
                      ${item.subtotal_precio.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-slate-200 pt-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-slate-700">Subtotal</span>
                <span className="text-2xl font-bold text-slate-800">
                  ${cotizacion.precio_total.toLocaleString('es-AR')}
                </span>
              </div>

              {cotizacion.descuento_porcentaje > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-orange-700">
                      Descuento ({cotizacion.descuento_porcentaje}%)
                      {cotizacion.motivo_descuento && (
                        <span className="text-sm text-slate-600 block">
                          {cotizacion.motivo_descuento}
                        </span>
                      )}
                    </span>
                    <span className="text-2xl font-bold text-orange-600">
                      -${cotizacion.descuento_monto.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-300">
                    <span className="text-xl font-bold text-slate-700">Total Final</span>
                    <span className="text-3xl font-bold text-green-600">
                      ${cotizacion.precio_final.toLocaleString('es-AR')}
                    </span>
                  </div>
                </>
              )}

              {cotizacion.descuento_porcentaje === 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-slate-700">Total</span>
                  <span className="text-3xl font-bold text-blue-600">
                    ${cotizacion.precio_total.toLocaleString('es-AR')}
                  </span>
                </div>
              )}
            </div>

            {cotizacion.observaciones && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-slate-800 mb-2">Condiciones y Observaciones</h3>
                <p className="text-slate-700 whitespace-pre-line">{cotizacion.observaciones}</p>
              </div>
            )}

            {!vencida && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800 mb-1">¿Listo para comenzar?</p>
                  <p className="text-green-700 text-sm">
                    Contacta con nosotros por WhatsApp para aceptar esta cotización y comenzar con tu proyecto.
                  </p>
                </div>
              </div>
            )}

            {vencida && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 mb-1">Cotización Vencida</p>
                  <p className="text-red-700 text-sm">
                    Esta cotización ha superado su fecha de validez. Por favor, contacta con nosotros para solicitar una cotización actualizada.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border-t border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-600">
              Si tienes alguna consulta sobre esta cotización, no dudes en contactarnos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
