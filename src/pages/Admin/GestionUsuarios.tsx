import { useState, useEffect } from 'react';
import { Plus, Edit, Shield } from 'lucide-react';
import UsuarioFormModal from '../../components/Admin/UsuarioFormModal';

interface Props {
  onBack: () => void;
}

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: 'administrador' | 'gerente' | 'despachante' | 'cliente' | 'consultor';
  is_active: boolean;
};

export default function GestionUsuarios({ onBack }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = () => {
    const mockUsuarios: Usuario[] = [
      {
        id: 'usr-1',
        nombre: 'Admin Gestor',
        email: 'admin@gestor.com',
        rol: 'administrador',
        is_active: true
      },
      {
        id: 'usr-2',
        nombre: 'Gerente Area',
        email: 'gerente@gestor.com',
        rol: 'gerente',
        is_active: true
      },
      {
        id: 'usr-3',
        nombre: 'Despachante Gomez',
        email: 'gomez@despa.com',
        rol: 'despachante',
        is_active: true
      },
      {
        id: 'usr-4',
        nombre: 'Cliente A S.A.',
        email: 'contacto@clientea.com',
        rol: 'cliente',
        is_active: true
      },
      {
        id: 'usr-5',
        nombre: 'Consultor Externo',
        email: 'consultor@externo.com',
        rol: 'consultor',
        is_active: false
      }
    ];
    setUsuarios(mockUsuarios);
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
      case 'administrador':
        return 'bg-red-100 text-red-800';
      case 'gerente':
        return 'bg-amber-100 text-amber-800';
      case 'despachante':
        return 'bg-blue-100 text-blue-800';
      case 'cliente':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getRolIcon = (rol: string) => {
    switch (rol) {
      case 'administrador':
        return '👑';
      case 'gerente':
        return '📊';
      case 'despachante':
        return '🚚';
      case 'cliente':
        return '🏢';
      default:
        return '👤';
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
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestión de Usuarios y Roles
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Administre los usuarios del sistema y sus permisos de acceso
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
                <th className="p-3 text-left text-sm font-medium text-slate-700">Estado</th>
                <th className="p-3 text-center text-sm font-medium text-slate-700">Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getRolIcon(u.rol)}</span>
                      <span className="font-medium text-slate-800">{u.nombre}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-blue-600">{u.email}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRolColor(
                        u.rol
                      )}`}
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        u.is_active ? 'text-green-600' : 'text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          u.is_active ? 'bg-green-600' : 'bg-slate-400'
                        }`}
                      ></span>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Roles y Permisos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">👑 Administrador</p>
            <p className="text-xs text-blue-700">Acceso completo al sistema</p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">📊 Gerente</p>
            <p className="text-xs text-blue-700">Gestión de proyectos y reportes</p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">🚚 Despachante</p>
            <p className="text-xs text-blue-700">Gestión de expedientes asignados</p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">🏢 Cliente</p>
            <p className="text-xs text-blue-700">Vista de sus propios proyectos</p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">👤 Consultor</p>
            <p className="text-xs text-blue-700">Acceso limitado a consultoría</p>
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
