import { useState, useEffect } from 'react';
import { X, Ship, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { DespachoService } from '../../services/DespachoService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (id: string) => void;
  preselectedClienteId?: string;
}

interface ClienteOption {
  cliente_id: string;
  clientes: { id: string; razon_social: string; cuit: string } | null;
}

export default function DespachoFormModal({ isOpen, onClose, onSuccess, preselectedClienteId }: Props) {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cliente_id: preselectedClienteId || '',
    tipo: 'importacion' as 'importacion' | 'exportacion',
    descripcion: '',
    posicion_arancelaria: '',
    valor_fob: '',
    moneda: 'USD',
    numero_guia: '',
    booking_number: '',
    prioridad: 'normal',
  });

  useEffect(() => {
    if (isOpen && user?.id) {
      loadClientes();
      setForm((prev) => ({
        ...prev,
        cliente_id: preselectedClienteId || '',
      }));
    }
  }, [isOpen, user?.id, preselectedClienteId]);

  const loadClientes = async () => {
    setLoading(true);
    const data = await DespachoService.getClientesByDespachante(user!.id);
    setClientes(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_id) {
      toast.error('Debe seleccionar un cliente');
      return;
    }

    setSaving(true);
    const { success, data, error } = await DespachoService.createDespacho({
      despachante_id: user!.id,
      cliente_id: form.cliente_id,
      tipo: form.tipo,
      descripcion: form.descripcion.trim() || null,
      posicion_arancelaria: form.posicion_arancelaria.trim() || null,
      valor_fob: form.valor_fob ? parseFloat(form.valor_fob) : null,
      moneda: form.moneda,
      numero_guia: form.numero_guia.trim() || null,
      booking_number: form.booking_number.trim() || null,
      prioridad: form.prioridad,
    } as any);

    if (success && data) {
      toast.success(`Despacho ${data.numero_despacho} creado`);
      setForm({ cliente_id: '', tipo: 'importacion', descripcion: '', posicion_arancelaria: '', valor_fob: '', moneda: 'USD', numero_guia: '', booking_number: '', prioridad: 'normal' });
      onSuccess(data.id);
    } else {
      toast.error(error || 'Error al crear despacho');
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 pt-5 pb-4 border-b border-slate-100 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Ship className="w-5 h-5 text-amber-600" />
              Nuevo Despacho
            </h2>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
            {loading ? (
              <div className="text-sm text-slate-400 py-2">Cargando clientes...</div>
            ) : clientes.length === 0 ? (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                No tiene clientes asignados. Contacte al administrador.
              </div>
            ) : (
              <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} className={inputClass}>
                <option value="">-- Seleccionar cliente --</option>
                {clientes.map((c) => (
                  <option key={c.cliente_id} value={c.cliente_id}>
                    {c.clientes?.razon_social} {c.clientes?.cuit ? `(CUIT: ${c.clientes.cuit})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Operación *</label>
            <div className="grid grid-cols-2 gap-2">
              {(['importacion', 'exportacion'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setForm({ ...form, tipo })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    form.tipo === tipo
                      ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {tipo === 'importacion' ? 'Importación' : 'Exportación'}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción de Mercadería</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className={inputClass} rows={2} placeholder="Descripción de la mercadería..." />
          </div>

          {/* NCM + FOB */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Posición Arancelaria (NCM)</label>
              <input value={form.posicion_arancelaria} onChange={(e) => setForm({ ...form, posicion_arancelaria: e.target.value })}
                className={inputClass} placeholder="0000.00.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor FOB</label>
              <div className="flex gap-2">
                <input type="number" step="0.01" value={form.valor_fob} onChange={(e) => setForm({ ...form, valor_fob: e.target.value })}
                  className={`${inputClass} flex-1`} placeholder="0.00" />
                <select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}
                  className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transporte */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nº Guía (BL/AWB)</label>
              <input value={form.numero_guia} onChange={(e) => setForm({ ...form, numero_guia: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Booking Number</label>
              <input value={form.booking_number} onChange={(e) => setForm({ ...form, booking_number: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
            <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })} className={inputClass}>
              <option value="baja">Baja</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl disabled:opacity-50 font-medium">
              <Save className="w-4 h-4" />
              {saving ? 'Creando...' : 'Crear Despacho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
