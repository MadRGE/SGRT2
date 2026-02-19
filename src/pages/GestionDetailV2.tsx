import { useState, useEffect } from 'react';
import { supabase, softDelete, buildSeguimientoData } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { GESTION_TRANSITIONS, isTransitionAllowed } from '../lib/estadoTransitions';
import {
  ArrowLeft, Plus, FileText, ChevronRight, Loader2, Pencil, Save, X,
  FolderOpen, BarChart3, Receipt, AlertTriangle, Clock, CheckCircle2,
  MessageSquare, Phone, Mail, FileCheck, Send, Trash2
} from 'lucide-react';

interface Props {
  gestionId: string;
  onNavigate: (page: any) => void;
}

interface Gestion {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  prioridad: string;
  fecha_inicio: string | null;
  fecha_cierre: string | null;
  observaciones: string | null;
  cliente_id: string;
  clientes: { id: string; razon_social: string; telefono: string | null; email: string | null } | null;
}

interface TramiteRow {
  id: string;
  titulo: string;
  organismo: string | null;
  estado: string;
  semaforo: string | null;
  progreso: number | null;
  fecha_vencimiento: string | null;
  monto_presupuesto: number | null;
}

interface DocTramite {
  id: string;
  nombre: string;
  estado: string;
  obligatorio: boolean;
  tramite_id: string;
}

interface Seguimiento {
  id: string;
  descripcion: string;
  tipo: string;
  tramite_id: string | null;
  gestion_id: string | null;
  created_at: string;
  usuario_nombre?: string | null;
}

const ESTADOS = ['relevamiento', 'en_curso', 'en_espera', 'finalizado', 'archivado'];

const ESTADO_LABELS: Record<string, string> = {
  relevamiento: 'Relevamiento', en_curso: 'En Curso', en_espera: 'En Espera',
  finalizado: 'Finalizado', archivado: 'Archivado',
};

const ESTADO_COLORS: Record<string, string> = {
  relevamiento: 'bg-purple-100 text-purple-700 border-purple-300',
  en_curso: 'bg-blue-100 text-blue-700 border-blue-300',
  en_espera: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  finalizado: 'bg-green-100 text-green-700 border-green-300',
  archivado: 'bg-slate-100 text-slate-700 border-slate-300',
};

const PRIORIDADES = ['baja', 'normal', 'alta', 'urgente'];

const TRAMITE_ESTADO_LABELS: Record<string, string> = {
  consulta: 'Consulta', presupuestado: 'Presupuestado', en_curso: 'En Curso',
  esperando_cliente: 'Esp. Cliente', esperando_organismo: 'Esp. Organismo',
  observado: 'Observado', aprobado: 'Aprobado', rechazado: 'Rechazado', vencido: 'Vencido',
};

const TRAMITE_ESTADO_COLORS: Record<string, string> = {
  consulta: 'bg-slate-100 text-slate-600', presupuestado: 'bg-purple-100 text-purple-700',
  en_curso: 'bg-blue-100 text-blue-700', esperando_cliente: 'bg-yellow-100 text-yellow-700',
  esperando_organismo: 'bg-orange-100 text-orange-700', observado: 'bg-red-100 text-red-700',
  aprobado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700', vencido: 'bg-red-100 text-red-700',
};

const SEMAFORO_COLORS: Record<string, string> = {
  verde: 'bg-green-500', amarillo: 'bg-yellow-400', rojo: 'bg-red-500',
};

const TIPO_SEGUIMIENTO = [
  { value: 'nota', label: 'Nota', icon: MessageSquare },
  { value: 'llamada', label: 'Llamada', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'documento', label: 'Documento', icon: FileCheck },
];

type Tab = 'tramites' | 'actividad' | 'resumen';

