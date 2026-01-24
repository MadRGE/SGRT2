import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Save, Package } from 'lucide-react';

interface ProductoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (producto: any) => void;
  clienteId: string;
}

const RUBROS = [
  'Alimentos',
  'Envases',
  'Productos Animales',
  'Cosméticos',
  'Productos Médicos',
  'Productos Veterinarios',
  'Fauna y Flora',
  'Precursores Químicos',
  'Materiales Controlados',
  'Telecomunicaciones',
  'Seguridad de Productos',
  'Metrología Legal',
  'Servicios'
];

const PAISES = [
  'Argentina', 'Brasil', 'Chile', 'Uruguay', 'Paraguay',
  'España', 'Italia', 'Alemania', 'Francia', 'Bélgica',
  'Holanda', 'Portugal', 'Reino Unido', 'Suiza',
  'Estados Unidos', 'Canadá', 'México',
  'China', 'Japón', 'Corea del Sur', 'India',
  'Australia', 'Nueva Zelanda',
  'Otro'
];

export function ProductoFormModal({ isOpen, onClose, onSuccess, clienteId }: ProductoFormModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    rubro: '',
    pais_origen: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nombre || !formData.rubro || !formData.pais_origen) {
      setError('Nombre, Rubro y País de Origen son obligatorios');
      return;
    }

    setSaving(true);

    try {
      const { data, error: insertError } = await supabase
        .from('productos')
        .insert([{
          cliente_id: clienteId,
          nombre: formData.nombre,
          marca: formData.marca || null,
          rubro: formData.rubro,
          pais_origen: formData.pais_origen
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      onSuccess(data);
      setFormData({ nombre: '', marca: '', rubro: '', pais_origen: '' });
    } catch (err: any) {
      setError(err.message || 'Error al crear el producto');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Nuevo Producto</h2>
              <p className="text-sm text-slate-600">Agregar producto al proyecto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Taladro Percutor DW524"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Marca / Modelo
              </label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                placeholder="Ej: DeWalt"
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rubro *
              </label>
              <select
                value={formData.rubro}
                onChange={(e) => setFormData({ ...formData, rubro: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar rubro...</option>
                {RUBROS.map((rubro) => (
                  <option key={rubro} value={rubro}>
                    {rubro}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                País de Origen *
              </label>
              <select
                value={formData.pais_origen}
                onChange={(e) => setFormData({ ...formData, pais_origen: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar país...</option>
                {PAISES.map((pais) => (
                  <option key={pais} value={pais}>
                    {pais}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> El país de origen determina si aplican equivalencias sanitarias (Anexo III).
              El rubro define qué trámites serán necesarios.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Agregar Producto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
