import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

function AppContent() {
  const [page, setPage] = useState<Page>({ type: 'dashboard' });

  const navigate = (p: Page) => setPage(p);

  const currentNav = () => {
    switch (page.type) {
      case 'dashboard': return 'dashboard' as const;
      case 'clientes': case 'cliente': case 'nuevo-cliente': return 'clientes' as const;
      case 'gestiones': case 'gestion': case 'nueva-gestion': case 'presupuesto': return 'gestiones' as const;
      case 'tramites': case 'tramite': case 'nuevo-tramite': return 'tramites' as const;
      case 'vencimientos': return 'vencimientos' as const;
      default: return 'dashboard' as const;
    }
  };

  return (
    <Layout currentNav={currentNav()} onNavigate={navigate}>
      {page.type === 'dashboard' && <DashboardV2 onNavigate={navigate} />}
      {page.type === 'clientes' && <ClientesV2 onNavigate={navigate} />}
      {page.type === 'cliente' && <ClienteDetailV2 clienteId={page.id} onNavigate={navigate} />}
      {page.type === 'gestiones' && <GestionesV2 onNavigate={navigate} />}
      {page.type === 'gestion' && <GestionDetailV2 gestionId={page.id} onNavigate={navigate} />}
      {page.type === 'nueva-gestion' && <NuevaGestionV2 clienteId={page.clienteId} onNavigate={navigate} />}
      {page.type === 'tramites' && <TramitesV2 onNavigate={navigate} />}
      {page.type === 'tramite' && <TramiteDetailV2 tramiteId={page.id} onNavigate={navigate} />}
      {page.type === 'nuevo-tramite' && <NuevoTramiteV2 gestionId={page.gestionId} clienteId={page.clienteId} onNavigate={navigate} />}
      {page.type === 'presupuesto' && <PresupuestoV2 gestionId={page.gestionId} onNavigate={navigate} />}
      {page.type === 'vencimientos' && <VencimientosV2 onNavigate={navigate} />}
    </Layout>
  );
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    if (hash.includes('type=recovery') || path === '/reset-password') {
      setIsResetPassword(true);
    }
  }, []);

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

  return <AppContent />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
