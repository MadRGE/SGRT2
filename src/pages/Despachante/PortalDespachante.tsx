import { useState, useEffect } from 'react';
import { LayoutDashboard, Ship, Users, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DespachanteDashboard from './DespachanteDashboard';
import DespachosListPage from './DespachosListPage';
import DespachoDetailPage from './DespachoDetailPage';
import DespachoFormModal from './DespachoFormModal';
import DespachanteClientesPage from './DespachanteClientesPage';
import DespachanteClienteDetail from './DespachanteClienteDetail';
import DespachanteReportsPage from './DespachanteReportsPage';

type DespachanteView =
  | { type: 'dashboard' }
  | { type: 'despachos' }
  | { type: 'despacho'; id: string }
  | { type: 'clientes' }
  | { type: 'cliente'; id: string }
  | { type: 'reportes' }
  | { type: 'nuevo-despacho'; clienteId?: string };

type NavSection = {
  section: string;
  items: { id: string; label: string; icon: typeof LayoutDashboard }[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    section: 'Operaciones',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'despachos', label: 'Despachos', icon: Ship },
    ],
  },
  {
    section: 'Gestión',
    items: [
      { id: 'clientes', label: 'Mis Clientes', icon: Users },
      { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    ],
  },
];

export default function PortalDespachanteApp() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<DespachanteView>({ type: 'dashboard' });
  const [showNewModal, setShowNewModal] = useState(false);
  const [preselectedClienteId, setPreselectedClienteId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (v: DespachanteView) => {
    setView(v);
    setSidebarOpen(false);
  };

  const handleNewDespacho = (clienteId?: string) => {
    setPreselectedClienteId(clienteId);
    setShowNewModal(true);
  };

  const handleDespachoCreated = (id: string) => {
    setShowNewModal(false);
    setPreselectedClienteId(undefined);
    navigate({ type: 'despacho', id });
  };

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentNav = () => {
    switch (view.type) {
      case 'dashboard': return 'dashboard';
      case 'despachos': case 'despacho': case 'nuevo-despacho': return 'despachos';
      case 'clientes': case 'cliente': return 'clientes';
      case 'reportes': return 'reportes';
      default: return 'dashboard';
    }
  };

  const userName = (user?.user_metadata?.nombre as string) || user?.email || 'Despachante';

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-[#0f172a] flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
            <Ship className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">Despachante</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-[220px] bg-[#0f172a] h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        {/* Brand */}
        <div className="px-5 py-5">
          <button onClick={() => navigate({ type: 'dashboard' })} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Ship className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-[15px] tracking-tight">SGT</span>
              <p className="text-[10px] text-slate-400 -mt-0.5">Portal Despachante</p>
            </div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-1 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.section}>
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.section}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ id, label, icon: Icon }) => {
                  const active = currentNav() === id;
                  return (
                    <button
                      key={id}
                      onClick={() => navigate({ type: id as DespachanteView['type'] })}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                        active
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-[18px] h-[18px] ${active ? 'text-amber-400' : ''}`} />
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-300 truncate">{userName}</p>
              <p className="text-[10px] text-slate-500">Despachante</p>
            </div>
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
      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen pt-14 md:pt-0">
        <main className="flex-1 p-4 md:p-8">
          {view.type === 'dashboard' && (
            <DespachanteDashboard
              onNavigate={navigate}
              onNewDespacho={() => handleNewDespacho()}
            />
          )}
          {view.type === 'despachos' && (
            <DespachosListPage
              onNavigate={navigate}
              onNewDespacho={() => handleNewDespacho()}
            />
          )}
          {view.type === 'despacho' && (
            <DespachoDetailPage
              despachoId={view.id}
              onBack={() => navigate({ type: 'despachos' })}
              onNavigate={navigate}
            />
          )}
          {view.type === 'clientes' && (
            <DespachanteClientesPage
              onNavigate={navigate}
            />
          )}
          {view.type === 'reportes' && (
            <DespachanteReportsPage />
          )}
          {view.type === 'cliente' && (
            <DespachanteClienteDetail
              clienteId={view.id}
              onBack={() => navigate({ type: 'clientes' })}
              onNavigate={navigate}
              onNewDespacho={(cid) => handleNewDespacho(cid)}
            />
          )}
        </main>
      </div>

      {/* New Despacho Modal */}
      <DespachoFormModal
        isOpen={showNewModal}
        onClose={() => { setShowNewModal(false); setPreselectedClienteId(undefined); }}
        onSuccess={handleDespachoCreated}
        preselectedClienteId={preselectedClienteId}
      />
    </div>
  );
}
