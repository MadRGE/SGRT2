import { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface Props {
  proyectoNombre: string;
  expedientesCount: number;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export default function EliminarProyectoModal({ proyectoNombre, expedientesCount, onConfirm, onClose, loading }: Props) {
  const [confirmChecked, setConfirmChecked] = useState(false);

  const handleConfirm = () => {
    if (confirmChecked) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex justify-between items-start p-6 border-b border-red-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-800">Eliminar Proyecto</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-red-600" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-700 mb-4">
            ¿Estás seguro de que deseas eliminar permanentemente el proyecto <strong>{proyectoNombre}</strong>?
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 mb-2">Esta acción NO se puede deshacer</p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>Se eliminarán {expedientesCount} expediente{expedientesCount !== 1 ? 's' : ''}</li>
                  <li>Se perderán todos los documentos asociados</li>
                  <li>Se eliminará el presupuesto y pagos</li>
                  <li>Se borrará todo el historial</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 p-4 rounded-lg mb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="mt-1 w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                disabled={loading}
              />
              <span className="text-sm text-slate-700">
                Entiendo que esto eliminará permanentemente el proyecto, todos sus expedientes y no se puede deshacer
              </span>
            </label>
          </div>

          <p className="text-xs text-slate-500 italic">
            Sugerencia: Si no estás seguro, considera archivar el proyecto en lugar de eliminarlo.
          </p>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !confirmChecked}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Eliminar Permanentemente
          </button>
        </div>
      </div>
    </div>
  );
}
