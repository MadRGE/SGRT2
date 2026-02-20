import { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  created_at?: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  usuario?: Usuario | null;
  onSuccess: () => void;
}

const ROLES = ['admin', 'gestor', 'cliente'];
const ROL_LABELS: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  cliente: 'Cliente',
};

export default function UsuarioFormModal({ isOpen, onClose, usuario, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'gestor',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || '',
        email: usuario.email || '',
        password: '',
        rol: usuario.rol || 'gestor',
      });
    } else {
      setFormData({ nombre: '', email: '', password: '', rol: 'gestor' });
    }
    setErrors({});
    setSubmitError('');
  }, [usuario, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }
    if (!usuario && !formData.password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    }
    if (!usuario && formData.password.length > 0 && formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSubmitError('');

    try {
      if (usuario) {
        // Edit: update nombre and rol in usuarios table
        const { error } = await supabase
          .from('usuarios')
          .update({ nombre: formData.nombre, rol: formData.rol })
          .eq('id', usuario.id);

        if (error) throw error;
      } else {
        // Create: sign up new user, then update their rol
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { nombre: formData.nombre, rol: formData.rol } },
        });

        if (authError) throw authError;

        // The trigger handle_new_user creates the usuarios record with default 'gestor' rol.
        // Update to the selected rol if different:
        if (authData.user) {
          await supabase
            .from('usuarios')
            .update({ rol: formData.rol, nombre: formData.nombre })
            .eq('id', authData.user.id);
        }
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error guardando usuario:', error);
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5" />
            {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className={`w-full p-2 border rounded-md ${
                errors.nombre ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Ej: Juan Pérez"
            />
            {errors.nombre && <p className="text-sm text-red-600 mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!usuario}
              className={`w-full p-2 border rounded-md ${
                errors.email ? 'border-red-500' : 'border-slate-300'
              } ${usuario ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              placeholder="usuario@ejemplo.com"
            />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>

          {!usuario && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full p-2 border rounded-md ${
                  errors.password ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
              <p className="text-xs text-slate-500 mt-1">
                El usuario recibirá un email de confirmación
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Rol *</label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              className="w-full p-2 border rounded-md bg-white border-slate-300"
            >
              {ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {ROL_LABELS[rol] || rol}
                </option>
              ))}
            </select>
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : usuario ? 'Actualizar' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
