import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
  gestionId?: string;
  clienteId?: string;
  onNavigate: (page: any) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
}

interface Gestion {
  id: string;
  nombre: string;
  cliente_id: string;
  clientes: { razon_social: string } | null;
}

const ORGANISMOS = ['ANMAT', 'INAL', 'SENASA', 'CITES', 'RENPRE', 'ENACOM', 'ANMAC', 'SEDRONAR', 'Aduana', 'Otro'];
const PLATAFORMAS = ['TAD', 'TADO', 'VUCE', 'SIGSA', 'Otro'];

export default function NuevoTramiteV2({ gestionId, clienteId, onNavigate }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    gestion_id: gestionId || '',
    cliente_id: clienteId || '',
    titulo: '',
    tipo: 'importacion',
    organismo: '',
    plataforma: '',
    prioridad: 'normal',
    fecha_vencimiento: '',
    monto_presupuesto: '',
    descripcion: '',
  });

  useEffect(() => {
    supabase.from('clientes').select('id, razon_social').order('razon_social')
      .then(({ data }) => { if (data) setClientes(data); });

    supabase.from('gestiones').select('id, nombre, cliente_id, clientes(razon_social)').order('nombre')
      .then(({ data }) => {
        if (data) {
          setGestiones(data as Gestion[]);
          // If gestionId was provided, auto-fill the cliente from that gestión
          if (gestionId) {
            const gestion = (data as Gestion[]).find(g => g.id === gestionId);
            if (gestion) {
              setForm(prev => ({ ...prev, cliente_id: gestion.cliente_id }));
            }
          }
        }
      });
  }, [gestionId]);

  const handleGestionChange = (gestionIdValue: string) => {
    if (gestionIdValue) {
      const gestion = gestiones.find(g => g.id === gestionIdValue);
      setForm(prev => ({
        ...prev,
        gestion_id: gestionIdValue,
        cliente_id: gestion ? gestion.cliente_id : prev.cliente_id,
      }));
    } else {
      setForm(prev => ({ ...prev, gestion_id: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from('tramites')
      .insert({
        gestion_id: form.gestion_id || null,
        cliente_id: form.cliente_id,
        titulo: form.titulo,
        tipo: form.tipo,
        organismo: form.organismo || null,
        plataforma: form.plataforma || null,
        prioridad: form.prioridad,
        fecha_vencimiento: form.fecha_vencimiento || null,
        monto_presupuesto: form.monto_presupuesto ? parseFloat(form.monto_presupuesto) : null,
        descripcion: form.descripcion || null,
        estado: 'consulta',
        semaforo: 'verde',
        progreso: 0,
      })
      .select()
      .single();

    if (!error && data) {
      onNavigate({ type: 'tramite', id: data.id });
    }
    setLoading(false);
  };

  const handleBack = () => {
    if (gestionId) {
      onNavigate({ type: 'gestion', id: gestionId });
    } else {
      onNavigate({ type: 'tramites' });
    }
  };

  const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={handleBack} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <h1 className="text-[26px] tracking-tight font-bold text-slate-800 mb-1">Nuevo Trámite</h1>
        <p className="text-sm text-slate-400 mt-0.5 mb-6">Crea un nuevo trámite de importación o exportación</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Gestión</label>
            <select value={form.gestion_id} onChange={e => handleGestionChange(e.target.value)} className={inputClass}>
              <option value="">Sin gestión asociada</option>
              {gestiones.map(g => (
                <option key={g.id} value={g.id}>
                  {g.nombre}{g.clientes ? ` — ${g.clientes.razon_social}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
            <select required value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} className={inputClass}>
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
            <input required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: Registro de producto cosmético"
              className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className={inputClass}>
                <option value="importacion">Importación</option>
                <option value="exportacion">Exportación</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organismo</label>
              <select value={form.organismo} onChange={e => setForm({ ...form, organismo: e.target.value })} className={inputClass}>
                <option value="">Sin definir</option>
                {ORGANISMOS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plataforma</label>
              <select value={form.plataforma} onChange={e => setForm({ ...form, plataforma: e.target.value })} className={inputClass}>
                <option value="">Sin definir</option>
                {PLATAFORMAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
              <select value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })} className={inputClass}>
                <option value="baja">Baja</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento</label>
              <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Presupuesto ($)</label>
              <input type="number" value={form.monto_presupuesto} onChange={e => setForm({ ...form, monto_presupuesto: e.target.value })}
                placeholder="0.00"
                className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={3}
              placeholder="Detalles del trámite..."
              className={inputClass} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleBack}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Creando...</> : 'Crear Trámite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
