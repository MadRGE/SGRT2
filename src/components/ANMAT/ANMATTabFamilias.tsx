import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Package,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Props {
  casoId: string;
}

interface Familia {
  id: string;
  numero_familia: number;
  nombre: string | null;
  descripcion: string | null;
  fabricante: string | null;
  ncm: string | null;
  color_parte_contacto: string | null;
  estado: string;
  numero_expediente_anmat: string | null;
  numero_registro: string | null;
  fecha_presentacion: string | null;
  fecha_aprobacion: string | null;
  tiene_observaciones: boolean;
  observaciones_anmat: string | null;
  material_principal: {
    nombre: string;
    codigo_caa: string;
  } | null;
  productos_count: number;
}

interface ProductoAsignable {
  id: string;
  nombre: string;
  codigo_cliente: string | null;
  familia_id: string | null;
}

const ESTADOS_FAMILIA: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDIENTE: { label: 'Pendiente', color: 'text-slate-700', bg: 'bg-slate-100', icon: Clock },
  DOCUMENTACION: { label: 'Documentación', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock },
  PRESENTADO: { label: 'Presentado', color: 'text-purple-700', bg: 'bg-purple-100', icon: Clock },
  EN_EVALUACION: { label: 'En Evaluación', color: 'text-cyan-700', bg: 'bg-cyan-100', icon: Clock },
  OBSERVADO: { label: 'Observado', color: 'text-orange-700', bg: 'bg-orange-100', icon: AlertTriangle },
  APROBADO: { label: 'Aprobado', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle },
  RECHAZADO: { label: 'Rechazado', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle }
};

