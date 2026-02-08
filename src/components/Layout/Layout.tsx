import { ReactNode } from 'react';
import { LayoutDashboard, Users, FileText, LogOut, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export type Page =
  | { type: 'dashboard' }
  | { type: 'clientes' }
  | { type: 'cliente'; id: string }
  | { type: 'tramites' }
  | { type: 'tramite'; id: string }
  | { type: 'vencimientos' }
  | { type: 'nuevo-tramite'; clienteId?: string }
  | { type: 'nuevo-cliente' };

type NavPage = 'dashboard' | 'clientes' | 'tramites' | 'vencimientos';

interface LayoutProps {
  children: ReactNode;
  currentNav: NavPage;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { nav: NavPage; label: string; icon: typeof LayoutDashboard }[] = [
  { nav: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { nav: 'tramites', label: 'Trámites', icon: FileText },
  { nav: 'clientes', label: 'Clientes', icon: Users },
  { nav: 'vencimientos', label: 'Vencimientos', icon: Calendar },
];

export default function Layout({ children, currentNav, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-slate-200">
          <button onClick={() => onNavigate({ type: 'dashboard' })} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SGT</span>
            </div>
            <span className="font-bold text-slate-800">SGT</span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ nav, label, icon: Icon }) => (
            <button
              key={nav}
              onClick={() => onNavigate({ type: nav })}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentNav === nav
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${currentNav === nav ? 'text-blue-600' : 'text-slate-400'}`} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-2 px-3 py-2">
            <span className="text-xs text-slate-500 truncate flex-1">{user?.email}</span>
            <button
              onClick={signOut}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-60 flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
