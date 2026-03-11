import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import ResetPassword from './pages/Auth/ResetPassword';
import ForgotPassword from './pages/Auth/ForgotPassword';
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
import INALPage from './pages/INALPage';
import SENASAPage from './pages/SENASAPage';
import Legal from './pages/Legal';
import AsistenteIA from './pages/AsistenteIA';
import AlertasRegulatorias from './components/Admin/AlertasRegulatorias';
import StockPage from './pages/StockPage';
import VentasPage from './pages/VentasPage';
import CajaPage from './pages/CajaPage';
import ProveedoresPage from './pages/ProveedoresPage';
import ProduccionPage from './pages/ProduccionPage';
import PedidosPage from './pages/PedidosPage';
import LogisticaPage from './pages/LogisticaPage';
import PortalDespachanteApp from './pages/Despachante/PortalDespachante';
import CertificadosPage from './pages/CertificadosPage';
import ProductPassport from './pages/ProductPassport';
import QRLanding from './pages/QRLanding';

function AppContent() {
  const [page, setPage] = useState<Page>(() => {
    // Check if URL path is for a public cotizacion
    const path = window.location.pathname;
    const cotizMatch = path.match(/^\/cotizacion\/(.+)$/);
    if (cotizMatch) return { type: 'cotizacion-publica', urlPublica: cotizMatch[1] };
    const passportMatch = path.match(/^\/passport\/(.+)$/);
    if (passportMatch) return { type: 'passport', productUuid: passportMatch[1] };
    const qrMatch = path.match(/^\/qr\/(.+)$/);
    if (qrMatch) return { type: 'qr-landing', productUuid: qrMatch[1] };
    return { type: 'dashboard' };
  });

  // Supabase checks removed — using local backend now

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
      case 'inal': return 'inal' as const;
      case 'senasa': return 'senasa' as const;
      case 'asistente-ia': return 'asistente-ia' as const;
      case 'vigia-regulatorio': return 'vigia-regulatorio' as const;
      case 'stock': return 'stock' as const;
      case 'ventas': return 'ventas' as const;
      case 'caja': return 'caja' as const;
      case 'proveedores': return 'proveedores' as const;
      case 'produccion': return 'produccion' as const;
      case 'pedidos': return 'pedidos' as const;
      case 'logistica': return 'logistica' as const;
      case 'certificados': return 'certificados' as const;
      case 'legal': return 'configuracion' as const;
      default: return 'dashboard' as const;
    }
  };

  // Public views - render without layout
  if (page.type === 'cotizacion-publica') {
    return <CotizacionViewPublica urlPublica={page.urlPublica} />;
  }
  if (page.type === 'passport') {
    return <ProductPassport productUuid={page.productUuid} />;
  }
  if (page.type === 'qr-landing') {
    return <QRLanding productUuid={page.productUuid} onRedirect={() => navigate({ type: 'passport', productUuid: page.productUuid })} />;
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
      {page.type === 'inal' && <INALPage />}
      {page.type === 'senasa' && <SENASAPage />}
      {page.type === 'asistente-ia' && <AsistenteIA onNavigate={navigate} />}
      {page.type === 'vigia-regulatorio' && <AlertasRegulatorias />}
      {page.type === 'stock' && <StockPage clienteId={page.clienteId} />}
      {page.type === 'ventas' && <VentasPage clienteId={page.clienteId} onNavigate={navigate} />}
      {page.type === 'caja' && <CajaPage clienteId={page.clienteId} />}
      {page.type === 'proveedores' && <ProveedoresPage clienteId={page.clienteId} />}
      {page.type === 'produccion' && <ProduccionPage clienteId={page.clienteId} />}
      {page.type === 'pedidos' && <PedidosPage clienteId={page.clienteId} />}
      {page.type === 'logistica' && <LogisticaPage clienteId={page.clienteId} />}
      {page.type === 'certificados' && <CertificadosPage clienteId={page.clienteId} />}
      {page.type === 'legal' && <Legal initialSection={page.section} onBack={() => navigate({ type: 'dashboard' })} />}
    </Layout>
  );
}

type AuthView = 'login' | 'signup' | 'forgot-password';

function AuthenticatedApp() {
  const { user, loading, userRole, isRecovery } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');

  // Public views - no auth required
  const path = window.location.pathname;
  const cotizMatch = path.match(/^\/cotizacion\/(.+)$/);
  if (cotizMatch) {
    return <CotizacionViewPublica urlPublica={cotizMatch[1]} />;
  }
  const passportMatch = path.match(/^\/passport\/(.+)$/);
  if (passportMatch) {
    return <ProductPassport productUuid={passportMatch[1]} />;
  }
  const qrMatch = path.match(/^\/qr\/(.+)$/);
  if (qrMatch) {
    return <QRLanding productUuid={qrMatch[1]} onRedirect={() => { window.location.href = `/passport/${qrMatch[1]}`; }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isRecovery && user) {
    return <ResetPassword />;
  }

  if (!user) {
    if (authView === 'signup') {
      return <SignUp onSwitchToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot-password') {
      return <ForgotPassword onBack={() => setAuthView('login')} />;
    }
    return (
      <Login
        onSwitchToSignUp={() => setAuthView('signup')}
        onSwitchToForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  }

  // Role comes with the user object now (no separate async load)
  // Fall back to 'gestor' if somehow null
  const effectiveRole = userRole || (user as any)?.rol || 'gestor';

  if (effectiveRole === 'despachante') return <PortalDespachanteApp />;

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
