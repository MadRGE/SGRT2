import { ReactNode } from 'react';
import { LayoutDashboard, Users, FileText, LogOut, Calendar, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export type Page =
  | { type: 'dashboard' }
  | { type: 'clientes' }
  | { type: 'cliente'; id: string }
  | { type: 'gestiones' }
  | { type: 'gestion'; id: string }
  | { type: 'tramites' }
  | { type: 'tramite'; id: string }
  | { type: 'vencimientos' }
  | { type: 'nuevo-tramite'; gestionId?: string; clienteId?: string }
  | { type: 'nueva-gestion'; clienteId?: string }
  | { type: 'nuevo-cliente' }
  | { type: 'presupuesto'; gestionId: string };

type NavPage = 'dashboard' | 'clientes' | 'gestiones' | 'tramites' | 'vencimientos';

interface LayoutProps {
  children: ReactNode;
  currentNav: NavPage;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { nav: NavPage; label: string; icon: typeof LayoutDashboard }[] = [
  { nav: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { nav: 'gestiones', label: 'Gestiones', icon: Briefcase },
  { nav: 'tramites', label: 'Trámites', icon: FileText },
  { nav: 'clientes', label: 'Clientes', icon: Users },
  { nav: 'vencimientos', label: 'Vencimientos', icon: Calendar },
];

export default function Layout({ children, currentNav, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex">
      {/* Sidebar oscuro */}
      <aside className="w-[220px] bg-[#0f172a] h-screen fixed left-0 top-0 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5">
          <button onClick={() => onNavigate({ type: 'dashboard' })} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-black text-sm tracking-tight">SG</span>
            </div>
            <div>
              <span className="font-bold text-white text-[15px] tracking-tight">SGT</span>
              <p className="text-[10px] text-slate-400 -mt-0.5">Gestión de Trámites</p>
            </div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-2 space-y-0.5">
          {NAV_ITEMS.map(({ nav, label, icon: Icon }) => {
            const active = currentNav === nav;
            return (
              <button
                key={nav}
                onClick={() => onNavigate({ type: nav })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${active ? 'text-blue-400' : ''}`} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 mx-3 mb-4 rounded-xl bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{user?.email?.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-[11px] text-slate-400 truncate flex-1">{user?.email}</span>
            <button
              onClick={signOut}
              className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-[220px] flex-1 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
