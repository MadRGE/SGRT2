import { useState, useMemo } from 'react';
import { X, GitBranch, CheckSquare, AlertCircle } from 'lucide-react';

interface Expediente {
  id: string;
  codigo: string;
  tramite_tipos: {
    nombre: string;
    codigo: string;
    organismos: {
      sigla: string;
    };
  };
}

interface Props {
  proyectoNombre: string;
  expedientes: Expediente[];
  onConfirm: (selectedExpedienteIds: string[], nuevoNombreProyecto: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function SepararExpedientesModal({ proyectoNombre, expedientes, onConfirm, onClose, loading }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [nuevoNombre, setNuevoNombre] = useState('');

  const toggleExpediente = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const expedientesQuedan = expedientes.length - selectedIds.size;
  const puedeConfirmar = selectedIds.size > 0 && expedientesQuedan > 0 && nuevoNombre.trim().length > 0;

  const nombreSugerido = useMemo(() => {
    if (selectedIds.size === 0) return '';
    const selected = expedientes.filter(e => selectedIds.has(e.id));
    if (selected.length === 1) {
      return selected[0].tramite_tipos.nombre;
    }
    const organismos = [...new Set(selected.map(e => e.tramite_tipos.organismos.sigla))];
    if (organismos.length === 1) {
      return `${organismos[0]} - Múltiples Trámites`;
    }
    return 'Proyecto Separado';
  }, [selectedIds, expedientes]);

  const handleAutoComplete = () => {
    if (nombreSugerido && !nuevoNombre) {
      setNuevoNombre(nombreSugerido);
    }
  };

  const handleConfirm = () => {
    if (puedeConfirmar) {
      onConfirm(Array.from(selectedIds), nuevoNombre.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-start p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Separar Expedientes</h2>
              <p className="text-sm text-slate-600">Proyecto: {proyectoNombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <p className="text-slate-700 mb-4">
              Selecciona los expedientes que deseas mover a un nuevo proyecto. Al menos un expediente debe permanecer en el proyecto actual.
            </p>

            {expedientesQuedan === 0 && selectedIds.size > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Debes dejar al menos un expediente en el proyecto original
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-medium mb-1">Quedan en proyecto actual</p>
                <p className="text-2xl font-bold text-blue-900">{expedientesQuedan}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-700 font-medium mb-1">Van a nuevo proyecto</p>
                <p className="text-2xl font-bold text-green-900">{selectedIds.size}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Selecciona expedientes para mover
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3">
              {expedientes.map((exp) => {
                const isSelected = selectedIds.has(exp.id);
                return (
                  <label
                    key={exp.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleExpediente(exp.id)}
                      className="mt-1 w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
                      disabled={loading}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{exp.tramite_tipos.nombre}</p>
                      <p className="text-sm text-slate-600">{exp.codigo}</p>
                      <span className="inline-block mt-1 text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded-full">
                        {exp.tramite_tipos.organismos.sigla}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre del nuevo proyecto
            </label>
            {nombreSugerido && !nuevoNombre && (
              <button
                onClick={handleAutoComplete}
                className="text-xs text-blue-600 hover:text-blue-700 mb-2"
              >
                Sugerencia: "{nombreSugerido}" - Hacer clic para usar
              </button>
            )}
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Ej: Registro de Producto Alimenticio"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={loading}
            />
          </div>
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
            disabled={loading || !puedeConfirmar}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <GitBranch className="w-4 h-4" />
            )}
            Crear Proyecto Separado
          </button>
        </div>
      </div>
    </div>
  );
}