export function ANMATTabFamilias({ casoId }: Props) {
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<ProductoAsignable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFamilia, setEditingFamilia] = useState<Familia | null>(null);
  const [expandedFamilia, setExpandedFamilia] = useState<string | null>(null);
  const [materiales, setMateriales] = useState<{ id: string; nombre: string; codigo_caa: string }[]>([]);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fabricante: '',
    ncm: '',
    color_parte_contacto: '',
    material_principal_id: ''
  });

  useEffect(() => {
    loadFamilias();
    loadProductosDisponibles();
    loadMateriales();
  }, [casoId]);

  const loadFamilias = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('anmat_familias')
      .select(`
        *,
        material_principal:anmat_materiales(nombre, codigo_caa)
      `)
      .eq('caso_id', casoId)
      .order('numero_familia');

    if (error) {
      console.error('Error loading familias:', error);
    } else if (data) {
      const familiasWithCounts = await Promise.all(
        data.map(async (familia) => {
          const { count } = await supabase
            .from('anmat_caso_productos')
            .select('*', { count: 'exact', head: true })
            .eq('familia_id', familia.id);
          return { ...familia, productos_count: count || 0 };
        })
      );
      setFamilias(familiasWithCounts as any);
    }

    setLoading(false);
  };

  const loadProductosDisponibles = async () => {
    const { data } = await supabase
      .from('anmat_caso_productos')
      .select('id, nombre, codigo_cliente, familia_id')
      .eq('caso_id', casoId)
      .order('nombre');

    if (data) setProductosDisponibles(data);
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
      nombre: formData.nombre || null,
      descripcion: formData.descripcion || null,
      fabricante: formData.fabricante || null,
      ncm: formData.ncm || null,
      color_parte_contacto: formData.color_parte_contacto || null,
      material_principal_id: formData.material_principal_id || null
    };

    if (editingFamilia) {
      const { error } = await supabase
        .from('anmat_familias')
        .update(dataToSave)
        .eq('id', editingFamilia.id);

      if (error) {
        alert('Error al actualizar: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('anmat_familias')
        .insert([dataToSave]);

      if (error) {
        alert('Error al crear: ' + error.message);
        return;
      }
    }

    resetForm();
    loadFamilias();
  };

  const handleEdit = (familia: Familia) => {
    setEditingFamilia(familia);
    setFormData({
      nombre: familia.nombre || '',
      descripcion: familia.descripcion || '',
      fabricante: familia.fabricante || '',
      ncm: familia.ncm || '',
      color_parte_contacto: familia.color_parte_contacto || '',
      material_principal_id: ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta familia? Los productos asignados quedarán sin familia.')) return;

    await supabase
      .from('anmat_caso_productos')
      .update({ familia_id: null })
      .eq('familia_id', id);

    const { error } = await supabase
      .from('anmat_familias')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Error al eliminar: ' + error.message);
    } else {
      loadFamilias();
      loadProductosDisponibles();
    }
  };

  const handleChangeEstado = async (familiaId: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from('anmat_familias')
      .update({ estado: nuevoEstado })
      .eq('id', familiaId);

    if (error) {
      alert('Error al cambiar estado: ' + error.message);
    } else {
      loadFamilias();
    }
  };

  const handleAsignarProducto = async (productoId: string, familiaId: string | null) => {
    const { error } = await supabase
      .from('anmat_caso_productos')
      .update({ familia_id: familiaId })
      .eq('id', productoId);

    if (error) {
      alert('Error al asignar: ' + error.message);
    } else {
      loadFamilias();
      loadProductosDisponibles();
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      fabricante: '',
      ncm: '',
      color_parte_contacto: '',
      material_principal_id: ''
    });
    setEditingFamilia(null);
    setShowForm(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const productosSinFamilia = productosDisponibles.filter(p => !p.familia_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Familias de Productos</h3>
          <p className="text-sm text-slate-600">
            Agrupa productos por material, fabricante y color para registro
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Familia
        </button>
      </div>

      {productosSinFamilia.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              {productosSinFamilia.length} producto(s) sin asignar a familia
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {productosSinFamilia.map(prod => (
              <span key={prod.id} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                {prod.nombre}
              </span>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h4 className="font-semibold text-slate-800 mb-4">
            {editingFamilia ? 'Editar Familia' : 'Nueva Familia'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: Botellas PET Transparentes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
                <select
                  value={formData.material_principal_id}
                  onChange={(e) => setFormData({ ...formData, material_principal_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Seleccionar</option>
                  {materiales.map(mat => (
                    <option key={mat.id} value={mat.id}>{mat.codigo_caa}) {mat.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fabricante</label>
                <input
                  type="text"
                  value={formData.fabricante}
                  onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color Contacto</label>
                <input
                  type="text"
                  value={formData.color_parte_contacto}
                  onChange={(e) => setFormData({ ...formData, color_parte_contacto: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Ej: Transparente"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                {editingFamilia ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {familias.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No hay familias creadas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {familias.map(familia => {
            const estadoConfig = ESTADOS_FAMILIA[familia.estado] || ESTADOS_FAMILIA.PENDIENTE;
            const Icon = estadoConfig.icon;
            const isExpanded = expandedFamilia === familia.id;
            const productosEnFamilia = productosDisponibles.filter(p => p.familia_id === familia.id);

            return (
              <div key={familia.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedFamilia(isExpanded ? null : familia.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-purple-700">F{familia.numero_familia}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {familia.nombre || `Familia ${familia.numero_familia}`}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {familia.material_principal?.nombre} • {familia.fabricante || 'Sin fabricante'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estadoConfig.bg} ${estadoConfig.color}`}>
                        {estadoConfig.label}
                      </span>
                      <span className="text-sm text-slate-500">{familia.productos_count} prod.</span>
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {productosEnFamilia.map(prod => (
                        <span key={prod.id} className="inline-flex items-center gap-1 text-xs bg-slate-200 px-2 py-1 rounded">
                          <Package className="w-3 h-3" />
                          {prod.nombre}
                          <button onClick={() => handleAsignarProducto(prod.id, null)} className="ml-1 hover:text-red-600">×</button>
                        </span>
                      ))}
                    </div>
                    {productosSinFamilia.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {productosSinFamilia.map(prod => (
                          <button
                            key={prod.id}
                            onClick={() => handleAsignarProducto(prod.id, familia.id)}
                            className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded hover:bg-teal-200"
                          >
                            + {prod.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <select
                        value={familia.estado}
                        onChange={(e) => handleChangeEstado(familia.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        {Object.entries(ESTADOS_FAMILIA).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(familia)} className="p-1.5 hover:bg-slate-200 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(familia.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
