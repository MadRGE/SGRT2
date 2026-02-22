import { useState, useEffect } from 'react';
import { Plus, Edit, Shield, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import UsuarioFormModal from '../../components/Admin/UsuarioFormModal';

interface Props {
  onBack: () => void;
}

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  created_at?: string;
};

export default function GestionUsuarios(_props: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, rol, created_at')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error cargando usuarios:', error);
    }
    setUsuarios(data || []);
    setLoading(false);
  };

  const handleSuccess = () => {
    loadUsuarios();
    setIsModalOpen(false);
  };

  const openNewModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setIsModalOpen(true);
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'gestor':
        return 'bg-blue-100 text-blue-800';
      case 'cliente':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const ROL_LABELS: Record<string, string> = {
    admin: 'Administrador',
    gestor: 'Gestor',
    cliente: 'Cliente',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestión de Usuarios
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Administre los usuarios del sistema y sus roles
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Usuario</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Email</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Rol</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Creado</th>
                <th className="p-3 text-center text-sm font-medium text-slate-700">Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <span className="font-medium text-slate-800">{u.nombre}</span>
                    </td>
                    <td className="p-3 text-sm text-blue-600">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRolColor(u.rol)}`}
                      >
                        {ROL_LABELS[u.rol] || u.rol}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-slate-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '-'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar usuario"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Roles
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Administrador</p>
            <p className="text-xs text-blue-700">Acceso completo al sistema</p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Gestor</p>
            <p className="text-xs text-blue-700">Gestión de trámites y clientes</p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Cliente</p>
            <p className="text-xs text-blue-700">Vista de sus propios proyectos</p>
          </div>
        </div>
      </div>

      <UsuarioFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        usuario={selectedUser}
      />
    </div>
  );
}
