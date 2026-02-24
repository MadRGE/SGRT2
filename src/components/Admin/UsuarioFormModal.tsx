import { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  cliente_id?: string | null;
  created_at?: string;
};

type Cliente = {
  id: string;
  razon_social: string;
  cuit: string;
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
    cliente_id: '',
  });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadClientes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombre: usuario.nombre || '',
        email: usuario.email || '',
        password: '',
        rol: usuario.rol || 'gestor',
        cliente_id: usuario.cliente_id || '',
      });
    } else {
      setFormData({ nombre: '', email: '', password: '', rol: 'gestor', cliente_id: '' });
    }
    setErrors({});
    setSubmitError('');
  }, [usuario, isOpen]);

  const loadClientes = async () => {
    setLoadingClientes(true);
    const { data } = await supabase
      .from('clientes')
      .select('id, razon_social, cuit')
      .order('razon_social');
    if (data) setClientes(data);
    setLoadingClientes(false);
  };

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
    if (formData.rol === 'cliente' && !formData.cliente_id) {
      newErrors.cliente_id = 'Debe seleccionar una empresa/cliente';
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
      const clienteId = formData.rol === 'cliente' ? formData.cliente_id : null;

      if (usuario) {
        // Edit: update nombre, rol and cliente_id in usuarios table
        const { error } = await supabase
          .from('usuarios')
          .update({ nombre: formData.nombre, rol: formData.rol, cliente_id: clienteId })
          .eq('id', usuario.id);

        if (error) throw error;
      } else {
        // Create: sign up new user, then update their rol
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { nombre: formData.nombre, rol: formData.rol, cliente_id: clienteId } },
        });

        if (authError) throw authError;

        // The trigger handle_new_user creates the usuarios record with default 'gestor' rol.
        // Update to the selected rol and cliente_id:
        if (authData.user) {
          await supabase
            .from('usuarios')
            .update({ rol: formData.rol, nombre: formData.nombre, cliente_id: clienteId })
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
              onChange={(e) => setFormData({ ...formData, rol: e.target.value, cliente_id: '' })}
              className="w-full p-2 border rounded-md bg-white border-slate-300"
            >
              {ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {ROL_LABELS[rol] || rol}
                </option>
              ))}
            </select>
          </div>

          {formData.rol === 'cliente' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Empresa / Cliente *
              </label>
              {loadingClientes ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 p-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Cargando clientes...
                </div>
              ) : clientes.length === 0 ? (
                <p className="text-sm text-amber-600 p-2 bg-amber-50 rounded-md border border-amber-200">
                  No hay clientes registrados. Primero debe crear un cliente.
                </p>
              ) : (
                <select
                  value={formData.cliente_id}
                  onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                  className={`w-full p-2 border rounded-md bg-white ${
                    errors.cliente_id ? 'border-red-500' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- Seleccionar empresa --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razon_social} {c.cuit ? `(CUIT: ${c.cuit})` : ''}
                    </option>
                  ))}
                </select>
              )}
              {errors.cliente_id && (
                <p className="text-sm text-red-600 mt-1">{errors.cliente_id}</p>
              )}
            </div>
          )}

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
