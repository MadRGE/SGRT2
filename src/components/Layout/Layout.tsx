import { ReactNode, useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Users, FileText, LogOut, Calendar, Briefcase, DollarSign, Plus, X, Trash2, BookOpen, BarChart3, Settings, Bell, Shield } from 'lucide-react';
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
  | { type: 'presupuesto'; gestionId: string }
  | { type: 'precios' }
  | { type: 'papelera' }
  | { type: 'portal-cliente'; clienteId: string }
  | { type: 'catalogo' }
  | { type: 'reportes' }
  | { type: 'configuracion' }
  | { type: 'cotizaciones' }
  | { type: 'cotizacion-publica'; urlPublica: string }
  | { type: 'notificaciones' }
  | { type: 'finanzas' }
  | { type: 'usuarios' };

type NavPage = 'dashboard' | 'clientes' | 'gestiones' | 'tramites' | 'vencimientos' | 'precios' | 'papelera' | 'catalogo' | 'reportes' | 'configuracion' | 'cotizaciones' | 'notificaciones' | 'finanzas' | 'usuarios';

interface LayoutProps {
  children: ReactNode;
  currentNav: NavPage;
  onNavigate: (page: Page) => void;
}

type NavSection = { section: string; items: { nav: NavPage; label: string; icon: typeof LayoutDashboard }[] };

const NAV_SECTIONS: NavSection[] = [
  {
    section: 'Operaciones',
    items: [
      { nav: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { nav: 'gestiones', label: 'Gestiones', icon: Briefcase },
      { nav: 'tramites', label: 'Trámites', icon: FileText },
      { nav: 'clientes', label: 'Clientes', icon: Users },
      { nav: 'cotizaciones', label: 'Cotizaciones', icon: DollarSign },
      { nav: 'vencimientos', label: 'Vencimientos', icon: Calendar },
      { nav: 'notificaciones', label: 'Notificaciones', icon: Bell },
    ],
  },
  {
    section: 'Administración',
    items: [
      { nav: 'catalogo', label: 'Catálogo', icon: BookOpen },
      { nav: 'precios', label: 'Precios', icon: DollarSign },
      { nav: 'finanzas', label: 'Finanzas', icon: BarChart3 },
      { nav: 'reportes', label: 'Reportes', icon: BarChart3 },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { nav: 'usuarios', label: 'Usuarios', icon: Shield },
      { nav: 'configuracion', label: 'Configuración', icon: Settings },
      { nav: 'papelera', label: 'Papelera', icon: Trash2 },
    ],
  },
];

const QUICK_ACTIONS = [
  { label: 'Nuevo Cliente', icon: Users, color: 'from-emerald-500 to-green-600', page: { type: 'nuevo-cliente' } as Page },
  { label: 'Nueva Gestión', icon: Briefcase, color: 'from-blue-500 to-indigo-600', page: { type: 'nueva-gestion' } as Page },
  { label: 'Nuevo Trámite', icon: FileText, color: 'from-violet-500 to-purple-600', page: { type: 'nuevo-tramite' } as Page },
];

export default function Layout({ children, currentNav, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [quickOpen, setQuickOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!quickOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setQuickOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [quickOpen]);

  // Close on Escape
  useEffect(() => {
    if (!quickOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuickOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [quickOpen]);

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

        {/* Nav with sections */}
        <nav className="flex-1 px-3 mt-1 overflow-y-auto">
          {NAV_SECTIONS.map(({ section, items }) => (
            <div key={section} className="mb-3">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section}
              </p>
              <div className="space-y-0.5">
                {items.map(({ nav, label, icon: Icon }) => {
                  const active = currentNav === nav;
                  return (
                    <button
                      key={nav}
                      onClick={() => onNavigate({ type: nav })}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
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
              </div>
            </div>
          ))}
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

      {/* ===== FAB: Quick Create ===== */}
      <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
        {/* Menu items - fly up from button */}
        {quickOpen && (
          <>
            {/* Backdrop overlay */}
            <div className="fixed inset-0 bg-black/20 -z-10 backdrop-blur-[2px]" />

            <div className="absolute bottom-16 right-0 flex flex-col gap-2 items-end">
              {QUICK_ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => { onNavigate(action.page); setQuickOpen(false); }}
                    className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white rounded-xl shadow-lg shadow-slate-900/10 border border-slate-200/80 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group whitespace-nowrap"
                    style={{ animationDelay: `${i * 50}ms`, animation: 'fab-slide-up 0.2s ease-out both' }}
                  >
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{action.label}</span>
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Main FAB button */}
        <button
          onClick={() => setQuickOpen(!quickOpen)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
            quickOpen
              ? 'bg-slate-700 shadow-slate-700/30 rotate-0'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105'
          }`}
        >
          {quickOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* FAB animation keyframes */}
      <style>{`
        @keyframes fab-slide-up {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
