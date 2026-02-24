import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase, softDelete, buildSeguimientoData } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatFileSize } from '../lib/storage';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import { TRAMITE_TRANSITIONS, isTransitionAllowed } from '../lib/estadoTransitions';
import {
  TRAMITE_ESTADOS, TRAMITE_ESTADO_LABELS, TRAMITE_ESTADO_COLORS_BORDER,
  DOC_ESTADO_LABELS, DOC_ESTADO_COLORS, DOC_ESTADO_NEXT,
  SEMAFORO_OPTIONS, PRIORIDADES,
} from '../lib/constants/estados';
import { ORGANISMOS, PLATAFORMAS, RESPONSABLES } from '../lib/constants/enums';
import { ArrowLeft, Clock, Loader2, Save, Pencil, X, Plus, FileCheck, Trash2, CheckCircle2, AlertCircle, AlertTriangle, Link2, Upload, Download, Paperclip } from 'lucide-react';
import SeguimientoSection from '../components/Tramite/SeguimientoSection';

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
  cantidad_registros_envase: number | null;
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
  documento_cliente_id: string | null;
  archivo_path: string | null;
  archivo_nombre: string | null;
  archivo_size: number | null;
  created_at: string;
}

interface DocCliente {
  id: string;
  nombre: string;
  estado: string;
  categoria: string;
  fecha_vencimiento: string | null;
}

interface Seguimiento {
  id: string;
  descripcion: string;
  created_at: string;
  usuario_nombre?: string | null;
}


