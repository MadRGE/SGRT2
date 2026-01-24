import React, { useState, useEffect } from 'react';
import { Bell, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import {
  NotificationService,
  NotificationTemplate,
} from '../../services/NotificationService';

export function NotificationTemplateManager() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const emptyTemplate: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'> = {
    codigo: '',
    nombre: '',
    tipo: 'sistema',
    asunto: '',
    contenido: '',
    variables: [],
    activo: true,
  };

  const [formData, setFormData] = useState(emptyTemplate);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const { templates: data, error } = await NotificationService.getAllTemplates();
    if (!error) {
      setTemplates(data);
    }
    setLoading(false);
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData(template);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData(emptyTemplate);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setIsCreating(false);
    setFormData(emptyTemplate);
  };

  const handleSave = async () => {
    if (editingTemplate) {
      const { template, error } = await NotificationService.updateTemplate(
        editingTemplate.id,
        formData
      );
      if (!error && template) {
        setTemplates((prev) => prev.map((t) => (t.id === template.id ? template : t)));
        handleCancel();
      }
    } else if (isCreating) {
      const { template, error } = await NotificationService.createTemplate(formData);
      if (!error && template) {
        setTemplates((prev) => [...prev, template]);
        handleCancel();
      }
    }
  };

  const handleVariableAdd = () => {
    const newVar = prompt('Ingrese el nombre de la nueva variable:');
    if (newVar) {
      setFormData((prev) => ({
        ...prev,
        variables: [...prev.variables, newVar],
      }));
    }
  };

  const handleVariableRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Cargando plantillas...</div>;
  }

  if (isCreating || editingTemplate) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">
            {isCreating ? 'Crear Nueva Plantilla' : 'Editar Plantilla'}
          </h3>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de plantilla
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ej: documento_aprobado"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre descriptivo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={formData.tipo}
              onChange={(e) =>
                setFormData({ ...formData, tipo: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sistema">Sistema</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
            <input
              type="text"
              value={formData.asunto}
              onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Asunto de la notificación"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
            <textarea
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contenido de la notificación. Use {{variable}} para placeholders."
            />
            <p className="text-xs text-gray-500 mt-1">
              Ejemplo: El documento {{nombre_documento}} ha sido {{estado}}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Variables</label>
              <button
                onClick={handleVariableAdd}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Agregar variable
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.variables.map((variable, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  <span>{variable}</span>
                  <button
                    onClick={() => handleVariableRemove(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="activo" className="text-sm text-gray-700">
              Plantilla activa
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Plantillas de Notificaciones</h2>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Plantilla
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          No hay plantillas de notificaciones configuradas
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{template.nombre}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.activo ? 'Activa' : 'Inactiva'}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {template.tipo.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Código: {template.codigo}</p>
                  {template.asunto && (
                    <p className="text-sm text-gray-600 mb-2">Asunto: {template.asunto}</p>
                  )}
                  <p className="text-sm text-gray-700 line-clamp-2">{template.contenido}</p>
                  {template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {template.variables.map((variable, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {variable}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleEdit(template)}
                  className="ml-4 p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
