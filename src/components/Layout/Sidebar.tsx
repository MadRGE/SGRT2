
import { LayoutDashboard, Users, DollarSign, BookOpen, BarChart3, Settings, FileText, Package, UserPlus, Shield } from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  const navItems = [
    {
      path: '/dashboard',
      label: 'Panel de Proyectos',
      icon: LayoutDashboard
    },
    {
      path: '/anmat',
      label: 'Gestoría ANMAT',
      icon: Shield
    },
    {
      path: '/cotizaciones',
      label: 'Cotizaciones',
      icon: FileText
    },
    {
      path: '/clientes',
      label: 'Gestion Clientes',
      icon: Users
    },
    {
      path: '/finanzas',
      label: 'Finanzas',
      icon: DollarSign
    },
    {
      path: '/catalogo',
      label: 'Catálogo Trámites',
      icon: BookOpen
    },
    {
      path: '/catalogo-servicios',
      label: 'Catálogo Servicios',
      icon: Package
    },
    {
      path: '/gestion-proveedores',
      label: 'Proveedores',
      icon: UserPlus
    },
    {
      path: '/reportes',
      label: 'Reportes',
      icon: BarChart3
    },
    {
      path: '/configuracion',
      label: 'Configuración',
      icon: Settings
    }
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return currentPath === '/dashboard' || currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo / Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SGT</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">SGT</h1>
            <p className="text-xs text-slate-500">Sistema de Gestión de Trámites</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-500'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <p className="text-xs font-medium text-slate-500 px-3">Vistas Demo:</p>
        <button
          onClick={() => onNavigate('/portal-cliente')}
          className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          👤 Portal Cliente
        </button>
        <button
          onClick={() => onNavigate('/portal-despachante')}
          className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          🚚 Portal Despachante
        </button>
        <div className="bg-slate-50 rounded-lg p-3 mt-3">
          <p className="text-xs font-medium text-slate-700">¿Necesitas ayuda?</p>
          <p className="text-xs text-slate-500 mt-1">
            Consulta la documentación o contacta soporte
          </p>
        </div>
      </div>
    </aside>
  );
}
