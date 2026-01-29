import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Package,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Image,
  FileText,
  MoreVertical
} from 'lucide-react';

interface Props {
  casoId: string;
  divisionId?: string;
}

interface Producto {
  id: string;
  codigo_cliente: string | null;
  nombre: string;
  descripcion: string | null;
  variante_color: string | null;
  variante_capacidad: string | null;
  variante_modelo: string | null;
  ncm: string | null;
  pais_origen: string | null;
  fabricante: string | null;
  familia_id: string | null;
  tiene_ficha_tecnica: boolean;
  tiene_certificaciones: boolean;
  imagen_url: string | null;
  material_principal: {
    nombre: string;
    codigo_caa: string;
  } | null;
  familia: {
    numero_familia: number;
    nombre: string | null;
  } | null;
}

export function ANMATTabProductos({ casoId, divisionId }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [materiales, setMateriales] = useState<{ id: string; nombre: string; codigo_caa: string }[]>([]);

  const [formData, setFormData] = useState({
    codigo_cliente: '',
    nombre: '',
    descripcion: '',
    variante_color: '',
    variante_capacidad: '',
    variante_modelo: '',
    ncm: '',
    pais_origen: '',
    fabricante: '',
    material_principal_id: '',
    tiene_ficha_tecnica: false,
    tiene_certificaciones: false
  });

  useEffect(() => {
    loadProductos();
    loadMateriales();
  }, [casoId]);

  const loadProductos = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('anmat_caso_productos')
      .select(`
        *,
        material_principal:anmat_materiales(nombre, codigo_caa),
        familia:anmat_familias(numero_familia, nombre)
      `)
      .eq('caso_id', casoId)
      .order('orden');

    if (error) {
      console.error('Error loading productos:', error);
    } else {
      setProductos(data as any);
    }

    setLoading(false);
  };

  const loadMateriales = async () => {
    const { data } = await supabase
      .from('anmat_materiales')
      .select('id, nombre, codigo_caa')
      .order('nombre');

    if (data) setMateriales(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      caso_id: casoId,
      ...formData,
      material_principal_id: formData.material_principal_id || null
    };

    if (editingProducto) {
      const { error } = await supabase
        .from('anmat_caso_productos')
        .update(dataToSave)
        .eq('id', editingProducto.id);

      if (error) {
        alert('Error al actualizar: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('anmat_caso_productos')
        .insert([dataToSave]);

      if (error) {
        alert('Error al crear: ' + error.message);
        return;
      }
    }

    resetForm();
    loadProductos();
  };

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto);
    setFormData({
      codigo_cliente: producto.codigo_cliente || '',
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      variante_color: producto.variante_color || '',
      variante_capacidad: producto.variante_capacidad || '',
      variante_modelo: producto.variante_modelo || '',
      ncm: producto.ncm || '',
      pais_origen: producto.pais_origen || '',
      fabricante: producto.fabricante || '',
      material_principal_id: '',
      tiene_ficha_tecnica: producto.tiene_ficha_tecnica,
      tiene_certificaciones: producto.tiene_certificaciones
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;

    const { error } = await supabase
      .from('anmat_caso_productos')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error al eliminar: ' + error.message);
    } else {
      loadProductos();
    }
  };

  const resetForm = () => {
    setFormData({
      codigo_cliente: '',
      nombre: '',
      descripcion: '',
      variante_color: '',
      variante_capacidad: '',
      variante_modelo: '',
      ncm: '',
      pais_origen: '',
      fabricante: '',
      material_principal_id: '',
      tiene_ficha_tecnica: false,
      tiene_certificaciones: false
    });
    setEditingProducto(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Productos / SKUs</h3>
          <p className="text-sm text-slate-600">
            {productos.length} producto(s) cargado(s)
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Producto
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h4 className="font-semibold text-slate-800 mb-4">
            {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: Botella PET 500ml"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Código/SKU del Cliente
                </label>
                <input
                  type="text"
                  value={formData.codigo_cliente}
                  onChange={(e) => setFormData({ ...formData, codigo_cliente: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: BOT-500-TRANS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Material Principal
                </label>
                <select
                  value={formData.material_principal_id}
                  onChange={(e) => setFormData({ ...formData, material_principal_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Seleccionar material</option>
                  {materiales.map(mat => (
                    <option key={mat.id} value={mat.id}>
                      {mat.codigo_caa}) {mat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fabricante
                </label>
                <input
                  type="text"
                  value={formData.fabricante}
                  onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Nombre del fabricante"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  País de Origen
                </label>
                <input
                  type="text"
                  value={formData.pais_origen}
                  onChange={(e) => setFormData({ ...formData, pais_origen: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: CN, US, DE"
                  maxLength={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  NCM
                </label>
                <input
                  type="text"
                  value={formData.ncm}
                  onChange={(e) => setFormData({ ...formData, ncm: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: 3923.30.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Variante: Color
                </label>
                <input
                  type="text"
                  value={formData.variante_color}
                  onChange={(e) => setFormData({ ...formData, variante_color: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: Transparente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Variante: Capacidad
                </label>
                <input
                  type="text"
                  value={formData.variante_capacidad}
                  onChange={(e) => setFormData({ ...formData, variante_capacidad: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: 500ml"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Variante: Modelo
                </label>
                <input
                  type="text"
                  value={formData.variante_modelo}
                  onChange={(e) => setFormData({ ...formData, variante_modelo: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: Ergonómico"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={2}
                placeholder="Descripción adicional del producto"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.tiene_ficha_tecnica}
                  onChange={(e) => setFormData({ ...formData, tiene_ficha_tecnica: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">Tiene ficha técnica</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.tiene_certificaciones}
                  onChange={(e) => setFormData({ ...formData, tiene_certificaciones: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">Tiene certificaciones</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                {editingProducto ? 'Actualizar' : 'Agregar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      {productos.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No hay productos cargados</p>
          <p className="text-sm text-slate-500 mt-1">
            Agrega los productos/SKUs que se incluirán en este caso
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Producto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Material</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fabricante</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Familia</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Docs</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {productos.map(producto => (
                <tr key={producto.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{producto.nombre}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        {producto.codigo_cliente && (
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                            {producto.codigo_cliente}
                          </span>
                        )}
                        {producto.variante_color && <span>• {producto.variante_color}</span>}
                        {producto.variante_capacidad && <span>• {producto.variante_capacidad}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {producto.material_principal ? (
                      <span className="text-sm text-slate-700">
                        {producto.material_principal.codigo_caa}) {producto.material_principal.nombre}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <p className="text-slate-700">{producto.fabricante || '—'}</p>
                      {producto.pais_origen && (
                        <p className="text-xs text-slate-500">{producto.pais_origen}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {producto.familia ? (
                      <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        F{producto.familia.numero_familia}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {producto.tiene_ficha_tecnica ? (
                        <FileText className="w-4 h-4 text-green-500" title="Ficha técnica" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-300" />
                      )}
                      {producto.tiene_certificaciones ? (
                        <CheckCircle className="w-4 h-4 text-green-500" title="Certificaciones" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(producto)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(producto.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
