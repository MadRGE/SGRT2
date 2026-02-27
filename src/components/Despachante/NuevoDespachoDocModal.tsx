import { useState } from 'react';
import { X, FileText, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { DESPACHO_DOC_TIPOS } from '../../lib/constants/despacho';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  despachoId: string;
  onSuccess: () => void;
}

export default function NuevoDespachoDocModal({ isOpen, onClose, despachoId, onSuccess }: Props) {
  const [form, setForm] = useState({
    nombre: '',
    tipo_documento: 'otro',
    obligatorio: false,
    notas: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error('El nombre del documento es obligatorio');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('despacho_documentos').insert([{
      despacho_id: despachoId,
      nombre: form.nombre.trim(),
      tipo_documento: form.tipo_documento,
      obligatorio: form.obligatorio,
      notas: form.notas.trim() || null,
    }]);

    if (error) {
      toast.error('Error al crear documento: ' + error.message);
    } else {
      toast.success('Documento agregado');
      setForm({ nombre: '', tipo_documento: 'otro', obligatorio: false, notas: '' });
      onSuccess();
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Agregar Documento
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              placeholder="Ej: Factura Comercial Proveedor X"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Documento</label>
            <select
              value={form.tipo_documento}
              onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {DESPACHO_DOC_TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="obligatorio"
              checked={form.obligatorio}
              onChange={(e) => setForm({ ...form, obligatorio: e.target.checked })}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="obligatorio" className="text-sm text-slate-700">Documento obligatorio</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              rows={2}
              placeholder="Notas opcionales..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
