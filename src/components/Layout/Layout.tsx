import { ReactNode, useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Users, FileText, LogOut, Calendar, Briefcase, DollarSign,
  Plus, X, Trash2, BookOpen, BarChart3, Settings, Bell, Shield, Bot, Menu,
  ChevronDown, Package, Leaf, FlaskConical, TrendingUp, Award,
  ShoppingCart, Wallet, Truck, Factory, ClipboardList, Route,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import GlobalSearch from './GlobalSearch';

// ─── Page types ───

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
  | { type: 'usuarios' }
  | { type: 'anmat' }
  | { type: 'inal' }
  | { type: 'senasa' }
  | { type: 'legal'; section?: 'terms' | 'privacy' | 'confidentiality' }
  | { type: 'asistente-ia' }
  | { type: 'vigia-regulatorio' }
  | { type: 'stock'; clienteId?: string }
  | { type: 'ventas'; clienteId?: string }
  | { type: 'caja'; clienteId?: string }
  | { type: 'proveedores'; clienteId?: string }
  | { type: 'produccion'; clienteId?: string }
  | { type: 'pedidos'; clienteId?: string }
  | { type: 'logistica'; clienteId?: string }
  | { type: 'certificados'; clienteId?: string }
  | { type: 'passport'; productUuid: string }
  | { type: 'qr-landing'; productUuid: string };

type NavPage =
  | 'dashboard' | 'clientes' | 'gestiones' | 'tramites' | 'vencimientos'
  | 'precios' | 'papelera' | 'catalogo' | 'reportes' | 'configuracion'
  | 'cotizaciones' | 'notificaciones' | 'finanzas' | 'usuarios'
  | 'anmat' | 'inal' | 'senasa' | 'asistente-ia' | 'vigia-regulatorio'
  | 'stock' | 'ventas' | 'caja' | 'proveedores' | 'produccion' | 'pedidos' | 'logistica'
  | 'certificados';

interface LayoutProps {
  children: ReactNode;
  currentNav: NavPage;
  onNavigate: (page: Page) => void;
}

// ─── Module definitions ───

interface NavItem {
  nav: NavPage;
  label: string;
  icon: LucideIcon;
}

interface NavModule {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;          // tailwind gradient for icon bg
  dotColor: string;       // tailwind color for the dot indicator
  activeColor: string;    // text color when active
  activeBg: string;       // bg when active item
  items: NavItem[];
}

const NAV_MODULES: NavModule[] = [
  {
    id: 'core',
    label: 'General',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-indigo-600',
    dotColor: 'bg-blue-400',
    activeColor: 'text-blue-400',
    activeBg: 'bg-blue-500/10',
    items: [
      { nav: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { nav: 'gestiones', label: 'Gestiones', icon: Briefcase },
      { nav: 'tramites', label: 'Trámites', icon: FileText },
      { nav: 'clientes', label: 'Clientes', icon: Users },
      { nav: 'vencimientos', label: 'Vencimientos', icon: Calendar },
    ],
  },
  {
    id: 'anmat',
    label: 'ANMAT',
    icon: Shield,
    color: 'from-indigo-500 to-violet-600',
    dotColor: 'bg-indigo-400',
    activeColor: 'text-indigo-400',
    activeBg: 'bg-indigo-500/10',
    items: [
      { nav: 'anmat', label: 'Casos & Herramientas', icon: Shield },
    ],
  },
  {
    id: 'inal',
    label: 'INAL',
    icon: FlaskConical,
    color: 'from-emerald-500 to-teal-600',
    dotColor: 'bg-emerald-400',
    activeColor: 'text-emerald-400',
    activeBg: 'bg-emerald-500/10',
    items: [
      { nav: 'inal', label: 'Envases & Alimentos', icon: Package },
    ],
  },
  {
    id: 'senasa',
    label: 'SENASA',
    icon: Leaf,
    color: 'from-orange-500 to-amber-600',
    dotColor: 'bg-orange-400',
    activeColor: 'text-orange-400',
    activeBg: 'bg-orange-500/10',
    items: [
      { nav: 'senasa', label: 'Fitosanitarios', icon: Leaf },
    ],
  },
  {
    id: 'certificados',
    label: 'Certificados',
    icon: Award,
    color: 'from-amber-500 to-orange-600',
    dotColor: 'bg-amber-400',
    activeColor: 'text-amber-400',
    activeBg: 'bg-amber-500/10',
    items: [
      { nav: 'certificados', label: 'Certificados & QR', icon: Award },
    ],
  },
  {
    id: 'comercial',
    label: 'Comercial',
    icon: TrendingUp,
    color: 'from-amber-500 to-yellow-600',
    dotColor: 'bg-amber-400',
    activeColor: 'text-amber-400',
    activeBg: 'bg-amber-500/10',
    items: [
      { nav: 'cotizaciones', label: 'Cotizaciones', icon: DollarSign },
      { nav: 'precios', label: 'Precios', icon: DollarSign },
      { nav: 'finanzas', label: 'Finanzas', icon: BarChart3 },
      { nav: 'reportes', label: 'Reportes', icon: BarChart3 },
    ],
  },
  {
    id: 'herramientas',
    label: 'Herramientas',
    icon: Package,
    color: 'from-cyan-500 to-blue-600',
    dotColor: 'bg-cyan-400',
    activeColor: 'text-cyan-400',
    activeBg: 'bg-cyan-500/10',
    items: [
      { nav: 'stock', label: 'Control de Stock', icon: Package },
      { nav: 'ventas', label: 'Ventas / POS', icon: ShoppingCart },
      { nav: 'caja', label: 'Caja', icon: Wallet },
      { nav: 'proveedores', label: 'Proveedores', icon: Truck },
      { nav: 'produccion', label: 'Producción', icon: Factory },
      { nav: 'pedidos', label: 'Pedidos', icon: ClipboardList },
      { nav: 'logistica', label: 'Logística', icon: Route },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: Settings,
    color: 'from-slate-500 to-slate-600',
    dotColor: 'bg-slate-400',
    activeColor: 'text-slate-300',
    activeBg: 'bg-slate-500/10',
    items: [
      { nav: 'vigia-regulatorio', label: 'Vigía Regulatorio', icon: Bell },
      { nav: 'notificaciones', label: 'Notificaciones', icon: Bell },
      { nav: 'asistente-ia', label: 'Asistente IA', icon: Bot },
      { nav: 'catalogo', label: 'Catálogo', icon: BookOpen },
      { nav: 'usuarios', label: 'Usuarios', icon: Shield },
      { nav: 'configuracion', label: 'Configuración', icon: Settings },
      { nav: 'papelera', label: 'Papelera', icon: Trash2 },
    ],
  },
];

// Map a NavPage to its module id
function getModuleForNav(nav: NavPage): string {
  for (const mod of NAV_MODULES) {
    if (mod.items.some(item => item.nav === nav)) return mod.id;
  }
  return 'core';
}

const QUICK_ACTIONS = [
  { label: 'Nuevo Cliente', icon: Users, color: 'from-emerald-500 to-green-600', page: { type: 'nuevo-cliente' } as Page },
  { label: 'Nueva Gestión', icon: Briefcase, color: 'from-blue-500 to-indigo-600', page: { type: 'nueva-gestion' } as Page },
  { label: 'Nuevo Trámite', icon: FileText, color: 'from-violet-500 to-purple-600', page: { type: 'nuevo-tramite' } as Page },
];

// ─── Layout component ───

export default function Layout({ children, currentNav, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [quickOpen, setQuickOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

  // Which modules are expanded — auto-expand the active one
  const activeModule = getModuleForNav(currentNav);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set([activeModule]));

  // Auto-expand active module when nav changes
  useEffect(() => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.add(activeModule);
      return next;
    });
  }, [activeModule]);

  // Fetch badge counts on mount
  useEffect(() => {
    const fetchBadges = async () => {
      const counts: Record<string, number> = {};
      try {
        // ANMAT: open cases
        const { count: anmatCount } = await supabase
          .from('anmat_casos')
          .select('id', { count: 'exact', head: true })
          .neq('estado', 'cerrado');
        if (anmatCount && anmatCount > 0) counts['anmat'] = anmatCount;

        // Tramites with semaforo = 'rojo' grouped by module
        const { data: rojos } = await supabase
          .from('tramites')
          .select('organismo')
          .eq('semaforo', 'rojo')
          .is('deleted_at', null);
        if (rojos) {
          const byOrg: Record<string, number> = {};
          for (const t of rojos) {
            const org = (t.organismo || '').toLowerCase();
            byOrg[org] = (byOrg[org] || 0) + 1;
          }
          // Map organismo to module id
          if (byOrg['inal']) counts['inal'] = (counts['inal'] || 0) + byOrg['inal'];
          if (byOrg['senasa']) counts['senasa'] = (counts['senasa'] || 0) + byOrg['senasa'];
          if (byOrg['anmat']) counts['anmat'] = (counts['anmat'] || 0) + (byOrg['anmat'] || 0);
          // Core module: sum all rojos
          const totalRojos = rojos.length;
          if (totalRojos > 0) counts['core'] = totalRojos;
        }
      } catch {
        // silently fail
      }
      setBadgeCounts(counts);
    };
    fetchBadges();
  }, []);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  // Close on click outside (FAB)
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
    if (!quickOpen && !sidebarOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQuickOpen(false);
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [quickOpen, sidebarOpen]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (page: Page) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-[#0f172a] flex items-center justify-between px-4 py-3">
        <button onClick={() => handleNavClick({ type: 'dashboard' })} className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-black text-xs tracking-tight">SG</span>
          </div>
          <span className="font-bold text-white text-sm tracking-tight">SGRT</span>
        </button>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Abrir menú"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== Sidebar ===== */}
      <aside className={`w-[240px] bg-[#0f172a] h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        {/* Brand */}
        <div className="px-5 py-5">
          <button onClick={() => handleNavClick({ type: 'dashboard' })} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-black text-sm tracking-tight">SG</span>
            </div>
            <div>
              <span className="font-bold text-white text-[15px] tracking-tight">SGRT</span>
              <p className="text-[10px] text-slate-400 -mt-0.5">Gestión Regulatoria</p>
            </div>
          </button>
        </div>

        {/* Module navigation */}
        <nav className="flex-1 px-3 mt-1 overflow-y-auto space-y-1 scrollbar-thin">
          {NAV_MODULES.map((mod) => {
            const isExpanded = expandedModules.has(mod.id);
            const isActiveModule = activeModule === mod.id;
            const ModIcon = mod.icon;

            return (
              <div key={mod.id}>
                {/* Module header */}
                <button
                  onClick={() => toggleModule(mod.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold uppercase tracking-wider transition-all duration-200 group ${
                    isActiveModule
                      ? 'text-white bg-white/5'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${mod.dotColor} ${isActiveModule ? 'shadow-sm shadow-current' : 'opacity-50'}`} />
                  <ModIcon className={`w-4 h-4 ${isActiveModule ? mod.activeColor : 'text-slate-500 group-hover:text-slate-400'}`} />
                  <span className="flex-1 text-left">{mod.label}</span>
                  {badgeCounts[mod.id] && badgeCounts[mod.id] > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
                      {badgeCounts[mod.id]}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                </button>

                {/* Module items (collapsible) */}
                <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-4 pl-3 border-l border-slate-700/50 space-y-0.5 py-1">
                    {mod.items.map(({ nav, label, icon: Icon }) => {
                      const active = currentNav === nav;
                      return (
                        <button
                          key={nav}
                          onClick={() => handleNavClick({ type: nav })}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                            active
                              ? `${mod.activeBg} ${mod.activeColor} shadow-sm`
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? mod.activeColor : ''}`} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* User card */}
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

      {/* ===== Content ===== */}
      <div className="md:ml-[240px] flex-1 flex flex-col min-h-screen pt-14 md:pt-0">
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>

        <footer className="px-4 md:px-8 py-4 border-t border-slate-200 bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <span className="text-center md:text-left">&copy; 2024&ndash;{new Date().getFullYear()} SGRT &mdash; Sistema de Gesti&oacute;n Regulatoria de Tr&aacute;mites.</span>
            <div className="flex items-center gap-4">
              <button onClick={() => handleNavClick({ type: 'legal', section: 'terms' })} className="hover:text-slate-600 transition-colors">T&eacute;rminos</button>
              <button onClick={() => handleNavClick({ type: 'legal', section: 'privacy' })} className="hover:text-slate-600 transition-colors">Privacidad</button>
              <button onClick={() => handleNavClick({ type: 'legal', section: 'confidentiality' })} className="hover:text-slate-600 transition-colors">Confidencialidad</button>
            </div>
          </div>
        </footer>
      </div>

      {/* ===== FAB: Quick Create ===== */}
      <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
        {quickOpen && (
          <>
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
        <button
          onClick={() => setQuickOpen(!quickOpen)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
            quickOpen
              ? 'bg-slate-700 shadow-slate-700/30 rotate-0'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105'
          }`}
        >
          {quickOpen ? <X className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
        </button>
      </div>

      {/* Global Search (Ctrl+K) */}
      <GlobalSearch onNavigate={onNavigate} />

      <style>{`
        @keyframes fab-slide-up {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// Export module definitions for use in Dashboard module selector
export { NAV_MODULES };
export type { NavModule };
