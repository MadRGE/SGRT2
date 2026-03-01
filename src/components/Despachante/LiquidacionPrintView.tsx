import { DespachoService, type Liquidacion, type Despacho } from '../../services/DespachoService';
import { DESPACHO_TIPO_LABELS } from '../../lib/constants/despacho';

interface Props {
  liquidacion: Liquidacion;
  despacho: Despacho;
  onClose: () => void;
}

export default function LiquidacionPrintView({ liquidacion: liq, despacho, onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const fmt = (n: number, moneda = 'ARS') => DespachoService.formatMonto(n, moneda);
  const rows: [string, string, number][] = [
    ['Derecho de Importación', `${liq.derecho_importacion_pct}%`, liq.derecho_importacion],
    ['Tasa Estadística', `${liq.tasa_estadistica_pct}%`, liq.tasa_estadistica],
    ['IVA', `${liq.iva_pct}%`, liq.iva],
    ['IVA Adicional', `${liq.iva_adicional_pct}%`, liq.iva_adicional],
    ['Ingresos Brutos', `${liq.ingresos_brutos_pct}%`, liq.ingresos_brutos],
    ['Ganancias', `${liq.ganancias_pct}%`, liq.ganancias],
  ];

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body > *:not(.print-view-root) { display: none !important; }
          .print-view-root { position: fixed; inset: 0; z-index: 9999; background: white; overflow: auto; }
          .no-print { display: none !important; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>

      <div className="print-view-root fixed inset-0 z-50 bg-white overflow-auto">
        {/* Screen toolbar */}
        <div className="no-print sticky top-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">Vista previa de impresión</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              Cerrar
            </button>
            <button onClick={handlePrint}
              className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium">
              Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Print content */}
        <div className="max-w-[700px] mx-auto px-8 py-10 text-slate-800">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b border-slate-300 pb-6">
            <div>
              <h1 className="text-2xl font-bold">Liquidación de Tributos</h1>
              <p className="text-sm text-slate-500 mt-1">Despacho de {DESPACHO_TIPO_LABELS[despacho.tipo] || despacho.tipo}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-mono font-bold text-lg">{despacho.numero_despacho}</p>
              <p className="text-slate-500">{new Date(liq.created_at).toLocaleDateString('es-AR')}</p>
            </div>
          </div>

          {/* Client info */}
          <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Cliente</p>
              <p className="font-medium">{despacho.clientes?.razon_social || '-'}</p>
              <p className="text-slate-500 font-mono">{despacho.clientes?.cuit || ''}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Mercadería</p>
              <p>{despacho.descripcion || '-'}</p>
              {despacho.posicion_arancelaria && (
                <p className="text-slate-500 font-mono">NCM: {despacho.posicion_arancelaria}</p>
              )}
            </div>
          </div>

          {/* Base values */}
          <div className="grid grid-cols-3 gap-4 mb-8 bg-slate-50 rounded-lg p-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Valor en Aduana</p>
              <p className="font-semibold">{fmt(liq.valor_en_aduana, liq.moneda)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tipo de Cambio</p>
              <p className="font-semibold">{liq.tipo_cambio.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Base Imponible (ARS)</p>
              <p className="font-semibold">{fmt(liq.valor_en_aduana * liq.tipo_cambio)}</p>
            </div>
          </div>

          {/* Tributos table */}
          <table className="w-full text-sm mb-8">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-left py-2 font-semibold">Tributo</th>
                <th className="text-center py-2 font-semibold">Alícuota</th>
                <th className="text-right py-2 font-semibold">Importe (ARS)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, pct, amount]) => (
                <tr key={label} className="border-b border-slate-100">
                  <td className="py-2">{label}</td>
                  <td className="py-2 text-center text-slate-500">{pct}</td>
                  <td className="py-2 text-right font-mono">{fmt(amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300">
                <td colSpan={2} className="py-3 font-bold text-base">Total Tributos</td>
                <td className="py-3 text-right font-bold text-base font-mono">{fmt(liq.total_ars)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Footer */}
          <div className="text-xs text-slate-400 border-t border-slate-200 pt-4 flex justify-between">
            <span>SGT — Sistema de Gestión de Trámites</span>
            <span>Generado el {new Date().toLocaleDateString('es-AR')}</span>
          </div>
        </div>
      </div>
    </>
  );
}
