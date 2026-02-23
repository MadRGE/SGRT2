import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FilePlus, CheckCircle, AlertCircle, Loader2, X, Receipt } from 'lucide-react';

interface Props {
  onViewProyecto: (gestionId: string) => void;
}

interface CotizacionFacturable {
  id: string;
  numero_cotizacion: string;
  nombre_cliente: string;
  estado: string;
  precio_total: number;
  precio_final: number;
  fecha_emision: string;
  cliente_id: string | null;
  // Factura linked data
  numero_factura: string | null;
  fecha_factura: string | null;
  estado_factura: 'pendiente' | 'facturado' | 'pagado';
  condicion_pago: string | null;
}

export default function GestionFacturacion({ onViewProyecto: _onViewProyecto }: Props) {
  const [listado, setListado] = useState<CotizacionFacturable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFacturaModal, setShowFacturaModal] = useState<string | null>(null);
  const [facturaForm, setFacturaForm] = useState({
    numero_factura: '',
    fecha_factura: new Date().toISOString().split('T')[0],
    condicion_pago: '30 días',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFacturacion();
  }, []);

  const loadFacturacion = async () => {
    setLoading(true);

    // Get accepted cotizaciones (these are the ones that need invoicing)
    const { data: cotizaciones } = await supabase
      .from('cotizaciones')
      .select('id, numero_cotizacion, nombre_cliente, estado, precio_total, precio_final, fecha_emision, cliente_id')
      .in('estado', ['aceptada', 'convertida'])
      .order('fecha_emision', { ascending: false });

    if (cotizaciones) {
      // Map to facturable items with invoice status
      // We store factura info in cotizaciones metadata (observaciones or a convention)
      // For now, 'convertida' = facturado/pagado, 'aceptada' = pending factura
      const items: CotizacionFacturable[] = cotizaciones.map(c => ({
        ...c,
        numero_factura: null,
        fecha_factura: null,
        estado_factura: c.estado === 'convertida' ? 'facturado' as const : 'pendiente' as const,
        condicion_pago: null,
      }));
      setListado(items);
    }

    setLoading(false);
  };

  const handleRegistrarFactura = async (cotizacionId: string) => {
    setSaving(true);

    // Mark cotizacion as 'convertida' (invoiced)
    const { error } = await supabase
      .from('cotizaciones')
      .update({
        estado: 'convertida',
        observaciones: `Factura: ${facturaForm.numero_factura} | Fecha: ${facturaForm.fecha_factura} | Condición: ${facturaForm.condicion_pago}`,
      })
      .eq('id', cotizacionId);

    if (!error) {
      setShowFacturaModal(null);
      setFacturaForm({ numero_factura: '', fecha_factura: new Date().toISOString().split('T')[0], condicion_pago: '30 días' });
      await loadFacturacion();
    }

    setSaving(false);
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
            No hay cotizaciones aceptadas pendientes de facturar
          </h3>
          <p className="text-slate-600">
            Cuando un cliente acepte un presupuesto desde el portal, aparecerá aquí para facturación.
          </p>
        </div>
      </div>
    );
  }

  const pendientes = listado.filter(l => l.estado_factura === 'pendiente');
  const facturados = listado.filter(l => l.estado_factura === 'facturado');
  const totalPendiente = pendientes.reduce((s, l) => s + (l.precio_final || l.precio_total), 0);
  const totalFacturado = facturados.reduce((s, l) => s + (l.precio_final || l.precio_total), 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700 font-medium">Pendientes de Facturar</p>
          <p className="text-2xl font-bold text-yellow-800">{pendientes.length}</p>
          <p className="text-sm text-yellow-600 mt-1">${totalPendiente.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium">Facturados</p>
          <p className="text-2xl font-bold text-green-800">{facturados.length}</p>
          <p className="text-sm text-green-600 mt-1">${totalFacturado.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 font-medium">Total Aceptado</p>
          <p className="text-2xl font-bold text-blue-800">{listado.length}</p>
          <p className="text-sm text-blue-600 mt-1">${(totalPendiente + totalFacturado).toLocaleString('es-AR')}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800">
            Gestión de Facturación
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Cotizaciones aceptadas por el cliente, listas para facturación
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Cotización</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Cliente</th>
                <th className="p-3 text-right text-sm font-medium text-slate-700">Monto</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Fecha Aceptación</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Estado</th>
                <th className="p-3 text-center text-sm font-medium text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {listado.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <td className="p-3">
                    <p className="font-medium text-blue-700">{item.numero_cotizacion}</p>
                  </td>
                  <td className="p-3 text-sm text-slate-700">
                    {item.nombre_cliente}
                  </td>
                  <td className="p-3 text-right font-semibold text-slate-800">
                    ${(item.precio_final || item.precio_total).toLocaleString('es-AR')}
                  </td>
                  <td className="p-3 text-sm text-slate-600">
                    {new Date(item.fecha_emision).toLocaleDateString('es-AR')}
                  </td>
                  <td className="p-3">
                    {item.estado_factura === 'pendiente' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertCircle className="w-3 h-3" />
                        Pendiente
                      </span>
                    ) : item.estado_factura === 'facturado' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" />
                        Facturado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <CheckCircle className="w-3 h-3" />
                        Pagado
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.estado_factura === 'pendiente' && (
                      <button
                        onClick={() => setShowFacturaModal(item.id)}
                        className="inline-flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <FilePlus className="w-4 h-4" />
                        Registrar Factura
                      </button>
                    )}
                    {item.estado_factura === 'facturado' && (
                      <span className="inline-flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Facturado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal registrar factura */}
      {showFacturaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Registrar Factura</h2>
              </div>
              <button onClick={() => setShowFacturaModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de Factura *</label>
                <input
                  type="text"
                  value={facturaForm.numero_factura}
                  onChange={e => setFacturaForm({ ...facturaForm, numero_factura: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="A-0001-00012345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Factura *</label>
                <input
                  type="date"
                  value={facturaForm.fecha_factura}
                  onChange={e => setFacturaForm({ ...facturaForm, fecha_factura: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Condición de Pago</label>
                <select
                  value={facturaForm.condicion_pago}
                  onChange={e => setFacturaForm({ ...facturaForm, condicion_pago: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="contado">Contado</option>
                  <option value="15 días">15 días</option>
                  <option value="30 días">30 días</option>
                  <option value="60 días">60 días</option>
                  <option value="90 días">90 días</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowFacturaModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRegistrarFactura(showFacturaModal)}
                  disabled={!facturaForm.numero_factura || saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />}
                  Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
