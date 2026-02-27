import { useState, useMemo } from 'react';
import { Calculator, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { DespachoService, type Despacho } from '../../services/DespachoService';

interface Props {
  despachoId: string;
  despacho: Despacho;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LiquidacionCalculator({ despachoId, despacho, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState({
    valor_en_aduana: despacho.valor_cif || despacho.valor_fob || 0,
    moneda: despacho.moneda || 'USD',
    tipo_cambio: 1,
    derecho_importacion_pct: 0,
    tasa_estadistica_pct: 3,
    iva_pct: 21,
    iva_adicional_pct: 20,
    ingresos_brutos_pct: 2.5,
    ganancias_pct: 6,
  });
  const [saving, setSaving] = useState(false);

  const calc = useMemo(() => DespachoService.calculateLiquidacion(form), [form]);

  const updateField = (field: string, value: number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (form.valor_en_aduana <= 0) {
      toast.error('El valor en aduana debe ser mayor a 0');
      return;
    }
    if (form.tipo_cambio <= 0) {
      toast.error('El tipo de cambio debe ser mayor a 0');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('despacho_liquidaciones').insert([{
      despacho_id: despachoId,
      valor_en_aduana: form.valor_en_aduana,
      moneda: form.moneda,
      tipo_cambio: form.tipo_cambio,
      derecho_importacion_pct: form.derecho_importacion_pct,
      derecho_importacion: calc.derecho_importacion,
      tasa_estadistica_pct: form.tasa_estadistica_pct,
      tasa_estadistica: calc.tasa_estadistica,
      iva_pct: form.iva_pct,
      iva: calc.iva,
      iva_adicional_pct: form.iva_adicional_pct,
      iva_adicional: calc.iva_adicional,
      ingresos_brutos_pct: form.ingresos_brutos_pct,
      ingresos_brutos: calc.ingresos_brutos,
      ganancias_pct: form.ganancias_pct,
      ganancias: calc.ganancias,
      total_tributos: calc.total_tributos,
      total_ars: calc.total_ars,
    }]);

    if (error) {
      toast.error('Error al guardar: ' + error.message);
    } else {
      toast.success('Liquidación creada');
      onSuccess();
    }
    setSaving(false);
  };

  const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-right';
  const pctInputClass = 'w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500';

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm">
      <div className="p-4 border-b border-amber-100 flex items-center justify-between bg-amber-50/50 rounded-t-2xl">
        <h3 className="font-semibold text-amber-800 flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Calculadora de Liquidación
        </h3>
        <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Base */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Valor en Aduana ({form.moneda})</label>
            <input type="number" step="0.01" value={form.valor_en_aduana || ''} onChange={(e) => updateField('valor_en_aduana', parseFloat(e.target.value) || 0)}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Moneda</label>
            <select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="ARS">ARS</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Cambio</label>
            <input type="number" step="0.0001" value={form.tipo_cambio || ''} onChange={(e) => updateField('tipo_cambio', parseFloat(e.target.value) || 0)}
              className={inputClass} />
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
          Base imponible ARS: <span className="font-semibold text-slate-800">{DespachoService.formatMonto(form.valor_en_aduana * form.tipo_cambio, 'ARS')}</span>
        </div>

        {/* Tributos */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">Tributos</h4>
          {[
            { key: 'derecho_importacion', label: 'Derecho de Importación (DI)', resultKey: 'derecho_importacion' as const },
            { key: 'tasa_estadistica', label: 'Tasa Estadística (TE)', resultKey: 'tasa_estadistica' as const },
            { key: 'iva', label: 'IVA', resultKey: 'iva' as const },
            { key: 'iva_adicional', label: 'IVA Adicional', resultKey: 'iva_adicional' as const },
            { key: 'ingresos_brutos', label: 'Ingresos Brutos (IIBB)', resultKey: 'ingresos_brutos' as const },
            { key: 'ganancias', label: 'Ganancias', resultKey: 'ganancias' as const },
          ].map((tributo) => (
            <div key={tributo.key} className="flex items-center gap-4">
              <span className="text-sm text-slate-600 flex-1">{tributo.label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={form[`${tributo.key}_pct` as keyof typeof form] || ''}
                  onChange={(e) => updateField(`${tributo.key}_pct`, parseFloat(e.target.value) || 0)}
                  className={pctInputClass}
                />
                <span className="text-xs text-slate-400 w-4">%</span>
              </div>
              <span className="text-sm font-medium text-slate-800 w-32 text-right">
                {DespachoService.formatMonto(calc[tributo.resultKey], 'ARS')}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="pt-4 border-t-2 border-amber-200 flex items-center justify-between">
          <span className="text-base font-bold text-slate-800">Total Tributos</span>
          <span className="text-2xl font-bold text-amber-700">{DespachoService.formatMonto(calc.total_ars, 'ARS')}</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Liquidación'}
          </button>
        </div>
      </div>
    </div>
  );
}
