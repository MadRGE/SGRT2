import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { Users, UserPlus, Mail, Trash2, Key } from 'lucide-react';

interface Props {
  clienteId: string;
}

interface UsuarioCliente {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  created_at: string;
  auth_id: string | null;
}

export function TabUsuarios({ clienteId }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewUserForm, setShowNewUserForm] = useState(false);

  useEffect(() => {
    loadUsuarios();
  }, [clienteId]);

  const loadUsuarios = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (data) {
      setUsuarios(data as UsuarioCliente[]);
    }

    setLoading(false);
  };

  const handleDeleteUser = async (usuarioId: string) => {
    if (!confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    const { error } = await supabase.from('usuarios').delete().eq('id', usuarioId);

    if (!error) {
      toast.success('Usuario eliminado');
      loadUsuarios();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Usuarios del Cliente</h3>
          <p className="text-sm text-slate-600 mt-1">
            Gestiona los usuarios que tienen acceso al Portal del Cliente
          </p>
        </div>
        <button
          onClick={() => setShowNewUserForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Total Usuarios</p>
          <p className="text-3xl font-bold text-blue-800 mt-2">{usuarios.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 font-medium">Usuarios Activos</p>
          <p className="text-3xl font-bold text-green-800 mt-2">
            {usuarios.filter((u) => u.auth_id).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-700 font-medium">Pendientes</p>
          <p className="text-3xl font-bold text-orange-800 mt-2">
            {usuarios.filter((u) => !u.auth_id).length}
          </p>
        </div>
      </div>

      {showNewUserForm && (
        <NewUserForm
          clienteId={clienteId}
          onClose={() => setShowNewUserForm(false)}
          onSuccess={() => {
            setShowNewUserForm(false);
            loadUsuarios();
          }}
        />
      )}

      {usuarios.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>No hay usuarios registrados para este cliente</p>
          <button
            onClick={() => setShowNewUserForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Crear primer usuario
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Nombre</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Email</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Rol</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Estado</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">
                  Fecha Creación
                </th>
                <th className="p-3 text-center text-sm font-medium text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-t border-slate-200">
                  <td className="p-3 font-medium text-slate-800">{usuario.nombre}</td>
                  <td className="p-3 text-sm text-slate-600 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {usuario.email}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {usuario.rol}
                    </span>
                  </td>
                  <td className="p-3">
                    {usuario.auth_id ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-sm text-slate-600">
                    {new Date(usuario.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDeleteUser(usuario.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar usuario"
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

function NewUserForm({
  clienteId,
  onClose,
  onSuccess
}: {
  clienteId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    password: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nombre: formData.nombre,
            rol: 'cliente',
            cliente_id: clienteId
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: dbError } = await supabase.from('usuarios').insert([
          {
            email: formData.email,
            nombre: formData.nombre,
            rol: 'cliente',
            cliente_id: clienteId,
            auth_id: authData.user.id
          }
        ]);

        if (dbError) throw dbError;

        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full mx-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Nuevo Usuario</h2>
            <p className="text-sm text-slate-600">
              Este usuario tendrá acceso al Portal del Cliente
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Juan Pérez"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repite la contraseña"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Información importante:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>El usuario recibirá un email de confirmación</li>
                  <li>Tendrá acceso exclusivo al Portal del Cliente</li>
                  <li>Podrá ver proyectos, trámites y documentos de su empresa</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Crear Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
