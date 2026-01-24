import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, Plus, Edit2, Trash2, Search, Package,
  DollarSign, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface Servicio {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  tipo_costo: string;
  costo_base_sugerido: number;
  precio_sugerido_estandar: number;
  precio_sugerido_corporativo: number;
  precio_sugerido_pyme: number;
  requiere_proveedor_externo: boolean;
  tiempo_estimado_horas: number;
  activo: boolean;
  notas: string | null;
}

interface FormData {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  tipo_costo: string;
  costo_base_sugerido: number;
  precio_sugerido_estandar: number;
  precio_sugerido_corporativo: number;
  precio_sugerido_pyme: number;
  requiere_proveedor_externo: boolean;
  tiempo_estimado_horas: number;
  notas: string;
}

const CATEGORIAS = [
  { value: 'consultoria', label: 'Consultoría' },
  { value: 'tramite', label: 'Trámite' },
  { value: 'analisis', label: 'Análisis' },
  { value: 'capacitacion', label: 'Capacitación' },
  { value: 'otro', label: 'Otro' }
];

const TIPOS_COSTO = [
  { value: 'sin_costo_base', label: 'Sin Costo Base (Consultoría Pura)', description: 'Servicios basados en conocimiento, sin costos asociados' },
  { value: 'costo_fijo', label: 'Costo Fijo', description: 'Servicios con costos internos fijos' },
  { value: 'costo_variable', label: 'Costo Variable', description: 'Servicios que típicamente requieren terceros' }
];