export default function GestionDetailV2({ gestionId, onNavigate }: Props) {
  const { user } = useAuth();
  const [gestion, setGestion] = useState<Gestion | null>(null);
  const [tramites, setTramites] = useState<TramiteRow[]>([]);
  const [docsTramite, setDocsTramite] = useState<DocTramite[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Gestion>>({});
  const [tab, setTab] = useState<Tab>('tramites');
  const [nuevoSeg, setNuevoSeg] = useState('');
  const [tipoSeg, setTipoSeg] = useState('nota');
  const [savingSeg, setSavingSeg] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { loadData(); }, [gestionId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: g } = await supabase
        .from('gestiones')
        .select('*, clientes(id, razon_social, telefono, email)')
        .eq('id', gestionId)
        .single();

      if (g) { setGestion(g as any); setEditForm(g); }

      const { data: t } = await supabase
        .from('tramites')
        .select('id, titulo, organismo, estado, semaforo, progreso, fecha_vencimiento, monto_presupuesto')
        .eq('gestion_id', gestionId)
        .order('created_at', { ascending: false });

      setTramites((t as any) || []);

      // Load docs for all tramites
      if (t && t.length > 0) {
        const ids = t.map(tr => tr.id);
        const { data: dt } = await supabase.from('documentos_tramite')
          .select('id, nombre, estado, obligatorio, tramite_id')
          .in('tramite_id', ids);
        setDocsTramite(dt || []);
      }

      // Load seguimientos: both gestion-level and tramite-level
      const tramiteIds = (t || []).map(tr => tr.id);
      let segQuery = supabase.from('seguimientos')
        .select('id, descripcion, tipo, tramite_id, gestion_id, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch gestion seguimientos + tramite seguimientos in one go
      if (tramiteIds.length > 0) {
        segQuery = segQuery.or(`gestion_id.eq.${gestionId},tramite_id.in.(${tramiteIds.join(',')})`);
      } else {
        segQuery = segQuery.eq('gestion_id', gestionId);
      }

      const { data: s } = await segQuery;
      setSeguimientos(s || []);
    } catch (e) {
      console.warn('Error:', e);
      setError('Error al cargar datos. Verifique su conexión.');
    }
    setLoading(false);
  };

  const handleChangeEstado = async (nuevoEstado: string) => {
    if (gestion?.estado === nuevoEstado) return;
    setSaveError('');

    if (!isTransitionAllowed(GESTION_TRANSITIONS, gestion!.estado, nuevoEstado)) {
      setSaveError(`No se puede cambiar de "${ESTADO_LABELS[gestion!.estado]}" a "${ESTADO_LABELS[nuevoEstado]}"`);
      return;
    }

    const { error } = await supabase
      .from('gestiones')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', gestionId);

    if (error) {
      console.error('Error cambiando estado:', error);
      setSaveError(error.message || 'Error al cambiar estado');
    } else {
      await supabase.from('seguimientos').insert(
        buildSeguimientoData({ gestion_id: gestionId, descripcion: `Estado cambiado a: ${ESTADO_LABELS[nuevoEstado] || nuevoEstado}`, tipo: 'nota' }, user)
      );
      loadData();
    }
  };

  const handleSaveEdit = async () => {
    setSaveError('');
    setSavingEdit(true);

    const { error } = await supabase
      .from('gestiones')
      .update({
        nombre: editForm.nombre,
        descripcion: editForm.descripcion || null,
        prioridad: editForm.prioridad,
        fecha_inicio: editForm.fecha_inicio || null,
        fecha_cierre: editForm.fecha_cierre || null,
        observaciones: editForm.observaciones || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gestionId);

    if (error) {
      console.error('Error guardando gestión:', error);
      setSaveError(error.message || 'Error al guardar');
    } else {
      setEditing(false);
      loadData();
    }
    setSavingEdit(false);
  };

  const handleAddSeguimiento = async () => {
    if (!nuevoSeg.trim()) return;
    setSavingSeg(true);

    const { error } = await supabase.from('seguimientos').insert(
      buildSeguimientoData({ gestion_id: gestionId, descripcion: nuevoSeg.trim(), tipo: tipoSeg }, user)
    );

    if (!error) {
      setNuevoSeg('');
      loadData();
    }
    setSavingSeg(false);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-slate-600 mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  if (!gestion) {
    return <div className="text-center py-20 text-slate-500">Gestión no encontrada</div>;
  }

  // ===== Computed data =====
  const totalTramites = tramites.length;
  const estadoCounts: Record<string, number> = {};
  tramites.forEach(t => { estadoCounts[t.estado] = (estadoCounts[t.estado] || 0) + 1; });

  // Pending items
  const esperandoCliente = tramites.filter(t => t.estado === 'esperando_cliente');
  const observados = tramites.filter(t => t.estado === 'observado');
  const docsPendientes = docsTramite.filter(d => d.estado === 'pendiente' && d.obligatorio);
  const vencimientos = tramites.filter(t => t.fecha_vencimiento && new Date(t.fecha_vencimiento) < new Date() && t.estado !== 'aprobado');
  const pendingCount = esperandoCliente.length + observados.length + docsPendientes.length + vencimientos.length;

  // Financials
  const totalPresupuesto = tramites.reduce((sum, t) => sum + (t.monto_presupuesto || 0), 0);
  const tramitesAprobados = tramites.filter(t => t.estado === 'aprobado').length;
  const progresoGeneral = totalTramites > 0 ? Math.round(tramites.reduce((sum, t) => sum + (t.progreso || 0), 0) / totalTramites) : 0;

  // Active progress estados for bar
  const progressEstados = [
    { key: 'consulta', label: 'Consulta', color: 'bg-slate-400' },
    { key: 'presupuestado', label: 'Presupuestado', color: 'bg-purple-400' },
    { key: 'en_curso', label: 'En Curso', color: 'bg-blue-500' },
    { key: 'esperando_cliente', label: 'Esp. Cliente', color: 'bg-yellow-400' },
    { key: 'esperando_organismo', label: 'Esp. Organismo', color: 'bg-orange-400' },
    { key: 'observado', label: 'Observado', color: 'bg-red-400' },
    { key: 'aprobado', label: 'Aprobado', color: 'bg-green-500' },
    { key: 'rechazado', label: 'Rechazado', color: 'bg-red-600' },
    { key: 'vencido', label: 'Vencido', color: 'bg-red-300' },
  ];
  const activeProgressEstados = progressEstados.filter(e => (estadoCounts[e.key] || 0) > 0);

  // Days active
  const diasActivos = gestion.fecha_inicio
    ? Math.ceil((new Date().getTime() - new Date(gestion.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => onNavigate({ type: 'gestiones' })} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Volver a Gestiones
      </button>

      {/* ===== HEADER CARD ===== */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-[26px] tracking-tight font-bold text-slate-800">{gestion.nombre}</h1>
            <p className="text-sm text-slate-400 mt-0.5">Proyecto y sus trámites asociados</p>
            <button
              onClick={() => onNavigate({ type: 'cliente', id: gestion.cliente_id })}
              className="text-sm text-blue-600 hover:text-blue-700 mt-1"
            >
              {(gestion.clientes as any)?.razon_social}
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
              gestion.prioridad === 'urgente' ? 'bg-red-100 text-red-700' :
              gestion.prioridad === 'alta' ? 'bg-orange-100 text-orange-700' :
              gestion.prioridad === 'normal' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {gestion.prioridad?.charAt(0).toUpperCase() + gestion.prioridad?.slice(1)}
            </span>
            {totalTramites > 0 && (
              <button
                onClick={() => onNavigate({ type: 'presupuesto', gestionId })}
                className="flex items-center gap-1 text-sm border border-green-300 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Receipt className="w-4 h-4" /> Presupuesto
              </button>
            )}
            {!editing && (
              <>
                <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                  <Pencil className="w-4 h-4" /> Editar
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('¿Eliminar esta gestión? Se enviará a la papelera.')) return;
                    await softDelete('tramites', 'gestion_id', gestionId);
                    await softDelete('gestiones', 'id', gestionId);
                    onNavigate({ type: 'gestiones' });
                  }}
                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Estado selector pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {ESTADOS.map(e => {
            const isCurrent = gestion.estado === e;
            const isAllowed = isCurrent || isTransitionAllowed(GESTION_TRANSITIONS, gestion.estado, e);
            return (
              <button
                key={e}
                onClick={() => isAllowed && handleChangeEstado(e)}
                disabled={!isAllowed}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                  isCurrent
                    ? ESTADO_COLORS[e]
                    : isAllowed
                    ? 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 cursor-pointer'
                    : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
                }`}
                title={!isAllowed && !isCurrent ? `No se puede cambiar desde "${ESTADO_LABELS[gestion.estado]}"` : undefined}
              >
                {ESTADO_LABELS[e]}
              </button>
            );
          })}
        </div>

        {saveError && !editing && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
            {saveError}
          </div>
        )}

        {/* Quick stats row */}
        <div className="grid grid-cols-5 gap-3 pt-4 border-t border-slate-100">
          <MiniStat label="Trámites" value={totalTramites} />
          <MiniStat label="Aprobados" value={tramitesAprobados} color={tramitesAprobados > 0 ? 'text-green-600' : undefined} />
          <MiniStat label="Avance" value={`${progresoGeneral}%`} />
          <MiniStat label="Pendientes" value={pendingCount} color={pendingCount > 0 ? 'text-yellow-600' : undefined} />
          {diasActivos != null && <MiniStat label="Días activo" value={diasActivos} />}
          {diasActivos == null && totalPresupuesto > 0 && <MiniStat label="Presupuesto" value={`$${(totalPresupuesto / 1000).toFixed(0)}k`} />}
        </div>

        {/* Edit form */}
        {editing && (
          <div className="space-y-4 pt-4 mt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
                <input value={editForm.nombre || ''} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Prioridad</label>
                <select value={editForm.prioridad || 'normal'} onChange={e => setEditForm({ ...editForm, prioridad: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha Inicio</label>
                <input type="date" value={editForm.fecha_inicio || ''} onChange={e => setEditForm({ ...editForm, fecha_inicio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fecha Cierre</label>
                <input type="date" value={editForm.fecha_cierre || ''} onChange={e => setEditForm({ ...editForm, fecha_cierre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descripción</label>
              <textarea value={editForm.descripcion || ''} onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })} rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Observaciones</label>
              <textarea value={editForm.observaciones || ''} onChange={e => setEditForm({ ...editForm, observaciones: e.target.value })} rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {saveError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditing(false); setEditForm(gestion); setSaveError(''); }} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                <X className="w-4 h-4 inline mr-1" /> Cancelar
              </button>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50">
                {savingEdit ? <><Loader2 className="w-4 h-4 inline mr-1 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4 inline mr-1" /> Guardar</>}
              </button>
            </div>
          </div>
        )}

        {/* Read-only details */}
        {!editing && (gestion.descripcion || gestion.observaciones || gestion.fecha_inicio) && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 pt-4 mt-4 border-t border-slate-100">
            <InfoField label="Fecha Inicio" value={gestion.fecha_inicio ? new Date(gestion.fecha_inicio).toLocaleDateString('es-AR') : null} />
            <InfoField label="Fecha Cierre" value={gestion.fecha_cierre ? new Date(gestion.fecha_cierre).toLocaleDateString('es-AR') : null} />
            {gestion.descripcion && <div className="col-span-2"><InfoField label="Descripción" value={gestion.descripcion} /></div>}
            {gestion.observaciones && <div className="col-span-2"><InfoField label="Observaciones" value={gestion.observaciones} /></div>}
          </div>
        )}
      </div>

      {/* ===== ALERT: PENDING ITEMS ===== */}
      {pendingCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800 text-sm">Requiere atención ({pendingCount})</h3>
          </div>
          <div className="space-y-1.5">
            {esperandoCliente.map(t => (
              <PendingItem key={t.id} label={t.titulo} detail="Esperando respuesta del cliente" color="text-yellow-800"
                onClick={() => onNavigate({ type: 'tramite', id: t.id })} />
            ))}
            {observados.map(t => (
              <PendingItem key={t.id} label={t.titulo} detail="Observado por organismo" color="text-red-700"
                onClick={() => onNavigate({ type: 'tramite', id: t.id })} />
            ))}
            {vencimientos.map(t => (
              <PendingItem key={t.id} label={t.titulo} detail={`Vencido: ${new Date(t.fecha_vencimiento!).toLocaleDateString('es-AR')}`} color="text-red-700"
                onClick={() => onNavigate({ type: 'tramite', id: t.id })} />
            ))}
            {docsPendientes.slice(0, 5).map(d => {
              const tramite = tramites.find(t => t.id === d.tramite_id);
              return (
                <PendingItem key={d.id} label={d.nombre} detail={tramite ? `Doc para: ${tramite.titulo}` : 'Documento pendiente'} color="text-orange-700"
                  onClick={() => tramite && onNavigate({ type: 'tramite', id: tramite.id })} />
              );
            })}
          </div>
        </div>
      )}

      {/* ===== TABS ===== */}
      <div className="flex gap-2">
        <TabBtn active={tab === 'tramites'} onClick={() => setTab('tramites')} count={totalTramites}>Trámites</TabBtn>
        <TabBtn active={tab === 'actividad'} onClick={() => setTab('actividad')} count={seguimientos.length}>Actividad</TabBtn>
        <TabBtn active={tab === 'resumen'} onClick={() => setTab('resumen')}>Resumen</TabBtn>
      </div>

      {/* ===== TAB: TRAMITES ===== */}
      {tab === 'tramites' && (
        <>
          {/* Progress overview */}
          {totalTramites > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-4">
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
                {activeProgressEstados.map(e => {
                  const count = estadoCounts[e.key] || 0;
                  return (
                    <div key={e.key} className={`${e.color} transition-all`}
                      style={{ width: `${(count / totalTramites) * 100}%` }}
                      title={`${e.label}: ${count}`} />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {activeProgressEstados.map(e => (
                  <div key={e.key} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${e.color}`} />
                    <span className="text-xs text-slate-500">{e.label}</span>
                    <span className="text-xs font-semibold text-slate-700">{estadoCounts[e.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tramites list */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-slate-400" />
                Trámites ({totalTramites})
              </h2>
              <button
                onClick={() => onNavigate({ type: 'nuevo-tramite', gestionId })}
                className="flex items-center gap-1 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/25"
              >
                <Plus className="w-4 h-4" /> Nuevo Trámite
              </button>
            </div>

            {totalTramites === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Esta gestión no tiene trámites</p>
                <button
                  onClick={() => onNavigate({ type: 'nuevo-tramite', gestionId })}
                  className="mt-2 text-xs text-blue-600 font-semibold hover:text-blue-700"
                >
                  Crear el primer trámite
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/80">
                {tramites.map(t => {
                  const progreso = t.progreso ?? 0;
                  const semaforoColor = t.semaforo ? (SEMAFORO_COLORS[t.semaforo] || 'bg-slate-300') : null;
                  const tDocs = docsTramite.filter(d => d.tramite_id === t.id);
                  const docsOk = tDocs.filter(d => d.estado === 'aprobado').length;
                  const needsAttention = t.estado === 'esperando_cliente' || t.estado === 'observado';

                  return (
                    <button
                      key={t.id}
                      onClick={() => onNavigate({ type: 'tramite', id: t.id })}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left ${
                        needsAttention ? 'bg-yellow-50/50' : ''
                      }`}
                    >
                      {semaforoColor ? (
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${semaforoColor}`} />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-slate-200" />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{t.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {t.organismo && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t.organismo}</span>}
                          {tDocs.length > 0 && (
                            <span className="text-xs text-slate-400">{docsOk}/{tDocs.length} docs</span>
                          )}
                          {t.fecha_vencimiento && (
                            <span className={`text-xs ${new Date(t.fecha_vencimiento) < new Date() && t.estado !== 'aprobado' ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                              Vence: {new Date(t.fecha_vencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${progreso >= 100 ? 'bg-green-500' : progreso >= 50 ? 'bg-blue-500' : 'bg-blue-400'}`}
                              style={{ width: `${Math.min(progreso, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-8 text-right">{progreso}%</span>
                        </div>
                      </div>

                      <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${TRAMITE_ESTADO_COLORS[t.estado] || 'bg-slate-100'}`}>
                        {TRAMITE_ESTADO_LABELS[t.estado] || t.estado}
                      </span>

                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== TAB: ACTIVIDAD ===== */}
      {tab === 'actividad' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          {/* Add note */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex gap-2 mb-2">
              {TIPO_SEGUIMIENTO.map(ts => (
                <button key={ts.value} onClick={() => setTipoSeg(ts.value)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                    tipoSeg === ts.value
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}>
                  <ts.icon className="w-3 h-3" /> {ts.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={nuevoSeg}
                onChange={e => setNuevoSeg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSeguimiento()}
                placeholder="Agregar nota, llamada, email..."
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
              <button
                onClick={handleAddSeguimiento}
                disabled={savingSeg || !nuevoSeg.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-xl hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-4 h-4" /> {savingSeg ? '...' : 'Guardar'}
              </button>
            </div>
          </div>

          {/* Timeline */}
          {seguimientos.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin actividad todavía</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/80">
              {seguimientos.map(s => {
                const tramite = s.tramite_id ? tramites.find(t => t.id === s.tramite_id) : null;
                const tipoInfo = TIPO_SEGUIMIENTO.find(ts => ts.value === s.tipo);
                const TipoIcon = tipoInfo?.icon || MessageSquare;

                return (
                  <div key={s.id} className="p-4 flex gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      s.tipo === 'llamada' ? 'bg-green-50 text-green-600' :
                      s.tipo === 'email' ? 'bg-blue-50 text-blue-600' :
                      s.tipo === 'documento' ? 'bg-purple-50 text-purple-600' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      <TipoIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{s.descripcion}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-400">{formatDate(s.created_at)}</p>
                        {s.usuario_nombre && (
                          <span className="text-xs text-slate-400">&middot; {s.usuario_nombre}</span>
                        )}
                        {tramite && (
                          <button
                            onClick={() => onNavigate({ type: 'tramite', id: tramite.id })}
                            className="text-xs text-blue-500 hover:text-blue-600"
                          >
                            {tramite.titulo}
                          </button>
                        )}
                        {!tramite && s.gestion_id && (
                          <span className="text-xs text-slate-300">Gestión</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB: RESUMEN ===== */}
      {tab === 'resumen' && (
        <div className="space-y-4">
          {/* Financial summary */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-slate-400" />
              Resumen financiero
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-slate-800">${totalPresupuesto.toLocaleString('es-AR')}</p>
                <p className="text-xs text-slate-400 mt-0.5">Presupuesto total</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-slate-800">{totalTramites}</p>
                <p className="text-xs text-slate-400 mt-0.5">Trámites</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-slate-800">
                  {totalTramites > 0 ? `$${Math.round(totalPresupuesto / totalTramites).toLocaleString('es-AR')}` : '$0'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Promedio por trámite</p>
              </div>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              Estado de trámites
            </h2>
            {totalTramites === 0 ? (
              <p className="text-sm text-slate-400">Sin trámites</p>
            ) : (
              <div className="space-y-2">
                {progressEstados.filter(e => (estadoCounts[e.key] || 0) > 0).map(e => {
                  const count = estadoCounts[e.key] || 0;
                  const pct = Math.round((count / totalTramites) * 100);
                  return (
                    <div key={e.key} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${e.color} flex-shrink-0`} />
                      <span className="text-sm text-slate-600 w-32">{e.label}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${e.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Key dates */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-slate-400" />
              Fechas y plazos
            </h2>
            <div className="space-y-3">
              {gestion.fecha_inicio && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm text-slate-600">Inicio:</span>
                  <span className="text-sm font-medium text-slate-800">{new Date(gestion.fecha_inicio).toLocaleDateString('es-AR')}</span>
                  {diasActivos != null && <span className="text-xs text-slate-400">({diasActivos} días)</span>}
                </div>
              )}
              {gestion.fecha_cierre && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-slate-600">Cierre estimado:</span>
                  <span className="text-sm font-medium text-slate-800">{new Date(gestion.fecha_cierre).toLocaleDateString('es-AR')}</span>
                </div>
              )}
              {tramites.filter(t => t.fecha_vencimiento).sort((a, b) =>
                new Date(a.fecha_vencimiento!).getTime() - new Date(b.fecha_vencimiento!).getTime()
              ).map(t => (
                <div key={t.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg"
                  onClick={() => onNavigate({ type: 'tramite', id: t.id })}>
                  <div className={`w-2 h-2 rounded-full ${new Date(t.fecha_vencimiento!) < new Date() ? 'bg-red-500' : 'bg-orange-400'}`} />
                  <span className="text-sm text-slate-600 truncate flex-1">{t.titulo}</span>
                  <span className={`text-sm font-medium ${new Date(t.fecha_vencimiento!) < new Date() ? 'text-red-600' : 'text-slate-800'}`}>
                    {new Date(t.fecha_vencimiento!).toLocaleDateString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Docs overview */}
          {docsTramite.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <FileCheck className="w-4 h-4 text-slate-400" />
                Documentación ({docsTramite.filter(d => d.estado === 'aprobado').length}/{docsTramite.length} aprobados)
              </h2>
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 mb-3">
                <div className="h-full bg-green-500" style={{ width: `${(docsTramite.filter(d => d.estado === 'aprobado').length / docsTramite.length) * 100}%` }} />
                <div className="h-full bg-blue-400" style={{ width: `${(docsTramite.filter(d => d.estado === 'presentado').length / docsTramite.length) * 100}%` }} />
                <div className="h-full bg-red-400" style={{ width: `${(docsTramite.filter(d => d.estado === 'rechazado').length / docsTramite.length) * 100}%` }} />
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Aprobados: {docsTramite.filter(d => d.estado === 'aprobado').length}</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> Presentados: {docsTramite.filter(d => d.estado === 'presentado').length}</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300" /> Pendientes: {docsTramite.filter(d => d.estado === 'pendiente').length}</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Rechazados: {docsTramite.filter(d => d.estado === 'rechazado').length}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ======= Sub-components =======

function InfoField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{value || '\u2014'}</p>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-bold ${color || 'text-slate-800'}`}>{value}</p>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function PendingItem({ label, detail, color, onClick }: { label: string; detail: string; color: string; onClick?: () => void }) {
  return (
    <div onClick={onClick}
      className={`flex items-center gap-2 text-sm ${color} cursor-pointer hover:opacity-80`}>
      <div className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      <span className="font-medium">{label}</span>
      <span className="text-xs opacity-70">- {detail}</span>
      <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
    </div>
  );
}

function TabBtn({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
        active ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent'
      }`}>
      {children}
      {count != null && count > 0 && <span className="ml-1.5 text-xs text-slate-400">({count})</span>}
    </button>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = diff / (1000 * 60 * 60);
  const days = hours / 24;

  if (hours < 1) return 'Hace minutos';
  if (hours < 24) return `Hace ${Math.floor(hours)} hs`;
  if (days < 7) return `Hace ${Math.floor(days)} días`;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}
