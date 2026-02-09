import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Clock, Loader2, Save, Pencil, X } from 'lucide-react';

interface Props {
  tramiteId: string;
  onNavigate: (page: any) => void;
}

interface Tramite {
  id: string;
  titulo: string;
  tipo: string;
  organismo: string | null;
  descripcion: string | null;
  estado: string;
  prioridad: string;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  numero_expediente: string | null;
  monto_presupuesto: number | null;
  notas: string | null;
  cliente_id: string;
  clientes: { id: string; razon_social: string } | null;
}

interface Seguimiento {
  id: string;
  descripcion: string;
  created_at: string;
}

const ESTADOS = [
  'consulta', 'presupuestado', 'en_curso', 'esperando_cliente',
  'esperando_organismo', 'observado', 'aprobado', 'rechazado', 'vencido'
];

const ESTADO_LABELS: Record<string, string> = {
  consulta: 'Consulta', presupuestado: 'Presupuestado', en_curso: 'En Curso',
  esperando_cliente: 'Esperando Cliente', esperando_organismo: 'Esperando Organismo',
  observado: 'Observado', aprobado: 'Aprobado', rechazado: 'Rechazado', vencido: 'Vencido',
};

const ESTADO_COLORS: Record<string, string> = {
  consulta: 'bg-slate-100 text-slate-700 border-slate-300',
  presupuestado: 'bg-purple-100 text-purple-700 border-purple-300',
  en_curso: 'bg-blue-100 text-blue-700 border-blue-300',
  esperando_cliente: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  esperando_organismo: 'bg-orange-100 text-orange-700 border-orange-300',
  observado: 'bg-red-100 text-red-700 border-red-300',
  aprobado: 'bg-green-100 text-green-700 border-green-300',
  rechazado: 'bg-red-100 text-red-700 border-red-300',
  vencido: 'bg-red-100 text-red-700 border-red-300',
};

const ORGANISMOS = ['ANMAT', 'INAL', 'SENASA', 'CITES', 'RENPRE', 'ENACOM', 'ANMAC', 'SEDRONAR', 'Aduana', 'Otro'];
const PRIORIDADES = ['baja', 'normal', 'alta', 'urgente'];

