import { useState } from 'react';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { DespachoService, type Liquidacion, type Despacho } from '../../services/DespachoService';
import { LIQUIDACION_ESTADO_LABELS, LIQUIDACION_ESTADO_COLORS } from '../../lib/constants/despacho';
import LiquidacionCalculator from './LiquidacionCalculator';

interface Props {
  despachoId: string;
  liquidaciones: Liquidacion[];
  despacho: Despacho;
  onReload: () => void;
}

export default function DespachoLiquidacionTab({ despachoId, liquidaciones, despacho, onReload }: Props) {
  const [showCalculator, setShowCalculator] = useState(false);

  const handleDeleteLiq = async (id: string) => {
    if (!confirm('¿Eliminar esta liquidación?')) return;
    const { error } = await supabase.from('despacho_liquidaciones').delete().eq('id', id);
    if (!error) {
      toast.success('Liquidación eliminada');
      onReload();
    }
  };

  const handleEstadoChange = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('despacho_liquidaciones')
      .update({ estado: nuevoEstado })
      .eq('id', id);
    if (!error) {
      toast.success(`Estado actualizado a ${LIQUIDACION_ESTADO_LABELS[nuevoEstado]}`);
      onReload();
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCalculator(true)}
          className="flex items-center gap-1.5 text-sm bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva Liquidación
        </button>
      </div>

      {/* Existing liquidaciones */}
      {liquidaciones.map((liq) => (
        <div key={liq.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-slate-800 text-sm">
                Liquidación {liq.moneda} {DespachoService.formatMonto(liq.valor_en_aduana, liq.moneda)}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${LIQUIDACION_ESTADO_COLORS[liq.estado] || 'bg-slate-100 text-slate-600'}`}>
                {LIQUIDACION_ESTADO_LABELS[liq.estado] || liq.estado}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {liq.estado === 'borrador' && (
                <button onClick={() => handleEstadoChange(liq.id, 'confirmado')}
                  className="text-xs text-blue-600 hover:underline px-2 py-1">Confirmar</button>
              )}
              {liq.estado === 'confirmado' && (
                <button onClick={() => handleEstadoChange(liq.id, 'pagado')}
                  className="text-xs text-green-600 hover:underline px-2 py-1">Marcar Pagado</button>
              )}
              <button onClick={() => handleDeleteLiq(liq.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Valor en Aduana</p>
                <p className="font-medium text-slate-800">{DespachoService.formatMonto(liq.valor_en_aduana, liq.moneda)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tipo de Cambio</p>
                <p className="font-medium text-slate-800">{liq.tipo_cambio.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">D.I. ({liq.derecho_importacion_pct}%)</p>
                <p className="font-medium text-slate-800">{DespachoService.formatMonto(liq.derecho_importacion, 'ARS')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">T.E. ({liq.tasa_estadistica_pct}%)</p>
                <p className="font-medium text-slate-800">{DespachoService.formatMonto(liq.tasa_estadistica, 'ARS')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">IVA ({liq.iva_pct}%)</p>
                <p className="font-medium text-slate-800">{DespachoService.formatMonto(liq.iva, 'ARS')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">IVA Adic. ({liq.iva_adicional_pct}%)</p>
                <p className="font-medium text-slate-800">{DespachoService.formatMonto(liq.iva_adicional, 'ARS')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">IIBB ({liq.ingresos_brutos_pct}%)</p>
                <p className="font-medium text-slate-800">{DespachoService.formatMonto(liq.ingresos_brutos, 'ARS')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Ganancias ({liq.ganancias_pct}%)</p>
                <p className="font-medium text-slate-800">{DespachoService.formatMonto(liq.ganancias, 'ARS')}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-600 font-medium">Total Tributos</span>
              <span className="text-lg font-bold text-slate-800">{DespachoService.formatMonto(liq.total_ars, 'ARS')}</span>
            </div>
          </div>
        </div>
      ))}

      {liquidaciones.length === 0 && !showCalculator && (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center">
          <Calculator className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-slate-500 text-sm">No hay liquidaciones aún</p>
          <button onClick={() => setShowCalculator(true)} className="text-sm text-amber-600 font-medium mt-2 hover:underline">
            Crear la primera
          </button>
        </div>
      )}

      {/* Calculator */}
      {showCalculator && (
        <LiquidacionCalculator
          despachoId={despachoId}
          despacho={despacho}
          onSuccess={() => { setShowCalculator(false); onReload(); }}
          onCancel={() => setShowCalculator(false)}
        />
      )}
    </div>
  );
}