export default function TramiteDetailV2({ tramiteId, onNavigate }: Props) {
  const { user } = useAuth();
  const [tramite, setTramite] = useState<Tramite | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState('');
  const [savingSeg, setSavingSeg] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Tramite>>({});
  const [showDocForm, setShowDocForm] = useState(false);
  const [showLinkDocForm, setShowLinkDocForm] = useState(false);
  const [docsCliente, setDocsCliente] = useState<DocCliente[]>([]);
  const [docForm, setDocForm] = useState({ nombre: '', obligatorio: false, responsable: '' });
  const [savingDoc, setSavingDoc] = useState(false);

  const {
    uploadingDocId, uploadError, setUploadError, fileInputRef,
    triggerUpload, handleFileSelected, handleDownloadFile, handleRemoveFile,
  } = useDocumentUpload({
    storagePath: `tramites/${tramiteId}`,
    tableName: 'documentos_tramite',
    onSuccess: () => loadData(),
  });

  useEffect(() => { loadData(); }, [tramiteId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
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

      // Load client documents for linking
      if (t?.cliente_id) {
        const { data: clientDocs } = await supabase
          .from('documentos_cliente')
          .select('id, nombre, estado, categoria, fecha_vencimiento')
          .eq('cliente_id', t.cliente_id)
          .order('nombre', { ascending: true });
        setDocsCliente(clientDocs || []);
      }
    } catch (e) {
      console.warn('Error:', e);
      setError('Error al cargar datos. Verifique su conexión.');
    }
    setLoading(false);
  };

  const handleAddSeguimiento = async () => {
    if (!nuevoSeguimiento.trim()) return;
    setSavingSeg(true);

    const { error } = await supabase.from('seguimientos').insert(
      buildSeguimientoData({ tramite_id: tramiteId, descripcion: nuevoSeguimiento.trim() }, user)
    );

    if (!error) {
      setNuevoSeguimiento('');
      loadData();
    }
    setSavingSeg(false);
  };

  const [saveError, setSaveError] = useState('');

  const handleChangeEstado = async (nuevoEstado: string) => {
    if (tramite?.estado === nuevoEstado) return;
    setSaveError('');

    if (!isTransitionAllowed(TRAMITE_TRANSITIONS, tramite!.estado, nuevoEstado)) {
      setSaveError(`No se puede cambiar de "${TRAMITE_ESTADO_LABELS[tramite!.estado]}" a "${TRAMITE_ESTADO_LABELS[nuevoEstado]}"`);
      return;
    }

    const { error } = await supabase
      .from('tramites')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', tramiteId);

    if (error) {
      console.error('Error cambiando estado:', error);
      setSaveError(error.message || 'Error al cambiar estado. Ejecutá la migración 69.');
    } else {
      await supabase.from('seguimientos').insert(
        buildSeguimientoData({ tramite_id: tramiteId, descripcion: `Estado cambiado a: ${TRAMITE_ESTADO_LABELS[nuevoEstado] || nuevoEstado}` }, user)
      );
      loadData();
    }
  };

  const handleChangeSemaforo = async (nuevoSemaforo: string) => {
    if (tramite?.semaforo === nuevoSemaforo) return;
    setSaveError('');

    const semaforoLabel = nuevoSemaforo === 'verde' ? 'Verde' : nuevoSemaforo === 'amarillo' ? 'Amarillo' : 'Rojo';

    const { error } = await supabase
      .from('tramites')
      .update({ semaforo: nuevoSemaforo, updated_at: new Date().toISOString() })
      .eq('id', tramiteId);

    if (error) {
      console.error('Error cambiando semáforo:', error);
      setSaveError(error.message || 'Error al cambiar semáforo');
    } else {
      await supabase.from('seguimientos').insert(
        buildSeguimientoData({ tramite_id: tramiteId, descripcion: `Semaforo cambiado a: ${semaforoLabel}` }, user)
      );
      loadData();
    }
  };

  const handleChangeProgreso = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.round((x / rect.width) * 100);
    const clamped = Math.max(0, Math.min(100, Math.round(pct / 5) * 5));
    setSaveError('');

    const { error } = await supabase
      .from('tramites')
      .update({ progreso: clamped, updated_at: new Date().toISOString() })
      .eq('id', tramiteId);

    if (error) {
      console.error('Error actualizando progreso:', error);
      setSaveError(error.message || 'Error al actualizar progreso');
    } else {
      loadData();
    }
  };

  const handleSaveEdit = async () => {
    setSaveError('');
    setSavingEdit(true);
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
        cantidad_registros_envase: (editForm as any).cantidad_registros_envase || null,
        notas: editForm.notas || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tramiteId);

    if (error) {
      // If error is about missing column (cantidad_registros_envase), retry without it
      if (error.message?.includes('schema cache') || error.message?.includes('cantidad_registros_envase')) {
        const { error: e2 } = await supabase.from('tramites').update({
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
        }).eq('id', tramiteId);
        if (e2) {
          console.error('Error guardando trámite (fallback):', e2);
          setSaveError(e2.message || 'Error al guardar.');
        } else {
          setEditing(false);
          loadData();
        }
      } else {
        console.error('Error guardando trámite:', error);
        setSaveError(error.message || 'Error al guardar.');
      }
    } else {
      setEditing(false);
      loadData();
    }
    setSavingEdit(false);
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
    toast.success('Documento eliminado');
    loadData();
  };

  const handleLinkDocCliente = async (docCliente: DocCliente) => {
    // Check if this client doc is already linked to this tramite
    const alreadyLinked = documentos.some(d => d.documento_cliente_id === docCliente.id);
    if (alreadyLinked) return;

    const { error } = await supabase.from('documentos_tramite').insert({
      tramite_id: tramiteId,
      nombre: docCliente.nombre,
      documento_cliente_id: docCliente.id,
      estado: docCliente.estado === 'vigente' ? 'aprobado' : 'pendiente',
      obligatorio: true,
      responsable: null,
    });

    if (!error) {
      setShowLinkDocForm(false);
      loadData();
    }
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

  if (!tramite) {
    return <div className="text-center py-20 text-slate-500">Trámite no encontrado</div>;
  }

  const progreso = tramite.progreso ?? 0;
  const docsAprobados = documentos.filter(d => d.estado === 'aprobado').length;
  const docsPendientes = documentos.filter(d => d.estado === 'pendiente' && d.obligatorio);
  const docsRechazados = documentos.filter(d => d.estado === 'rechazado');
  const docsTotal = documentos.length;

  // Sort: pending obligatorio first, then pending optional, then presentado, then rechazado, then aprobado
  const docsSorted = [...documentos].sort((a, b) => {
    const order: Record<string, number> = { pendiente: 0, rechazado: 1, presentado: 2, aprobado: 3, vencido: 1 };
    const aScore = (order[a.estado] ?? 2) + (a.obligatorio ? -0.5 : 0);
    const bScore = (order[b.estado] ?? 2) + (b.obligatorio ? -0.5 : 0);
    return aScore - bScore;
  });

  const backTarget = tramite.gestion_id
    ? { type: 'gestion', id: tramite.gestion_id }
    : { type: 'tramites' };
  const backLabel = tramite.gestion_id ? 'Volver a Gestión' : 'Volver a Trámites';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt,.zip,.rar"
        onChange={handleFileSelected}
      />

      {/* Back button */}
      <button onClick={() => onNavigate(backTarget)} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </button>

      {/* ===== HEADER CARD ===== */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-[26px] tracking-tight font-bold text-slate-800">{tramite.titulo}</h1>
            <p className="text-sm text-slate-400 mt-0.5">Detalle del trámite</p>
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
                Gestión: {(tramite.gestiones as any)?.nombre}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <>
                <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                  <Pencil className="w-4 h-4" /> Editar
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('¿Eliminar este trámite? Se enviará a la papelera.')) return;
                    await softDelete('tramites', 'id', tramite.id);
                    toast.success('Trámite enviado a la papelera');
                    onNavigate(backTarget);
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
          {TRAMITE_ESTADOS.map((e) => {
            const isCurrent = tramite.estado === e;
            const isAllowed = isCurrent || isTransitionAllowed(TRAMITE_TRANSITIONS, tramite.estado, e);
            return (
              <button
                key={e}
                onClick={() => isAllowed && handleChangeEstado(e)}
                disabled={!isAllowed}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                  isCurrent
                    ? TRAMITE_ESTADO_COLORS_BORDER[e]
                    : isAllowed
                    ? 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 cursor-pointer'
                    : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
                }`}
                title={!isAllowed && !isCurrent ? `No se puede cambiar desde "${TRAMITE_ESTADO_LABELS[tramite.estado]}"` : undefined}
              >
                {TRAMITE_ESTADO_LABELS[e]}
              </button>
            );
          })}
        </div>

        {/* Semaforo selector */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-xs font-medium text-slate-500">Semáforo:</span>
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

        {saveError && !editing && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
            {saveError}
          </div>
        )}

        {/* Editable details */}
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
                <select value={editForm.tipo || 'registro'} onChange={e => setEditForm({...editForm, tipo: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                  <option value="registro">Registro</option>
                  <option value="habilitacion">Habilitación</option>
                  <option value="certificacion">Certificación</option>
                  <option value="importacion">Importación</option>
                  <option value="exportacion">Exportación</option>
                  <option value="inspeccion">Inspección</option>
                  <option value="autorizacion">Autorización</option>
                  <option value="renovacion">Renovación</option>
                  <option value="modificacion">Modificación</option>
                  <option value="otro">Otro</option>
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
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Cant. Reg. Envase</label>
                <input type="number" min="0" value={(editForm as any).cantidad_registros_envase ?? ''} onChange={e => setEditForm({...editForm, cantidad_registros_envase: parseInt(e.target.value) || null} as any)}
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
            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {saveError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditing(false); setEditForm(tramite); setSaveError(''); }} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                <X className="w-4 h-4 inline mr-1" /> Cancelar
              </button>
              <button onClick={handleSaveEdit} disabled={savingEdit} className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50">
                {savingEdit ? <><Loader2 className="w-4 h-4 inline mr-1 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4 inline mr-1" /> Guardar</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 pt-4 border-t border-slate-100">
            <InfoField label="Tipo" value={tramite.tipo?.charAt(0).toUpperCase() + tramite.tipo?.slice(1).replace(/_/g, ' ')} />
            <InfoField label="Organismo" value={tramite.organismo} />
            <InfoField label="Prioridad" value={tramite.prioridad?.charAt(0).toUpperCase() + tramite.prioridad?.slice(1)} />
            <InfoField label="Plataforma" value={tramite.plataforma} />
            <InfoField label="N. Expediente" value={tramite.numero_expediente} />
            <InfoField label="Fecha Inicio" value={tramite.fecha_inicio ? new Date(tramite.fecha_inicio).toLocaleDateString('es-AR') : null} />
            <InfoField label="Vencimiento" value={tramite.fecha_vencimiento ? new Date(tramite.fecha_vencimiento).toLocaleDateString('es-AR') : null} />
            {tramite.monto_presupuesto != null && <InfoField label="Presupuesto" value={`$${tramite.monto_presupuesto.toLocaleString('es-AR')}`} />}
            {tramite.cantidad_registros_envase != null && tramite.cantidad_registros_envase > 0 && <InfoField label="Reg. Envase" value={`${tramite.cantidad_registros_envase}`} />}
            {tramite.descripcion && <div className="col-span-2"><InfoField label="Descripción" value={tramite.descripcion} /></div>}
            {tramite.notas && <div className="col-span-2"><InfoField label="Notas" value={tramite.notas} /></div>}
          </div>
        )}
      </div>

      {/* ===== ALERT: MISSING DOCS ===== */}
      {(docsPendientes.length > 0 || docsRechazados.length > 0) && (
        <div className={`rounded-2xl p-4 border-2 ${docsRechazados.length > 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className={`w-5 h-5 ${docsRechazados.length > 0 ? 'text-red-600' : 'text-yellow-600'}`} />
            <h3 className={`font-semibold text-sm ${docsRechazados.length > 0 ? 'text-red-800' : 'text-yellow-800'}`}>
              {docsPendientes.length > 0 && `${docsPendientes.length} documento${docsPendientes.length > 1 ? 's' : ''} obligatorio${docsPendientes.length > 1 ? 's' : ''} pendiente${docsPendientes.length > 1 ? 's' : ''}`}
              {docsPendientes.length > 0 && docsRechazados.length > 0 && ' · '}
              {docsRechazados.length > 0 && `${docsRechazados.length} rechazado${docsRechazados.length > 1 ? 's' : ''}`}
            </h3>
          </div>
          <div className="space-y-1 ml-7">
            {docsPendientes.map(d => (
              <div key={d.id} className="flex items-center gap-2 text-sm text-yellow-800">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                <span>{d.nombre}</span>
                {d.responsable && <span className="text-xs opacity-60">({d.responsable})</span>}
              </div>
            ))}
            {docsRechazados.map(d => (
              <div key={d.id} className="flex items-center gap-2 text-sm text-red-700">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>{d.nombre}</span>
                <span className="text-xs font-medium">- Rechazado, debe presentar nuevamente</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== DOCUMENTOS CARD ===== */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-400" />
            Documentación ({docsTotal})
          </h2>
          <div className="flex gap-2">
            {docsCliente.length > 0 && (
              <button
                onClick={() => setShowLinkDocForm(!showLinkDocForm)}
                className="flex items-center gap-1 text-sm border border-blue-300 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Link2 className="w-4 h-4" /> Del Cliente
              </button>
            )}
            <button
              onClick={() => setShowDocForm(!showDocForm)}
              className="flex items-center gap-1 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/25"
            >
              <Plus className="w-4 h-4" /> Nuevo
            </button>
          </div>
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

        {/* Link client document panel */}
        {showLinkDocForm && (
          <div className="p-4 border-b border-slate-100 bg-blue-50/50">
            <p className="text-xs font-medium text-slate-600 mb-2">Documentos disponibles del cliente (click para vincular):</p>
            <div className="flex flex-wrap gap-2">
              {docsCliente.map(dc => {
                const alreadyLinked = documentos.some(d => d.documento_cliente_id === dc.id);
                const isVencido = dc.estado === 'vencido' || (dc.fecha_vencimiento && new Date(dc.fecha_vencimiento) < new Date());
                return (
                  <button
                    key={dc.id}
                    onClick={() => !alreadyLinked && handleLinkDocCliente(dc)}
                    disabled={alreadyLinked}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                      alreadyLinked
                        ? 'bg-green-50 text-green-600 border-green-200 cursor-default'
                        : isVencido
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {alreadyLinked ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : isVencido ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : (
                      <Link2 className="w-3 h-3" />
                    )}
                    {dc.nombre}
                    {alreadyLinked && <span className="text-[10px]">vinculado</span>}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowLinkDocForm(false)}
              className="mt-2 text-xs text-slate-500 hover:text-slate-700"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {uploadError}
            <button onClick={() => setUploadError('')} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
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
            {docsSorted.map((doc) => {
              const isPending = doc.estado === 'pendiente';
              const isApproved = doc.estado === 'aprobado';
              const isRejected = doc.estado === 'rechazado';

              return (
                <div key={doc.id} className={`p-4 flex items-center gap-3 ${
                  isPending && doc.obligatorio ? 'bg-yellow-50/40' :
                  isRejected ? 'bg-red-50/40' : ''
                }`}>
                  {/* Checklist icon */}
                  {isApproved ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : isRejected ? (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : doc.estado === 'presentado' ? (
                    <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  ) : doc.obligatorio ? (
                    <div className="w-5 h-5 rounded-full border-2 border-yellow-400 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${isApproved ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {doc.nombre}
                      </span>
                      {doc.obligatorio && !isApproved && (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">OBLIGATORIO</span>
                      )}
                      {doc.documento_cliente_id && (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Link2 className="w-2.5 h-2.5" /> CLIENTE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {doc.responsable && (
                        <span className="text-xs text-slate-400">Responsable: {doc.responsable}</span>
                      )}
                      {doc.archivo_nombre && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {doc.archivo_nombre}
                          {doc.archivo_size != null && ` (${formatFileSize(doc.archivo_size)})`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* File upload/download */}
                  <div className="flex items-center gap-1">
                    {doc.archivo_path ? (
                      <>
                        <button
                          onClick={() => handleDownloadFile(doc.archivo_path!, doc.archivo_nombre || doc.nombre)}
                          className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                          title="Descargar archivo"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => doc.archivo_path && handleRemoveFile(doc.id, doc.archivo_path)}
                          className="text-slate-300 hover:text-orange-500 transition-colors p-1"
                          title="Quitar archivo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : uploadingDocId === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : (
                      <button
                        onClick={() => triggerUpload(doc.id)}
                        className="text-slate-300 hover:text-blue-500 transition-colors p-1"
                        title="Subir archivo"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
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
              );
            })}
          </div>
        )}
      </div>

      {/* ===== SEGUIMIENTOS CARD ===== */}
      <SeguimientoSection
        seguimientos={seguimientos}
        nuevoSeguimiento={nuevoSeguimiento}
        setNuevoSeguimiento={setNuevoSeguimiento}
        savingSeg={savingSeg}
        onAddSeguimiento={handleAddSeguimiento}
      />
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
