import { useState, useEffect } from 'react';
import { supabase, filterActive } from '../lib/supabase';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
  clienteId?: string;
  onNavigate: (page: any) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
}

export default function NuevaGestionV2({ clienteId, onNavigate }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cliente_id: clienteId || '',
    nombre: '',
    descripcion: '',
    prioridad: 'normal',
    fecha_inicio: new Date().toISOString().split('T')[0],
    observaciones: '',
  });

  useEffect(() => {
    filterActive(supabase.from('clientes').select('id, razon_social')).order('razon_social')
      .then(({ data }) => { if (data) setClientes(data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('gestiones')
      .insert({
        cliente_id: form.cliente_id,
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        prioridad: form.prioridad,
        fecha_inicio: form.fecha_inicio || null,
        observaciones: form.observaciones || null,
        estado: 'relevamiento',
      })
      .select()
      .single();

    if (!error && data) {
      onNavigate({ type: 'gestion', id: data.id });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => onNavigate({ type: 'gestiones' })} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <h1 className="text-[26px] tracking-tight font-bold text-slate-800 mb-1">Nueva Gestión</h1>
        <p className="text-sm text-slate-400 mt-0.5 mb-6">Crea un nuevo proyecto o contenedor de trámites</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
            <select required value={form.cliente_id} onChange={e => setForm({...form, cliente_id: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
              placeholder="Ej: Importación línea cosméticos 2026"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} rows={3}
              placeholder="Detalles de la gestión..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
              <select value={form.prioridad} onChange={e => setForm({...form, prioridad: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
              <input type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
            <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} rows={3}
              placeholder="Notas adicionales..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => onNavigate({ type: 'gestiones' })}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Creando...</> : 'Crear Gestión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
