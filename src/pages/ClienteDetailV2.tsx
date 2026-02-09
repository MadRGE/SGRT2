import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, FileText, ChevronRight, Loader2, Pencil, Save, X } from 'lucide-react';

interface Props {
  clienteId: string;
  onNavigate: (page: any) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
  cuit: string | null;
  rne: string | null;
  email: string | null;
  telefono: string | null;
  contacto_nombre: string | null;
  origen: string;
  referido_por: string | null;
  notas: string | null;
}

interface Tramite {
  id: string;
  titulo: string;
  estado: string;
  organismo: string | null;
  tipo: string;
  fecha_vencimiento: string | null;
}

const ESTADO_LABELS: Record<string, string> = {
  consulta: 'Consulta', presupuestado: 'Presupuestado', en_curso: 'En Curso',
  esperando_cliente: 'Esp. Cliente', esperando_organismo: 'Esp. Organismo',
  observado: 'Observado', aprobado: 'Aprobado', rechazado: 'Rechazado', vencido: 'Vencido',
};

const ESTADO_COLORS: Record<string, string> = {
  consulta: 'bg-slate-100 text-slate-600', presupuestado: 'bg-purple-100 text-purple-700',
  en_curso: 'bg-blue-100 text-blue-700', esperando_cliente: 'bg-yellow-100 text-yellow-700',
  esperando_organismo: 'bg-orange-100 text-orange-700', observado: 'bg-red-100 text-red-700',
  aprobado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700', vencido: 'bg-red-100 text-red-700',
};

export default function ClienteDetailV2({ clienteId, onNavigate }: Props) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Cliente>>({});

  useEffect(() => { loadData(); }, [clienteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: c } = await supabase.from('clientes').select('*').eq('id', clienteId).single();
      if (c) { setCliente(c); setEditForm(c); }

      const { data: t } = await supabase
        .from('tramites')
        .select('id, titulo, estado, organismo, tipo, fecha_vencimiento')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

      setTramites(t || []);
    } catch (e) {
      console.warn('Error:', e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('clientes')
      .update({
        razon_social: editForm.razon_social,
        cuit: editForm.cuit || null,
        rne: editForm.rne || null,
        email: editForm.email || null,
        telefono: editForm.telefono || null,
        contacto_nombre: editForm.contacto_nombre || null,
        notas: editForm.notas || null,
      })
      .eq('id', clienteId);

    if (!error) {
      setEditing(false);
      loadData();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!cliente) {
    return <div className="text-center py-20 text-slate-500">Cliente no encontrado</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => onNavigate({ type: 'clientes' })} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Volver a Clientes
      </button>

      {/* Info del cliente */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[26px] tracking-tight font-bold text-slate-800">{cliente.razon_social}</h1>
            <p className="text-sm text-slate-400 mt-0.5">Detalle del cliente</p>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Pencil className="w-4 h-4" /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setEditForm(cliente); }} className="flex items-center gap-1 text-sm text-slate-600">
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button onClick={handleSave} className="flex items-center gap-1 text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 rounded-lg hover:shadow-lg hover:shadow-blue-500/25">
                <Save className="w-4 h-4" /> Guardar
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Razón Social</label>
              <input value={editForm.razon_social || ''} onChange={e => setEditForm({...editForm, razon_social: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">CUIT</label>
              <input value={editForm.cuit || ''} onChange={e => setEditForm({...editForm, cuit: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">RNE</label>
              <input value={editForm.rne || ''} onChange={e => setEditForm({...editForm, rne: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
              <input value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
              <input value={editForm.telefono || ''} onChange={e => setEditForm({...editForm, telefono: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Contacto</label>
              <input value={editForm.contacto_nombre || ''} onChange={e => setEditForm({...editForm, contacto_nombre: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Notas</label>
              <textarea value={editForm.notas || ''} onChange={e => setEditForm({...editForm, notas: e.target.value})} rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <InfoField label="CUIT" value={cliente.cuit} />
            <InfoField label="RNE" value={cliente.rne} />
            <InfoField label="Email" value={cliente.email} />
            <InfoField label="Teléfono" value={cliente.telefono} />
            <InfoField label="Contacto" value={cliente.contacto_nombre} />
            <InfoField label="Origen" value={cliente.origen === 'directo' ? 'Directo' : `Referido${cliente.referido_por ? ` por ${cliente.referido_por}` : ''}`} />
            {cliente.notas && <div className="col-span-2"><InfoField label="Notas" value={cliente.notas} /></div>}
          </div>
        )}
      </div>

      {/* Tramites del cliente */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Trámites ({tramites.length})</h2>
          <button
            onClick={() => onNavigate({ type: 'nuevo-tramite', clienteId })}
            className="flex items-center gap-1 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" /> Nuevo Trámite
          </button>
        </div>

        {tramites.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Este cliente no tiene trámites</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {tramites.map((t) => (
              <button
                key={t.id}
                onClick={() => onNavigate({ type: 'tramite', id: t.id })}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{t.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 capitalize">{t.tipo}</span>
                    {t.organismo && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t.organismo}</span>}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${ESTADO_COLORS[t.estado] || 'bg-slate-100'}`}>
                  {ESTADO_LABELS[t.estado] || t.estado}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{value || '—'}</p>
    </div>
  );
}
