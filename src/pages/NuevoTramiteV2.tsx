import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
  clienteId?: string;
  onNavigate: (page: any) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
}

const ORGANISMOS = ['ANMAT', 'INAL', 'SENASA', 'CITES', 'RENPRE', 'ENACOM', 'ANMAC', 'SEDRONAR', 'Aduana', 'Otro'];

export default function NuevoTramiteV2({ clienteId, onNavigate }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cliente_id: clienteId || '',
    titulo: '',
    tipo: 'importacion',
    organismo: '',
    descripcion: '',
    prioridad: 'normal',
    fecha_vencimiento: '',
    monto_presupuesto: '',
  });

  useEffect(() => {
    supabase.from('clientes').select('id, razon_social').order('razon_social')
      .then(({ data }) => { if (data) setClientes(data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('tramites')
      .insert({
        cliente_id: form.cliente_id,
        titulo: form.titulo,
        tipo: form.tipo,
        organismo: form.organismo || null,
        descripcion: form.descripcion || null,
        prioridad: form.prioridad,
        fecha_vencimiento: form.fecha_vencimiento || null,
        monto_presupuesto: form.monto_presupuesto ? parseFloat(form.monto_presupuesto) : null,
        estado: 'consulta',
      })
      .select()
      .single();

    if (!error && data) {
      onNavigate({ type: 'tramite', id: data.id });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => onNavigate({ type: 'tramites' })} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h1 className="text-xl font-bold text-slate-800 mb-6">Nuevo Trámite</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
            <select required value={form.cliente_id} onChange={e => setForm({...form, cliente_id: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título del trámite *</label>
            <input required value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})}
              placeholder="Ej: Registro de producto cosmético"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="importacion">Importación</option>
                <option value="exportacion">Exportación</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organismo</label>
              <select value={form.organismo} onChange={e => setForm({...form, organismo: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin definir</option>
                {ORGANISMOS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
              <select value={form.prioridad} onChange={e => setForm({...form, prioridad: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento</label>
              <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({...form, fecha_vencimiento: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Presupuesto ($)</label>
            <input type="number" value={form.monto_presupuesto} onChange={e => setForm({...form, monto_presupuesto: e.target.value})}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} rows={3}
              placeholder="Detalles del trámite..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => onNavigate({ type: 'tramites' })}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Creando...</> : 'Crear Trámite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
