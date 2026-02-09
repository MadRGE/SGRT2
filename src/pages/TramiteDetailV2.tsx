import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Clock, Loader2, Save, Pencil, X, Plus, FileCheck, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

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
  semaforo: string | null;
  progreso: number | null;
  prioridad: string;
  plataforma: string | null;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  numero_expediente: string | null;
  monto_presupuesto: number | null;
  notas: string | null;
  cliente_id: string;
  gestion_id: string | null;
  clientes: { id: string; razon_social: string } | null;
  gestiones: { id: string; nombre: string } | null;
}

interface Documento {
  id: string;
  nombre: string;
  estado: string;
  obligatorio: boolean;
  responsable: string | null;
  created_at: string;
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

const DOC_ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente', presentado: 'Presentado', aprobado: 'Aprobado',
  rechazado: 'Rechazado', vencido: 'Vencido',
};

const DOC_ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-slate-100 text-slate-600',
  presentado: 'bg-blue-100 text-blue-700',
  aprobado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700',
  vencido: 'bg-orange-100 text-orange-700',
};

const DOC_ESTADO_NEXT: Record<string, string> = {
  pendiente: 'presentado',
  presentado: 'aprobado',
  aprobado: 'pendiente',
  rechazado: 'pendiente',
  vencido: 'pendiente',
};

const SEMAFORO_OPTIONS = [
  { value: 'verde', color: 'bg-green-500', ring: 'ring-green-300' },
  { value: 'amarillo', color: 'bg-yellow-400', ring: 'ring-yellow-300' },
  { value: 'rojo', color: 'bg-red-500', ring: 'ring-red-300' },
];

const ORGANISMOS = ['ANMAT', 'INAL', 'SENASA', 'CITES', 'RENPRE', 'ENACOM', 'ANMAC', 'SEDRONAR', 'Aduana', 'Otro'];
const PLATAFORMAS = ['TAD', 'TADO', 'VUCE', 'SIGSA', 'Otro'];
const PRIORIDADES = ['baja', 'normal', 'alta', 'urgente'];
const RESPONSABLES = ['Estudio', 'Cliente', 'Organismo'];

