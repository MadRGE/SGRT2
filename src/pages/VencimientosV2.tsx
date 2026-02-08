import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Calendar, Loader2, X, AlertTriangle, CheckCircle } from 'lucide-react';

interface Props {
  onNavigate: (page: any) => void;
}

interface Vencimiento {
  id: string;
  tipo: string;
  descripcion: string;
  fecha_vencimiento: string;
  cliente_id: string;
  tramite_id: string | null;
  clientes: { razon_social: string } | null;
}

export default function VencimientosV2({ onNavigate }: Props) {
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('vencimientos')
        .select('*, clientes(razon_social)')
        .order('fecha_vencimiento', { ascending: true });

      setVencimientos((data as any) || []);
    } catch (e) {
      console.warn('Error:', e);
    }
    setLoading(false);
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencidos = vencimientos.filter(v => new Date(v.fecha_vencimiento) < hoy);
  const proximos = vencimientos.filter(v => {
    const f = new Date(v.fecha_vencimiento);
    const en30 = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
    return f >= hoy && f <= en30;
  });
  const futuros = vencimientos.filter(v => {
    const f = new Date(v.fecha_vencimiento);
    const en30 = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
    return f > en30;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este vencimiento?')) return;
    await supabase.from('vencimientos').delete().eq('id', id);
    loadData();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Vencimientos</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nuevo Vencimiento
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : vencimientos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No hay vencimientos cargados</p>
        </div>
      ) : (
        <>
          {vencidos.length > 0 && (
            <VencimientoSection title="Vencidos" items={vencidos} color="red" onDelete={handleDelete} />
          )}
          {proximos.length > 0 && (
            <VencimientoSection title="Próximos 30 días" items={proximos} color="yellow" onDelete={handleDelete} />
          )}
          {futuros.length > 0 && (
            <VencimientoSection title="Futuros" items={futuros} color="green" onDelete={handleDelete} />
          )}
        </>
      )}

      {showForm && (
        <NuevoVencimientoModal
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); loadData(); }}
        />
      )}
    </div>
  );
}

function VencimientoSection({ title, items, color, onDelete }: {
  title: string;
  items: Vencimiento[];
  color: 'red' | 'yellow' | 'green';
  onDelete: (id: string) => void;
}) {
  const iconMap = {
    red: <AlertTriangle className="w-4 h-4 text-red-500" />,
    yellow: <Calendar className="w-4 h-4 text-yellow-500" />,
    green: <CheckCircle className="w-4 h-4 text-green-500" />,
  };
  const bgMap = { red: 'border-l-red-500', yellow: 'border-l-yellow-500', green: 'border-l-green-500' };

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
        {iconMap[color]} {title} ({items.length})
      </h2>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {items.map(v => (
          <div key={v.id} className={`p-4 flex items-center gap-4 border-l-4 ${bgMap[color]}`}>
            <div className="flex-1">
              <p className="font-medium text-slate-800 text-sm">{v.descripcion}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-slate-500">{(v.clientes as any)?.razon_social}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded capitalize">{v.tipo}</span>
              </div>
            </div>
            <span className="text-sm font-medium text-slate-700">
              {new Date(v.fecha_vencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <button onClick={() => onDelete(v.id)} className="text-xs text-slate-400 hover:text-red-500">Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NuevoVencimientoModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [clientes, setClientes] = useState<{ id: string; razon_social: string }[]>([]);
  const [form, setForm] = useState({ cliente_id: '', tipo: 'certificado', descripcion: '', fecha_vencimiento: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('clientes').select('id, razon_social').order('razon_social')
      .then(({ data }) => { if (data) setClientes(data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('vencimientos').insert({
      cliente_id: form.cliente_id,
      tipo: form.tipo,
      descripcion: form.descripcion,
      fecha_vencimiento: form.fecha_vencimiento,
    });
    if (!error) onCreated();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Nuevo Vencimiento</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
            <select required value={form.cliente_id} onChange={e => setForm({...form, cliente_id: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="">Seleccionar...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="certificado">Certificado</option>
              <option value="registro">Registro</option>
              <option value="habilitacion">Habilitación</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción *</label>
            <input required value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
              placeholder="Ej: Certificado INAL producto X"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento *</label>
            <input type="date" required value={form.fecha_vencimiento} onChange={e => setForm({...form, fecha_vencimiento: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
