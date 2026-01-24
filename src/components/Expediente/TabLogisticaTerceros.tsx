import React, { useState, useEffect } from 'react';
import { Truck, Package, FileCheck, AlertCircle, Calendar, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TareaTercero {
  id: string;
  proveedor_id: string | null;
  descripcion_tarea: string;
  estado: 'pendiente' | 'enviado' | 'en_laboratorio' | 'informe_recibido';
  fecha_envio: string | null;
  fecha_recepcion_informe: string | null;
  url_informe_resultado: string | null;
  notas: string | null;
  created_at: string;
  proveedor?: {
    nombre_razon_social: string;
    tipo: string;
  };
}

interface Tercero {
  id: string;
  nombre_razon_social: string;
  tipo: string;
}

interface TabLogisticaTercerosProps {
  expedienteId: string;
}

export const TabLogisticaTerceros: React.FC<TabLogisticaTercerosProps> = ({ expedienteId }) => {
  const [tareas, setTareas] = useState<TareaTercero[]>([]);
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTarea, setEditingTarea] = useState<TareaTercero | null>(null);

  const [formData, setFormData] = useState({
    proveedor_id: '',
    descripcion_tarea: '',
    estado: 'pendiente' as const,
    fecha_envio: '',
    fecha_recepcion_informe: '',
    notas: ''
  });

  const estadosConfig = {
    pendiente: { label: 'Pendiente', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
    enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-700', icon: Truck },
    en_laboratorio: { label: 'En Laboratorio', color: 'bg-yellow-100 text-yellow-700', icon: Package },
    informe_recibido: { label: 'Informe Recibido', color: 'bg-green-100 text-green-700', icon: FileCheck }
  };

  useEffect(() => {
    fetchData();
  }, [expedienteId]);

  const fetchData = async () => {
    try {
      const [tareasRes, tercerosRes] = await Promise.all([
        supabase
          .from('expediente_tareas_terceros')
          .select(`
            *,
            proveedor:terceros(nombre_razon_social, tipo)
          `)
          .eq('expediente_id', expedienteId)
          .order('created_at', { ascending: false }),
        supabase
          .from('terceros')
          .select('id, nombre_razon_social, tipo')
          .order('nombre_razon_social')
      ]);

      if (tareasRes.error) throw tareasRes.error;
      if (tercerosRes.error) throw tercerosRes.error;

      setTareas(tareasRes.data || []);
      setTerceros(tercerosRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dataToSave = {
        expediente_id: expedienteId,
        proveedor_id: formData.proveedor_id || null,
        descripcion_tarea: formData.descripcion_tarea,
        estado: formData.estado,
        fecha_envio: formData.fecha_envio || null,
        fecha_recepcion_informe: formData.fecha_recepcion_informe || null,
        notas: formData.notas || null
      };

      if (editingTarea) {
        const { error } = await supabase
          .from('expediente_tareas_terceros')
          .update(dataToSave)
          .eq('id', editingTarea.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expediente_tareas_terceros')
          .insert(dataToSave);
        if (error) throw error;
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving tarea:', error);
      alert('Error al guardar la tarea');
    }
  };

  const handleEdit = (tarea: TareaTercero) => {
    setEditingTarea(tarea);
    setFormData({
      proveedor_id: tarea.proveedor_id || '',
      descripcion_tarea: tarea.descripcion_tarea,
      estado: tarea.estado,
      fecha_envio: tarea.fecha_envio ? tarea.fecha_envio.split('T')[0] : '',
      fecha_recepcion_informe: tarea.fecha_recepcion_informe ? tarea.fecha_recepcion_informe.split('T')[0] : '',
      notas: tarea.notas || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta tarea?')) return;

    try {
      const { error } = await supabase
        .from('expediente_tareas_terceros')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting tarea:', error);
      alert('Error al eliminar la tarea');
    }
  };

  const resetForm = () => {
    setFormData({
      proveedor_id: '',
      descripcion_tarea: '',
      estado: 'pendiente',
      fecha_envio: '',
      fecha_recepcion_informe: '',
      notas: ''
    });
    setEditingTarea(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando logística...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Logística y Terceros</h3>
          <p className="text-sm text-gray-600 mt-1">
            Gestión de muestras, ensayos, laboratorios y servicios de terceros
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Tarea
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">
            {editingTarea ? 'Editar Tarea' : 'Nueva Tarea'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de la Tarea *
              </label>
              <textarea
                value={formData.descripcion_tarea}
                onChange={(e) => setFormData({ ...formData, descripcion_tarea: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Ej: Envío de Muestra para Ensayo EN 71-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor/Laboratorio
                </label>
                <select
                  value={formData.proveedor_id}
                  onChange={(e) => setFormData({ ...formData, proveedor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccione un proveedor</option>
                  {terceros.map(tercero => (
                    <option key={tercero.id} value={tercero.id}>
                      {tercero.nombre_razon_social} ({tercero.tipo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="enviado">Enviado</option>
                  <option value="en_laboratorio">En Laboratorio</option>
                  <option value="informe_recibido">Informe Recibido</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Envío
                </label>
                <input
                  type="date"
                  value={formData.fecha_envio}
                  onChange={(e) => setFormData({ ...formData, fecha_envio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Recepción Informe
                </label>
                <input
                  type="date"
                  value={formData.fecha_recepcion_informe}
                  onChange={(e) => setFormData({ ...formData, fecha_recepcion_informe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Notas, observaciones o comentarios"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTarea ? 'Actualizar Tarea' : 'Crear Tarea'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {tareas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No hay tareas de logística registradas</p>
          <p className="text-sm text-gray-500 mt-1">
            Cree tareas para gestionar envíos de muestras, ensayos y servicios de terceros
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tareas.map((tarea) => {
            const EstadoIcon = estadosConfig[tarea.estado].icon;
            return (
              <div key={tarea.id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${estadosConfig[tarea.estado].color}`}>
                        <EstadoIcon className="w-3 h-3" />
                        {estadosConfig[tarea.estado].label}
                      </span>
                      {tarea.proveedor && (
                        <span className="text-sm text-gray-600">
                          {tarea.proveedor.nombre_razon_social}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 mb-2">{tarea.descripcion_tarea}</p>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                      {tarea.fecha_envio && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Enviado: {new Date(tarea.fecha_envio).toLocaleDateString('es-AR')}
                        </span>
                      )}
                      {tarea.fecha_recepcion_informe && (
                        <span className="flex items-center gap-1">
                          <FileCheck className="w-3 h-3" />
                          Recibido: {new Date(tarea.fecha_recepcion_informe).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </div>

                    {tarea.notas && (
                      <p className="text-sm text-gray-600 mt-2 italic">{tarea.notas}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(tarea)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tarea.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
