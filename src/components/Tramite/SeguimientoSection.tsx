import { Clock } from 'lucide-react';

interface Seguimiento {
  id: string;
  descripcion: string;
  created_at: string;
  usuario_nombre?: string | null;
}

interface Props {
  seguimientos: Seguimiento[];
  nuevoSeguimiento: string;
  setNuevoSeguimiento: (value: string) => void;
  savingSeg: boolean;
  onAddSeguimiento: () => void;
}

export default function SeguimientoSection({
  seguimientos,
  nuevoSeguimiento,
  setNuevoSeguimiento,
  savingSeg,
  onAddSeguimiento,
}: Props) {
  return (
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
            onKeyDown={(e) => e.key === 'Enter' && onAddSeguimiento()}
            placeholder="Agregar nota de seguimiento..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
          <button
            onClick={onAddSeguimiento}
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
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-400">
                    {new Date(s.created_at).toLocaleString('es-AR', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  {s.usuario_nombre && (
                    <span className="text-xs text-slate-400">&middot; {s.usuario_nombre}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
