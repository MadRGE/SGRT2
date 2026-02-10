import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, FileText, ChevronRight, Loader2, Pencil, Save, X, FolderOpen, BarChart3, Receipt } from 'lucide-react';

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
  clientes: { id: string; razon_social: string } | null;
}

interface TramiteRow {
  id: string;
  titulo: string;
  organismo: string | null;
  estado: string;
  semaforo: string | null;
  progreso: number | null;
}

const ESTADOS = ['relevamiento', 'en_curso', 'en_espera', 'finalizado', 'archivado'];

const ESTADO_LABELS: Record<string, string> = {
  relevamiento: 'Relevamiento',
  en_curso: 'En Curso',
  en_espera: 'En Espera',
  finalizado: 'Finalizado',
  archivado: 'Archivado',
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
  verde: 'bg-green-500',
  amarillo: 'bg-yellow-400',
  rojo: 'bg-red-500',
};

export default function GestionDetailV2({ gestionId, onNavigate }: Props) {
  const [gestion, setGestion] = useState<Gestion | null>(null);
  const [tramites, setTramites] = useState<TramiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Gestion>>({});

  useEffect(() => { loadData(); }, [gestionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: g } = await supabase
        .from('gestiones')
        .select('*, clientes(id, razon_social)')
        .eq('id', gestionId)
        .single();

      if (g) { setGestion(g as any); setEditForm(g); }

      const { data: t } = await supabase
        .from('tramites')
        .select('id, titulo, organismo, estado, semaforo, progreso')
        .eq('gestion_id', gestionId)
        .order('created_at', { ascending: false });

      setTramites((t as any) || []);
    } catch (e) {
      console.warn('Error:', e);
    }
    setLoading(false);
  };

  const handleChangeEstado = async (nuevoEstado: string) => {
    const { error } = await supabase
      .from('gestiones')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('id', gestionId);

    if (!error) loadData();
  };

  const handleSaveEdit = async () => {
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

    if (!error) {
      setEditing(false);
      loadData();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!gestion) {
    return <div className="text-center py-20 text-slate-500">Gestion no encontrada</div>;
  }

  // Progress overview: count tramites by estado
  const estadoCounts: Record<string, number> = {};
  tramites.forEach((t) => {
    estadoCounts[t.estado] = (estadoCounts[t.estado] || 0) + 1;
  });
  const totalTramites = tramites.length;

  // Ordered list of tramite estados for the progress bar
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

  const activeProgressEstados = progressEstados.filter((e) => (estadoCounts[e.key] || 0) > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => onNavigate({ type: 'gestiones' })} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Volver a Gestiones
      </button>

      {/* Header card with estado pills */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-[26px] tracking-tight font-bold text-slate-800">{gestion.nombre}</h1>
          <p className="text-sm text-slate-400 mt-0.5">Proyecto y sus tramites asociados</p>
            <button
              onClick={() => onNavigate({ type: 'cliente', id: gestion.cliente_id })}
              className="text-sm text-blue-600 hover:text-blue-700 mt-1"
            >
              {(gestion.clientes as any)?.razon_social}
            </button>
          </div>
          <div className="flex items-center gap-3">
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
              <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:text-blue-700">
                Editar
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
                gestion.estado === e
                  ? ESTADO_COLORS[e]
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
              }`}
            >
              {ESTADO_LABELS[e]}
            </button>
          ))}
        </div>

        {/* Info section - editable inline */}
        {editing ? (
          <div className="space-y-4 pt-4 border-t border-slate-100">
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
              <label className="block text-xs font-medium text-slate-500 mb-1">Descripcion</label>
              <textarea value={editForm.descripcion || ''} onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })} rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Observaciones</label>
              <textarea value={editForm.observaciones || ''} onChange={e => setEditForm({ ...editForm, observaciones: e.target.value })} rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditing(false); setEditForm(gestion); }} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
                <X className="w-4 h-4 inline mr-1" /> Cancelar
              </button>
              <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25">
                <Save className="w-4 h-4 inline mr-1" /> Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 pt-4 border-t border-slate-100">
            <InfoField label="Fecha Inicio" value={gestion.fecha_inicio ? new Date(gestion.fecha_inicio).toLocaleDateString('es-AR') : null} />
            <InfoField label="Fecha Cierre" value={gestion.fecha_cierre ? new Date(gestion.fecha_cierre).toLocaleDateString('es-AR') : null} />
            {gestion.descripcion && <div className="col-span-2"><InfoField label="Descripcion" value={gestion.descripcion} /></div>}
            {gestion.observaciones && <div className="col-span-2"><InfoField label="Observaciones" value={gestion.observaciones} /></div>}
          </div>
        )}
      </div>

      {/* Progress overview */}
      {totalTramites > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800">Progreso de Tramites</h2>
            <span className="text-xs text-slate-400 ml-auto">{totalTramites} tramite{totalTramites !== 1 ? 's' : ''}</span>
          </div>

          {/* Stacked progress bar */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
            {activeProgressEstados.map((e) => {
              const count = estadoCounts[e.key] || 0;
              const pct = (count / totalTramites) * 100;
              return (
                <div
                  key={e.key}
                  className={`${e.color} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                  title={`${e.label}: ${count}`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {activeProgressEstados.map((e) => {
              const count = estadoCounts[e.key] || 0;
              return (
                <div key={e.key} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${e.color}`} />
                  <span className="text-xs text-slate-500">{e.label}</span>
                  <span className="text-xs font-semibold text-slate-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tramites list */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-400" />
            Tramites ({totalTramites})
          </h2>
          <button
            onClick={() => onNavigate({ type: 'nuevo-tramite', gestionId })}
            className="flex items-center gap-1 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" /> Nuevo Tramite
          </button>
        </div>

        {totalTramites === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Esta gestion no tiene tramites</p>
            <button
              onClick={() => onNavigate({ type: 'nuevo-tramite', gestionId })}
              className="mt-2 text-xs text-blue-600 font-semibold hover:text-blue-700"
            >
              Crear el primer tramite
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {tramites.map((t) => {
              const progreso = t.progreso ?? 0;
              const semaforoColor = t.semaforo ? (SEMAFORO_COLORS[t.semaforo] || 'bg-slate-300') : null;

              return (
                <button
                  key={t.id}
                  onClick={() => onNavigate({ type: 'tramite', id: t.id })}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  {/* Semaforo dot */}
                  {semaforoColor ? (
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${semaforoColor}`} title={`Semaforo: ${t.semaforo}`} />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-slate-200" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{t.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.organismo && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t.organismo}</span>}
                    </div>

                    {/* Progreso bar */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            progreso >= 100 ? 'bg-green-500' :
                            progreso >= 50 ? 'bg-blue-500' :
                            'bg-blue-400'
                          }`}
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
