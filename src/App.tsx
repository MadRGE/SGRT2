import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { checkSoftDelete, checkSeguimientoUserCol } from './lib/supabase';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import ResetPassword from './pages/Auth/ResetPassword';
import Layout, { type Page } from './components/Layout/Layout';
import DashboardV2 from './pages/DashboardV2';
import ClientesV2 from './pages/ClientesV2';
import ClienteDetailV2 from './pages/ClienteDetailV2';
import GestionesV2 from './pages/GestionesV2';
import GestionDetailV2 from './pages/GestionDetailV2';
import NuevaGestionV2 from './pages/NuevaGestionV2';
import TramitesV2 from './pages/TramitesV2';
import TramiteDetailV2 from './pages/TramiteDetailV2';
import NuevoTramiteV2 from './pages/NuevoTramiteV2';
import VencimientosV2 from './pages/VencimientosV2';
import PresupuestoV2 from './pages/PresupuestoV2';
import PreciosV2 from './pages/PreciosV2';
import PortalClienteV2 from './pages/PortalClienteV2';
import PapeleraV2 from './pages/PapeleraV2';
import Catalogo from './pages/Catalogo';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import Cotizaciones from './pages/Cotizaciones';
import Notificaciones from './pages/Notificaciones/Notificaciones';
import ModuloFinancieroContable from './pages/ModuloFinancieroContable';
import GestionUsuarios from './pages/Admin/GestionUsuarios';
import CotizacionViewPublica from './components/CotizacionViewPublica';
import ANMATPage from './pages/ANMATPage';
import Legal from './pages/Legal';
import AsistenteIA from './pages/AsistenteIA';
import PortalDespachanteApp from './pages/Despachante/PortalDespachante';

function AppContent() {
  const [page, setPage] = useState<Page>(() => {
    // Check if URL path is for a public cotizacion
    const path = window.location.pathname;
    const cotizMatch = path.match(/^\/cotizacion\/(.+)$/);
    if (cotizMatch) return { type: 'cotizacion-publica', urlPublica: cotizMatch[1] };
    return { type: 'dashboard' };
  });

  useEffect(() => { checkSoftDelete(); checkSeguimientoUserCol(); }, []);

  const navigate = (p: Page) => setPage(p);

  const currentNav = () => {
    switch (page.type) {
      case 'dashboard': return 'dashboard' as const;
      case 'clientes': case 'cliente': case 'nuevo-cliente': case 'portal-cliente': return 'clientes' as const;
      case 'gestiones': case 'gestion': case 'nueva-gestion': case 'presupuesto': return 'gestiones' as const;
      case 'tramites': case 'tramite': case 'nuevo-tramite': return 'tramites' as const;
      case 'precios': return 'precios' as const;
      case 'vencimientos': return 'vencimientos' as const;
      case 'papelera': return 'papelera' as const;
      case 'catalogo': return 'catalogo' as const;
      case 'reportes': return 'reportes' as const;
      case 'configuracion': return 'configuracion' as const;
      case 'cotizaciones': case 'cotizacion-publica': return 'cotizaciones' as const;
      case 'notificaciones': return 'notificaciones' as const;
      case 'finanzas': return 'finanzas' as const;
      case 'usuarios': return 'usuarios' as const;
      case 'anmat': return 'anmat' as const;
      case 'asistente-ia': return 'asistente-ia' as const;
      case 'legal': return 'configuracion' as const;
      default: return 'dashboard' as const;
    }
  };

  // Public cotizacion view - render without layout
  if (page.type === 'cotizacion-publica') {
    return <CotizacionViewPublica urlPublica={page.urlPublica} />;
  }

  return (
    <Layout currentNav={currentNav()} onNavigate={navigate}>
      {page.type === 'dashboard' && <DashboardV2 onNavigate={navigate} />}
      {page.type === 'clientes' && <ClientesV2 onNavigate={navigate} />}
      {page.type === 'nuevo-cliente' && <ClientesV2 onNavigate={navigate} autoOpen />}
      {page.type === 'cliente' && <ClienteDetailV2 clienteId={page.id} onNavigate={navigate} />}
      {page.type === 'gestiones' && <GestionesV2 onNavigate={navigate} />}
      {page.type === 'gestion' && <GestionDetailV2 gestionId={page.id} onNavigate={navigate} />}
      {page.type === 'nueva-gestion' && <NuevaGestionV2 clienteId={page.clienteId} onNavigate={navigate} />}
      {page.type === 'tramites' && <TramitesV2 onNavigate={navigate} />}
      {page.type === 'tramite' && <TramiteDetailV2 tramiteId={page.id} onNavigate={navigate} />}
      {page.type === 'nuevo-tramite' && <NuevoTramiteV2 gestionId={page.gestionId} clienteId={page.clienteId} onNavigate={navigate} />}
      {page.type === 'presupuesto' && <PresupuestoV2 gestionId={page.gestionId} onNavigate={navigate} />}
      {page.type === 'portal-cliente' && <PortalClienteV2 clienteId={page.clienteId} onNavigate={navigate} />}
      {page.type === 'precios' && <PreciosV2 />}
      {page.type === 'vencimientos' && <VencimientosV2 onNavigate={navigate} />}
      {page.type === 'papelera' && <PapeleraV2 />}
      {page.type === 'catalogo' && <Catalogo onBack={() => navigate({ type: 'dashboard' })} />}
      {page.type === 'reportes' && <Reportes onBack={() => navigate({ type: 'dashboard' })} />}
      {page.type === 'configuracion' && <Configuracion onBack={() => navigate({ type: 'dashboard' })} />}
      {page.type === 'cotizaciones' && <Cotizaciones onBack={() => navigate({ type: 'dashboard' })} />}
      {page.type === 'notificaciones' && <Notificaciones onBack={() => navigate({ type: 'dashboard' })} />}
      {page.type === 'finanzas' && (
        <ModuloFinancieroContable
          onBack={() => navigate({ type: 'dashboard' })}
          onViewProyecto={(id) => navigate({ type: 'gestion', id })}
        />
      )}
      {page.type === 'usuarios' && <GestionUsuarios onBack={() => navigate({ type: 'dashboard' })} />}
      {page.type === 'anmat' && <ANMATPage />}
      {page.type === 'asistente-ia' && <AsistenteIA onNavigate={navigate} />}
      {page.type === 'legal' && <Legal initialSection={page.section} onBack={() => navigate({ type: 'dashboard' })} />}
    </Layout>
  );
}

function AuthenticatedApp() {
  const { user, loading, userRole } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    if (hash.includes('type=recovery') || path === '/reset-password') {
      setIsResetPassword(true);
    }
  }, []);

  // Public cotizacion view - no auth required
  const path = window.location.pathname;
  const cotizMatch = path.match(/^\/cotizacion\/(.+)$/);
  if (cotizMatch) {
    return <CotizacionViewPublica urlPublica={cotizMatch[1]} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isResetPassword && user) {
    return <ResetPassword />;
  }

  if (!user) {
    return showSignUp ? (
      <SignUp onSwitchToLogin={() => setShowSignUp(false)} />
    ) : (
      <Login onSwitchToSignUp={() => setShowSignUp(true)} />
    );
  }

  if (userRole === 'despachante') return <PortalDespachanteApp />;

  return <AppContent />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#1e293b', color: '#fff' } }} />
    </AuthProvider>
  );
}
