import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  X,
  Link2,
  AlertCircle,
  CheckCircle,
  Target,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  presupuestoId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface PresupuestoItem {
  id: number;
  concepto: string;
  tipo: string;
  monto: number;
  expediente_id: string | null;
  direccionado: boolean;
}

interface Expediente {
  id: string;
  codigo: string;
  tramite_tipos: {
    nombre: string;
    codigo: string;
  };
}

export function DireccionadorPresupuesto({
  presupuestoId,
  onClose,
  onSuccess
}: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PresupuestoItem[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedExpedientes, setSelectedExpedientes] = useState<{
    [itemId: number]: string | null;
  }>({});

  useEffect(() => {
    loadData();
  }, [presupuestoId]);

  const loadData = async () => {
    setLoading(true);

    const { data: presupuesto } = await supabase
      .from('presupuestos')
      .select('proyecto_id')
      .eq('id', presupuestoId)
      .single();

    if (!presupuesto) {
      setLoading(false);
      return;
    }

    const [itemsResult, expedientesResult] = await Promise.all([
      supabase
        .from('presupuesto_items')
        .select('*')
        .eq('presupuesto_id', presupuestoId)
        .order('id'),
      supabase
        .from('expedientes')
        .select(`
          id,
          codigo,
          tramite_tipos (nombre, codigo)
        `)
        .eq('proyecto_id', presupuesto.proyecto_id)
        .order('codigo')
    ]);

    if (itemsResult.data) {
      setItems(itemsResult.data);
      const initialSelection: { [itemId: number]: string | null } = {};
      itemsResult.data.forEach((item) => {
        initialSelection[item.id] = item.expediente_id;
      });
      setSelectedExpedientes(initialSelection);
    }

    if (expedientesResult.data) {
      setExpedientes(expedientesResult.data as any);
    }

    setLoading(false);
  };

  const handleExpedienteChange = (itemId: number, expedienteId: string | null) => {
    setSelectedExpedientes({
      ...selectedExpedientes,
      [itemId]: expedienteId
    });
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const updates = Object.entries(selectedExpedientes).map(
        ([itemId, expedienteId]) => {
          const itemIdNum = parseInt(itemId);
          return supabase
            .from('presupuesto_items')
            .update({
              expediente_id: expedienteId === 'null' ? null : expedienteId,
              direccionado: expedienteId !== null,
              fecha_direccionado: expedienteId ? new Date().toISOString() : null,
              direccionado_por: expedienteId ? user?.id : null
            })
            .eq('id', itemIdNum);
        }
      );

      const results = await Promise.all(updates);

      const hasError = results.some((result) => result.error);

      if (hasError) {
        throw new Error('Error al actualizar algunos items');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error guardando direccionamiento:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const itemsSinDireccionar = items.filter(
    (item) => !selectedExpedientes[item.id] || selectedExpedientes[item.id] === 'null'
  );

  const itemsDireccionados = items.filter(
    (item) => selectedExpedientes[item.id] && selectedExpedientes[item.id] !== 'null'
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Direccionar Items del Presupuesto</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-blue-100">
            Asigna cada item del presupuesto a un expediente específico
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {expedientes.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">No hay expedientes disponibles</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Este proyecto no tiene expedientes creados. Crea al menos un expediente para poder direccionar los items del presupuesto.
                  </p>
                </div>
              </div>
            </div>
          )}

          {itemsSinDireccionar.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Items Sin Direccionar ({itemsSinDireccionar.length})
                </h3>
              </div>
              <div className="space-y-3">
                {itemsSinDireccionar.map((item) => (
                  <div
                    key={item.id}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{item.concepto}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-slate-600 capitalize">
                            {item.tipo?.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-semibold text-blue-600">
                            ${item.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <div className="w-64">
                        <select
                          value={selectedExpedientes[item.id] || 'null'}
                          onChange={(e) =>
                            handleExpedienteChange(
                              item.id,
                              e.target.value === 'null' ? null : e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          disabled={expedientes.length === 0}
                        >
                          <option value="null">Sin asignar (gasto general)</option>
                          {expedientes.map((exp) => (
                            <option key={exp.id} value={exp.id}>
                              {exp.codigo} - {exp.tramite_tipos.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {itemsDireccionados.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-slate-800">
                  Items Direccionados ({itemsDireccionados.length})
                </h3>
              </div>
              <div className="space-y-3">
                {itemsDireccionados.map((item) => {
                  const expediente = expedientes.find(
                    (e) => e.id === selectedExpedientes[item.id]
                  );
                  return (
                    <div
                      key={item.id}
                      className="bg-green-50 border border-green-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{item.concepto}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-slate-600 capitalize">
                              {item.tipo?.replace('_', ' ')}
                            </span>
                            <span className="text-sm font-semibold text-blue-600">
                              ${item.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {expediente && (
                            <div className="flex items-center gap-2 mt-2">
                              <Link2 className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">
                                {expediente.codigo} - {expediente.tramite_tipos.nombre}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="w-64">
                          <select
                            value={selectedExpedientes[item.id] || 'null'}
                            onChange={(e) =>
                              handleExpedienteChange(
                                item.id,
                                e.target.value === 'null' ? null : e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            disabled={expedientes.length === 0}
                          >
                            <option value="null">Sin asignar (gasto general)</option>
                            {expedientes.map((exp) => (
                              <option key={exp.id} value={exp.id}>
                                {exp.codigo} - {exp.tramite_tipos.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No hay items en el presupuesto</p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-600">
              <span className="font-medium">Progreso:</span>{' '}
              {itemsDireccionados.length} de {items.length} items direccionados
            </div>
            <div className="flex items-center gap-2">
              <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all duration-300"
                  style={{
                    width: `${items.length > 0 ? (itemsDireccionados.length / items.length) * 100 : 0}%`
                  }}
                ></div>
              </div>
              <span className="text-sm font-medium text-slate-700">
                {items.length > 0
                  ? Math.round((itemsDireccionados.length / items.length) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