export default function CatalogoServicios({ onBack }: Props) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [filteredServicios, setFilteredServicios] = useState<Servicio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: 'consultoria',
    tipo_costo: 'sin_costo_base',
    costo_base_sugerido: 0,
    precio_sugerido_estandar: 0,
    precio_sugerido_corporativo: 0,
    precio_sugerido_pyme: 0,
    requiere_proveedor_externo: false,
    tiempo_estimado_horas: 0,
    notas: ''
  });

  useEffect(() => {
    loadServicios();
  }, []);

  useEffect(() => {
    let filtered = servicios;

    if (filtroCategoria !== 'todos') {
      filtered = filtered.filter(s => s.categoria === filtroCategoria);
    }

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.descripcion && s.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredServicios(filtered);
  }, [searchTerm, filtroCategoria, servicios]);

  const loadServicios = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('catalogo_servicios')
      .select('*')
      .order('codigo');

    if (data) {
      setServicios(data);
      setFilteredServicios(data);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from('catalogo_servicios')
        .update(formData)
        .eq('id', editingId);

      if (error) {
        alert('Error al actualizar: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('catalogo_servicios')
        .insert([formData]);

      if (error) {
        alert('Error al crear: ' + error.message);
        return;
      }
    }

    resetForm();
    loadServicios();
  };

  const handleEdit = (servicio: Servicio) => {
    setEditingId(servicio.id);
    setFormData({
      codigo: servicio.codigo,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || '',
      categoria: servicio.categoria,
      tipo_costo: servicio.tipo_costo,
      costo_base_sugerido: servicio.costo_base_sugerido,
      precio_sugerido_estandar: servicio.precio_sugerido_estandar,
      precio_sugerido_corporativo: servicio.precio_sugerido_corporativo,
      precio_sugerido_pyme: servicio.precio_sugerido_pyme,
      requiere_proveedor_externo: servicio.requiere_proveedor_externo,
      tiempo_estimado_horas: servicio.tiempo_estimado_horas,
      notas: servicio.notas || ''
    });
    setShowModal(true);
  };

  const handleToggleActivo = async (id: string, activo: boolean) => {
    const { error } = await supabase
      .from('catalogo_servicios')
      .update({ activo: !activo })
      .eq('id', id);

    if (!error) {
      loadServicios();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este servicio?')) return;

    const { error } = await supabase
      .from('catalogo_servicios')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error al eliminar: ' + error.message);
      return;
    }

    loadServicios();
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: 'consultoria',
      tipo_costo: 'sin_costo_base',
      costo_base_sugerido: 0,
      precio_sugerido_estandar: 0,
      precio_sugerido_corporativo: 0,
      precio_sugerido_pyme: 0,
      requiere_proveedor_externo: false,
      tiempo_estimado_horas: 0,
      notas: ''
    });
    setEditingId(null);
    setShowModal(false);
  };

  const calcularStats = () => {
    const total = servicios.length;
    const activos = servicios.filter(s => s.activo).length;
    const sinCosto = servicios.filter(s => s.tipo_costo === 'sin_costo_base').length;
    const conTerceros = servicios.filter(s => s.requiere_proveedor_externo).length;

    return { total, activos, sinCosto, conTerceros };
  };

  const stats = calcularStats();

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
            <h1 className="text-3xl font-bold text-slate-800">Catálogo de Servicios</h1>
            <p className="text-slate-600 mt-1">Gestión de servicios y precios sugeridos</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Servicio
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-slate-600" />
              <span className="text-sm text-slate-600">Total Servicios</span>
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

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700">Sin Costo Base</span>
            </div>
            <p className="text-2xl font-bold text-blue-800">{stats.sinCosto}</p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-orange-700">Requieren Terceros</span>
            </div>
            <p className="text-2xl font-bold text-orange-800">{stats.conTerceros}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todas las categorías</option>
            {CATEGORIAS.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredServicios.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>{searchTerm || filtroCategoria !== 'todos' ? 'No se encontraron servicios' : 'No hay servicios registrados'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredServicios.map((servicio) => (
              <div
                key={servicio.id}
                className={`border rounded-lg p-4 transition-all ${
                  servicio.activo
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-slate-800">{servicio.nombre}</h3>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded capitalize">
                        {servicio.categoria}
                      </span>
                      {servicio.tipo_costo === 'sin_costo_base' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          Sin costo base
                        </span>
                      )}
                      {servicio.requiere_proveedor_externo && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                          Requiere tercero
                        </span>
                      )}
                      {!servicio.activo && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                          Inactivo
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 mb-2">{servicio.codigo}</p>
                    {servicio.descripcion && (
                      <p className="text-sm text-slate-600 mb-3">{servicio.descripcion}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Precio Estándar</p>
                        <p className="font-semibold text-slate-800">
                          ${servicio.precio_sugerido_estandar.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Precio Corporativo</p>
                        <p className="font-semibold text-slate-800">
                          ${servicio.precio_sugerido_corporativo.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Precio PYME</p>
                        <p className="font-semibold text-slate-800">
                          ${servicio.precio_sugerido_pyme.toLocaleString('es-AR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Tiempo Estimado
                        </p>
                        <p className="font-semibold text-slate-800">
                          {servicio.tiempo_estimado_horas}h
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActivo(servicio.id, servicio.activo)}
                      className={`p-2 rounded-lg transition-colors ${
                        servicio.activo
                          ? 'bg-green-100 hover:bg-green-200 text-green-700'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                      }`}
                      title={servicio.activo ? 'Desactivar' : 'Activar'}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(servicio)}
                      className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(servicio.id)}
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
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de Costo *
                  </label>
                  <select
                    value={formData.tipo_costo}
                    onChange={(e) => setFormData({ ...formData, tipo_costo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIPOS_COSTO.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    {TIPOS_COSTO.find(t => t.value === formData.tipo_costo)?.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Costo Base Sugerido
                  </label>
                  <input
                    type="number"
                    value={formData.costo_base_sugerido}
                    onChange={(e) => setFormData({ ...formData, costo_base_sugerido: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Dejar en 0 para servicios sin costo base
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tiempo Estimado (horas)
                  </label>
                  <input
                    type="number"
                    value={formData.tiempo_estimado_horas}
                    onChange={(e) => setFormData({ ...formData, tiempo_estimado_horas: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-3">Precios Sugeridos por Tipo de Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cliente Estándar
                    </label>
                    <input
                      type="number"
                      value={formData.precio_sugerido_estandar}
                      onChange={(e) => setFormData({ ...formData, precio_sugerido_estandar: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cliente Corporativo
                    </label>
                    <input
                      type="number"
                      value={formData.precio_sugerido_corporativo}
                      onChange={(e) => setFormData({ ...formData, precio_sugerido_corporativo: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cliente PYME
                    </label>
                    <input
                      type="number"
                      value={formData.precio_sugerido_pyme}
                      onChange={(e) => setFormData({ ...formData, precio_sugerido_pyme: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiere_proveedor_externo}
                    onChange={(e) => setFormData({ ...formData, requiere_proveedor_externo: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Este servicio típicamente requiere proveedores externos / terceros
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notas Internas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas para uso interno..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingId ? 'Actualizar' : 'Crear'} Servicio
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
