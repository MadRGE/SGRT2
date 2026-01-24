import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, Plus, Edit2, Trash2, Search, Users,
  Star, CheckCircle, Clock
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface Proveedor {
  id: string;
  nombre: string;
  cuit: string;
  email: string | null;
  telefono: string | null;
  tipo: string;
  tipo_servicio: string[];
  calificacion: number;
  tiempo_respuesta_dias: number;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
}

export default function GestionProveedores({ onBack }: Props) {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    cuit: '',
    email: '',
    telefono: '',
    tipo: 'laboratorio',
    tipo_servicio: [] as string[],
    calificacion: 0,
    tiempo_respuesta_dias: 0,
    direccion: '',
    notas: ''
  });

  useEffect(() => {
    loadProveedores();
  }, []);

  useEffect(() => {
    let filtered = proveedores;

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cuit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tipo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProveedores(filtered);
  }, [searchTerm, proveedores]);

  const loadProveedores = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('terceros')
      .select('*')
      .order('nombre');

    if (data) {
      setProveedores(data);
      setFilteredProveedores(data);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from('terceros')
        .update(formData)
        .eq('id', editingId);

      if (error) {
        alert('Error al actualizar: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('terceros')
        .insert([formData]);

      if (error) {
        alert('Error al crear: ' + error.message);
        return;
      }
    }

    resetForm();
    loadProveedores();
  };

  const handleEdit = (proveedor: Proveedor) => {
    setEditingId(proveedor.id);
    setFormData({
      nombre: proveedor.nombre,
      cuit: proveedor.cuit,
      email: proveedor.email || '',
      telefono: proveedor.telefono || '',
      tipo: proveedor.tipo,
      tipo_servicio: proveedor.tipo_servicio || [],
      calificacion: proveedor.calificacion,
      tiempo_respuesta_dias: proveedor.tiempo_respuesta_dias,
      direccion: proveedor.direccion || '',
      notas: proveedor.notas || ''
    });
    setShowModal(true);
  };

  const handleToggleActivo = async (id: string, activo: boolean) => {
    const { error } = await supabase
      .from('terceros')
      .update({ activo: !activo })
      .eq('id', id);

    if (!error) {
      loadProveedores();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este proveedor?')) return;

    const { error } = await supabase
      .from('terceros')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error al eliminar: ' + error.message);
      return;
    }

    loadProveedores();
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      cuit: '',
      email: '',
      telefono: '',
      tipo: 'laboratorio',
      tipo_servicio: [],
      calificacion: 0,
      tiempo_respuesta_dias: 0,
      direccion: '',
      notas: ''
    });
    setEditingId(null);
    setShowModal(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'
        }`}
      />
    ));
  };

  const stats = {
    total: proveedores.length,
    activos: proveedores.filter(p => p.activo).length,
    promedioCalificacion: proveedores.length > 0
      ? (proveedores.reduce((sum, p) => sum + p.calificacion, 0) / proveedores.length).toFixed(1)
      : '0'
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gestión de Proveedores Externos</h1>
            <p className="text-slate-600 mt-1">Administración de terceros y colaboradores</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Proveedor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-slate-600" />
              <span className="text-sm text-slate-600">Total Proveedores</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">Activos</span>
            </div>
            <p className="text-2xl font-bold text-green-800">{stats.activos}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-700">Calificación Promedio</span>
            </div>
            <p className="text-2xl font-bold text-yellow-800">{stats.promedioCalificacion}</p>
          </div>
        </div>

        <div className="flex mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProveedores.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No hay proveedores registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProveedores.map((proveedor) => (
              <div
                key={proveedor.id}
                className={`border rounded-lg p-4 transition-all ${
                  proveedor.activo
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-slate-800">{proveedor.nombre}</h3>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded capitalize">
                        {proveedor.tipo}
                      </span>
                      {!proveedor.activo && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          Inactivo
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">CUIT</p>
                        <p className="font-semibold text-slate-800">{proveedor.cuit}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Contacto</p>
                        <p className="font-semibold text-slate-800">{proveedor.telefono || '-'}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Calificación</p>
                        <div className="flex gap-0.5">
                          {renderStars(proveedor.calificacion)}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Tiempo Respuesta
                        </p>
                        <p className="font-semibold text-slate-800">{proveedor.tiempo_respuesta_dias} días</p>
                      </div>
                    </div>

                    {proveedor.tipo_servicio && proveedor.tipo_servicio.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {proveedor.tipo_servicio.map((servicio, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                            {servicio}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActivo(proveedor.id, proveedor.activo)}
                      className={`p-2 rounded-lg transition-colors ${
                        proveedor.activo
                          ? 'bg-green-100 hover:bg-green-200 text-green-700'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                      }`}
                      title={proveedor.activo ? 'Desactivar' : 'Activar'}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(proveedor)}
                      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(proveedor.id)}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre / Razón Social *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CUIT *
                  </label>
                  <input
                    type="text"
                    value={formData.cuit}
                    onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="laboratorio">Laboratorio</option>
                    <option value="despachante">Despachante</option>
                    <option value="gestor">Gestor</option>
                    <option value="certificador">Certificador</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Calificación (0-5)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={formData.calificacion}
                    onChange={(e) => setFormData({ ...formData, calificacion: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tiempo Respuesta (días)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.tiempo_respuesta_dias}
                    onChange={(e) => setFormData({ ...formData, tiempo_respuesta_dias: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingId ? 'Actualizar' : 'Crear'} Proveedor
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