export default function TramiteDetailV2({ tramiteId, onNavigate }: Props) {
  const [tramite, setTramite] = useState<Tramite | null>(null);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState('');
  const [savingSeg, setSavingSeg] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Tramite>>({});

  useEffect(() => { loadData(); }, [tramiteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: t } = await supabase
        .from('tramites')
        .select('*, clientes(id, razon_social)')
        .eq('id', tramiteId)
        .single();

      if (t) { setTramite(t as any); setEditForm(t); }

      const { data: s } = await supabase
        .from('seguimientos')
        .select('*')
        .eq('tramite_id', tramiteId)
        .order('created_at', { ascending: false });

      setSeguimientos(s || []);
    } catch (e) {
      console.warn('Error:', e);
    }
    setLoading(false);
  };

  const handleAddSeguimiento = async () => {
    if (!nuevoSeguimiento.trim()) return;
    setSavingSeg(true);

    const { error } = await supabase.from('seguimientos').insert({
      tramite_id: tramiteId,
      descripcion: nuevoSeguimiento.trim(),
    });

    if (!error) {
      setNuevoSeguimiento('');
      loadData();
    }
    setSavingSeg(false);
  };

  const handleChangeEstado = async (nuevoEstado: string) => {
    const { error } = await supabase
      .from('tramites')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', tramiteId);

    if (!error) {
      await supabase.from('seguimientos').insert({
        tramite_id: tramiteId,
        descripcion: `Estado cambiado a: ${ESTADO_LABELS[nuevoEstado] || nuevoEstado}`,
      });
      loadData();
    }
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from('tramites')
      .update({
        titulo: editForm.titulo,
        tipo: editForm.tipo,
        organismo: editForm.organismo || null,
        descripcion: editForm.descripcion || null,
        prioridad: editForm.prioridad,
        fecha_vencimiento: editForm.fecha_vencimiento || null,
        numero_expediente: editForm.numero_expediente || null,
        monto_presupuesto: editForm.monto_presupuesto || null,
        notas: editForm.notas || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tramiteId);

    if (!error) {
      setEditing(false);
      loadData();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!tramite) {
    return <div className="text-center py-20 text-slate-500">Trámite no encontrado</div>;
  }

  const estadoColor = ESTADO_COLORS[tramite.estado] || 'bg-slate-100';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => onNavigate({ type: 'tramites' })} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Volver a Trámites
      </button>

      {/* Header con estado */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-[26px] tracking-tight font-bold text-slate-800">{tramite.titulo}</h1>
            <p className="text-sm text-slate-400 mt-0.5">Detalle del trámite</p>
            <button
              onClick={() => onNavigate({ type: 'cliente', id: tramite.cliente_id })}
              className="text-sm text-blue-600 hover:text-blue-700 mt-1"
            >
              {(tramite.clientes as any)?.razon_social}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:text-blue-700">
                Editar
              </button>
            )}
          </div>
        </div>

        {/* Estado selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ESTADOS.map((e) => (
            <button
              key={e}
              onClick={() => handleChangeEstado(e)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                tramite.estado === e
                  ? ESTADO_COLORS[e]
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
              }`}
            >
              {ESTADO_LABELS[e]}
            </button>
          ))}
        </div>

        {/* Detalles */}
        {editing ? (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Título</label>
                <input value={editForm.titulo || ''} onChange={e => setEditForm({...editForm, titulo: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                <select value={editForm.tipo || 'importacion'} onChange={e => setEditForm({...editForm, tipo: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                  <option value="importacion">Importación</option>
                  <option value="exportacion">Exportación</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Organismo</label>
                <select value={editForm.organismo || ''} onChange={e => setEditForm({...editForm, organismo: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                  <option value="">Sin definir</option>
                  {ORGANISMOS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Prioridad</label>
                <select value={editForm.prioridad || 'normal'} onChange={e => setEditForm({...editForm, prioridad: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                  {PRIORIDADES.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha Vencimiento</label>
                <input type="date" value={editForm.fecha_vencimiento || ''} onChange={e => setEditForm({...editForm, fecha_vencimiento: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">N° Expediente</label>
                <input value={editForm.numero_expediente || ''} onChange={e => setEditForm({...editForm, numero_expediente: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Presupuesto ($)</label>
                <input type="number" value={editForm.monto_presupuesto || ''} onChange={e => setEditForm({...editForm, monto_presupuesto: parseFloat(e.target.value) || null})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label>
              <textarea value={editForm.descripcion || ''} onChange={e => setEditForm({...editForm, descripcion: e.target.value})} rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Notas</label>
              <textarea value={editForm.notas || ''} onChange={e => setEditForm({...editForm, notas: e.target.value})} rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditing(false); setEditForm(tramite); }} className="px-4 py-2 text-sm border border-slate-300 rounded-lg">Cancelar</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25">
                <Save className="w-4 h-4 inline mr-1" /> Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 pt-4 border-t border-slate-100">
            <InfoField label="Tipo" value={tramite.tipo === 'importacion' ? 'Importación' : 'Exportación'} />
            <InfoField label="Organismo" value={tramite.organismo} />
            <InfoField label="Prioridad" value={tramite.prioridad?.charAt(0).toUpperCase() + tramite.prioridad?.slice(1)} />
            <InfoField label="N° Expediente" value={tramite.numero_expediente} />
            <InfoField label="Fecha Inicio" value={tramite.fecha_inicio ? new Date(tramite.fecha_inicio).toLocaleDateString('es-AR') : null} />
            <InfoField label="Vencimiento" value={tramite.fecha_vencimiento ? new Date(tramite.fecha_vencimiento).toLocaleDateString('es-AR') : null} />
            {tramite.monto_presupuesto && <InfoField label="Presupuesto" value={`$${tramite.monto_presupuesto.toLocaleString('es-AR')}`} />}
            {tramite.descripcion && <div className="col-span-2"><InfoField label="Descripción" value={tramite.descripcion} /></div>}
            {tramite.notas && <div className="col-span-2"><InfoField label="Notas" value={tramite.notas} /></div>}
          </div>
        )}
      </div>

      {/* Seguimientos / Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Seguimiento</h2>
        </div>

        {/* Agregar seguimiento */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex gap-2">
            <input
              value={nuevoSeguimiento}
              onChange={(e) => setNuevoSeguimiento(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSeguimiento()}
              placeholder="Agregar nota de seguimiento..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            <button
              onClick={handleAddSeguimiento}
              disabled={savingSeg || !nuevoSeguimiento.trim()}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
            >
              {savingSeg ? '...' : 'Agregar'}
            </button>
          </div>
        </div>

        {/* Timeline */}
        {seguimientos.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin seguimientos todavía</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {seguimientos.map((s) => (
              <div key={s.id} className="p-4 flex gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{s.descripcion}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(s.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
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
