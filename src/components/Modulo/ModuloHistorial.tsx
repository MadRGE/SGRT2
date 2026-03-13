/**
 * ModuloHistorial — Timeline of changes for a tramite or gestion.
 * Shows who did what and when, with color-coded action types.
 */
import { useState, useEffect } from 'react';
import {
  Clock, User, FileText, CheckCircle, AlertTriangle, MessageSquare,
  ArrowRight, Loader2, Plus, Send,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  tramiteId?: string;
  gestionId?: string;
}

interface SeguimientoRow {
  id: string;
  tipo: string;
  descripcion: string;
  usuario_nombre: string | null;
  created_at: string;
}

const TIPO_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  nota: { icon: MessageSquare, color: 'bg-blue-100 text-blue-600', label: 'Nota' },
  estado: { icon: ArrowRight, color: 'bg-amber-100 text-amber-600', label: 'Cambio de estado' },
  documento: { icon: FileText, color: 'bg-violet-100 text-violet-600', label: 'Documento' },
  aprobacion: { icon: CheckCircle, color: 'bg-green-100 text-green-600', label: 'Aprobación' },
  alerta: { icon: AlertTriangle, color: 'bg-red-100 text-red-600', label: 'Alerta' },
  creacion: { icon: Plus, color: 'bg-emerald-100 text-emerald-600', label: 'Creación' },
  envio: { icon: Send, color: 'bg-cyan-100 text-cyan-600', label: 'Envío' },
};

export default function ModuloHistorial({ tramiteId, gestionId }: Props) {
  const [items, setItems] = useState<SeguimientoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadHistory(); }, [tramiteId, gestionId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('seguimientos')
        .select('id, tipo, descripcion, usuario_nombre, created_at')
        .order('created_at', { ascending: false });

      if (tramiteId) query = query.eq('tramite_id', tramiteId);
      if (gestionId) query = query.eq('gestion_id', gestionId);

      const { data } = await query.limit(50);
      setItems(data || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const addNote = async () => {
    if (!newNote.trim() || adding) return;
    setAdding(true);
    try {
      await supabase.from('seguimientos').insert({
        tramite_id: tramiteId || null,
        tipo: 'nota',
        descripcion: newNote.trim(),
        usuario_nombre: 'Usuario', // Will come from auth context
        created_at: new Date().toISOString(),
      });
      setNewNote('');
      await loadHistory();
    } catch (err) {
      console.error('Error adding note:', err);
    }
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add note */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-end gap-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Agregar una nota al historial..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
          <button
            onClick={addNote}
            disabled={!newNote.trim() || adding}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Agregar
          </button>
        </div>
      </div>

      {/* Timeline */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Sin historial todavía</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

          <div className="space-y-0">
            {items.map((item, i) => {
              const config = TIPO_CONFIG[item.tipo] || TIPO_CONFIG.nota;
              const Icon = config.icon;
              const date = new Date(item.created_at);
              const isFirst = i === 0;

              return (
                <div key={item.id} className="relative flex gap-4 py-3">
                  {/* Icon dot */}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color} ${
                    isFirst ? 'ring-2 ring-white shadow-sm' : ''
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {config.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        {' '}
                        {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.usuario_nombre && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.usuario_nombre}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">{item.descripcion}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