export default function TramiteDetailV2({ tramiteId, onNavigate }: Props) {
  const [tramite, setTramite] = useState<Tramite | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState('');
  const [savingSeg, setSavingSeg] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Tramite>>({});
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ nombre: '', obligatorio: false, responsable: '' });
  const [savingDoc, setSavingDoc] = useState(false);

  useEffect(() => { loadData(); }, [tramiteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: t } = await supabase
        .from('tramites')
        .select('*, clientes(id, razon_social), gestiones(id, nombre)')
        .eq('id', tramiteId)
        .single();

      if (t) { setTramite(t as any); setEditForm(t); }

      const { data: d } = await supabase
        .from('documentos_tramite')
        .select('*')
        .eq('tramite_id', tramiteId)
        .order('created_at', { ascending: true });

      setDocumentos(d || []);

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
    if (tramite?.estado === nuevoEstado) return;

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

  const handleChangeSemaforo = async (nuevoSemaforo: string) => {
    if (tramite?.semaforo === nuevoSemaforo) return;

    const semaforoLabel = nuevoSemaforo === 'verde' ? 'Verde' : nuevoSemaforo === 'amarillo' ? 'Amarillo' : 'Rojo';

    const { error } = await supabase
      .from('tramites')
      .update({ semaforo: nuevoSemaforo, updated_at: new Date().toISOString() })
      .eq('id', tramiteId);

    if (!error) {
      await supabase.from('seguimientos').insert({
        tramite_id: tramiteId,
        descripcion: `Semaforo cambiado a: ${semaforoLabel}`,
      });
      loadData();
    }
  };

  const handleChangeProgreso = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.round((x / rect.width) * 100);
    const clamped = Math.max(0, Math.min(100, Math.round(pct / 5) * 5));

    const { error } = await supabase
      .from('tramites')
      .update({ progreso: clamped, updated_at: new Date().toISOString() })
      .eq('id', tramiteId);

    if (!error) loadData();
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from('tramites')
      .update({
        titulo: editForm.titulo,
        tipo: editForm.tipo,
        organismo: editForm.organismo || null,
        plataforma: editForm.plataforma || null,
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

  const handleAddDocumento = async () => {
    if (!docForm.nombre.trim()) return;
    setSavingDoc(true);

    const { error } = await supabase.from('documentos_tramite').insert({
      tramite_id: tramiteId,
      nombre: docForm.nombre.trim(),
      obligatorio: docForm.obligatorio,
      responsable: docForm.responsable || null,
      estado: 'pendiente',
    });

    if (!error) {
      setDocForm({ nombre: '', obligatorio: false, responsable: '' });
      setShowDocForm(false);
      loadData();
    }
    setSavingDoc(false);
  };

  const handleCycleDocEstado = async (doc: Documento) => {
    const nextEstado = DOC_ESTADO_NEXT[doc.estado] || 'pendiente';

    const { error } = await supabase
      .from('documentos_tramite')
      .update({ estado: nextEstado })
      .eq('id', doc.id);

    if (!error) loadData();
  };

  const handleSetDocRechazado = async (doc: Documento) => {
    const { error } = await supabase
      .from('documentos_tramite')
      .update({ estado: 'rechazado' })
      .eq('id', doc.id);

    if (!error) loadData();
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    await supabase.from('documentos_tramite').delete().eq('id', docId);
    loadData();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!tramite) {
    return <div className="text-center py-20 text-slate-500">Tramite no encontrado</div>;
  }

  const progreso = tramite.progreso ?? 0;
  const docsAprobados = documentos.filter(d => d.estado === 'aprobado').length;
  const docsTotal = documentos.length;

  const backTarget = tramite.gestion_id
    ? { type: 'gestion', id: tramite.gestion_id }
    : { type: 'tramites' };
  const backLabel = tramite.gestion_id ? 'Volver a Gestion' : 'Volver a Tramites';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button onClick={() => onNavigate(backTarget)} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </button>

      {/* ===== HEADER CARD ===== */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-[26px] tracking-tight font-bold text-slate-800">{tramite.titulo}</h1>
            <p className="text-sm text-slate-400 mt-0.5">Detalle del tramite</p>
            <button
              onClick={() => onNavigate({ type: 'cliente', id: tramite.cliente_id })}
              className="text-sm text-blue-600 hover:text-blue-700 mt-1 block"
            >
              {(tramite.clientes as any)?.razon_social}
            </button>
            {tramite.gestiones && (
              <button
                onClick={() => onNavigate({ type: 'gestion', id: tramite.gestion_id })}
                className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 block"
              >
                Gestion: {(tramite.gestiones as any)?.nombre}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                <Pencil className="w-4 h-4" /> Editar
              </button>
            )}
          </div>
        </div>

        {/* Estado selector pills */}
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

        {/* Semaforo selector */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-xs font-medium text-slate-500">Semaforo:</span>
          <div className="flex items-center gap-2">
            {SEMAFORO_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => handleChangeSemaforo(s.value)}
                className={`w-5 h-5 rounded-full transition-all ${s.color} ${
                  tramite.semaforo === s.value
                    ? `ring-2 ${s.ring} ring-offset-2 scale-110`
                    : 'opacity-40 hover:opacity-70'
                }`}
                title={s.value.charAt(0).toUpperCase() + s.value.slice(1)}
              />
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-500">Progreso</span>
            <span className="text-xs font-semibold text-slate-700">{progreso}%</span>
          </div>
          <div
            className="w-full h-3 bg-slate-100 rounded-full overflow-hidden cursor-pointer group"
            onClick={handleChangeProgreso}
            title="Click para ajustar progreso"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progreso >= 100 ? 'bg-green-500' :
                progreso >= 50 ? 'bg-blue-500' :
                'bg-blue-400'
              } group-hover:opacity-80`}
              style={{ width: `${Math.min(progreso, 100)}%` }}
            />
          </div>
        </div>

        {/* Editable details */}
        {editing ? (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Titulo</label>
                <input value={editForm.titulo || ''} onChange={e => setEditForm({...editForm, titulo: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                <select value={editForm.tipo || 'importacion'} onChange={e => setEditForm({...editForm, tipo: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                  <option value="importacion">Importacion</option>
                  <option value="exportacion">Exportacion</option>
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
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Plataforma</label>
                <select value={editForm.plataforma || ''} onChange={e => setEditForm({...editForm, plataforma: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                  <option value="">Sin definir</option>
                  {PLATAFORMAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha Vencimiento</label>
                <input type="date" value={editForm.fecha_vencimiento || ''} onChange={e => setEditForm({...editForm, fecha_vencimiento: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">N. Expediente</label>
                <input value={editForm.numero_expediente || ''} onChange={e => setEditForm({...editForm, numero_expediente: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Presupuesto ($)</label>
                <input type="number" value={editForm.monto_presupuesto ?? ''} onChange={e => setEditForm({...editForm, monto_presupuesto: parseFloat(e.target.value) || null})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descripcion</label>
              <textarea value={editForm.descripcion || ''} onChange={e => setEditForm({...editForm, descripcion: e.target.value})} rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Notas</label>
              <textarea value={editForm.notas || ''} onChange={e => setEditForm({...editForm, notas: e.target.value})} rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditing(false); setEditForm(tramite); }} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                <X className="w-4 h-4 inline mr-1" /> Cancelar
              </button>
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25">
                <Save className="w-4 h-4 inline mr-1" /> Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 pt-4 border-t border-slate-100">
            <InfoField label="Tipo" value={tramite.tipo === 'importacion' ? 'Importacion' : 'Exportacion'} />
            <InfoField label="Organismo" value={tramite.organismo} />
            <InfoField label="Prioridad" value={tramite.prioridad?.charAt(0).toUpperCase() + tramite.prioridad?.slice(1)} />
            <InfoField label="Plataforma" value={tramite.plataforma} />
            <InfoField label="N. Expediente" value={tramite.numero_expediente} />
            <InfoField label="Fecha Inicio" value={tramite.fecha_inicio ? new Date(tramite.fecha_inicio).toLocaleDateString('es-AR') : null} />
            <InfoField label="Vencimiento" value={tramite.fecha_vencimiento ? new Date(tramite.fecha_vencimiento).toLocaleDateString('es-AR') : null} />
            {tramite.monto_presupuesto != null && <InfoField label="Presupuesto" value={`$${tramite.monto_presupuesto.toLocaleString('es-AR')}`} />}
            {tramite.descripcion && <div className="col-span-2"><InfoField label="Descripcion" value={tramite.descripcion} /></div>}
            {tramite.notas && <div className="col-span-2"><InfoField label="Notas" value={tramite.notas} /></div>}
          </div>
        )}
      </div>

      {/* ===== DOCUMENTOS CARD ===== */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-400" />
            Documentacion ({docsTotal})
          </h2>
          <button
            onClick={() => setShowDocForm(!showDocForm)}
            className="flex items-center gap-1 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" /> Agregar Documento
          </button>
        </div>

        {/* Inline add document form */}
        {showDocForm && (
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre del documento</label>
                <input
                  value={docForm.nombre}
                  onChange={e => setDocForm({ ...docForm, nombre: e.target.value })}
                  placeholder="Ej: Certificado de Origen"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium text-slate-500 mb-1">Responsable</label>
                <select
                  value={docForm.responsable}
                  onChange={e => setDocForm({ ...docForm, responsable: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Sin asignar</option>
                  {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 pb-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={docForm.obligatorio}
                  onChange={e => setDocForm({ ...docForm, obligatorio: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-600">Obligatorio</span>
              </label>
              <div className="flex gap-2 pb-0.5">
                <button
                  onClick={() => { setShowDocForm(false); setDocForm({ nombre: '', obligatorio: false, responsable: '' }); }}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddDocumento}
                  disabled={savingDoc || !docForm.nombre.trim()}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                >
                  {savingDoc ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress summary */}
        {docsTotal > 0 && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${docsTotal > 0 ? (docsAprobados / docsTotal) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                {docsAprobados}/{docsTotal} documentos aprobados
              </span>
            </div>
          </div>
        )}

        {/* Document list */}
        {docsTotal === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin documentos registrados</p>
            <button onClick={() => setShowDocForm(true)} className="mt-2 text-xs text-blue-600 font-semibold hover:text-blue-700">
              Agregar el primer documento
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {documentos.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center gap-3">
                {/* Obligatorio indicator */}
                {doc.obligatorio ? (
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" title="Obligatorio" />
                ) : (
                  <div className="w-4 h-4 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800 truncate">{doc.nombre}</span>
                    {doc.obligatorio && (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">REQ</span>
                    )}
                  </div>
                  {doc.responsable && (
                    <span className="text-xs text-slate-400">Responsable: {doc.responsable}</span>
                  )}
                </div>

                {/* Estado badge - clickable to cycle */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCycleDocEstado(doc)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all hover:opacity-80 ${DOC_ESTADO_COLORS[doc.estado] || 'bg-slate-100 text-slate-600'}`}
                    title="Click para cambiar estado"
                  >
                    {DOC_ESTADO_LABELS[doc.estado] || doc.estado}
                  </button>
                  {doc.estado === 'presentado' && (
                    <button
                      onClick={() => handleSetDocRechazado(doc)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors px-1"
                      title="Rechazar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Delete */}
                <button onClick={() => handleDeleteDoc(doc.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== SEGUIMIENTOS CARD ===== */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Seguimiento</h2>
        </div>

        {/* Add seguimiento */}
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
            <p className="text-sm">Sin seguimientos todavia</p>
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
      <p className="text-sm text-slate-700">{value || '\u2014'}</p>
    </div>
  );
}
