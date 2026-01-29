import { useState } from 'react';
import { Plus, LogOut, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import Layout from './components/Layout/Layout';
import PortalClienteLayout from './components/Layout/PortalClienteLayout';
import Dashboard from './pages/Dashboard';
import ProyectoWizard from './components/ProyectoWizardV7';
import ProyectoDetail from './pages/ProyectoDetail';
import ExpedienteDetail from './pages/ExpedienteDetail';
import ModuloFinancieroContable from './pages/ModuloFinancieroContable';
import Clientes from './pages/Clientes';
import ClienteDetail from './pages/ClienteDetail';
import Catalogo from './pages/Catalogo';
import Configuracion from './pages/Configuracion';
import Reportes from './pages/Reportes';
import PortalDashboard from './pages/PortalCliente/PortalDashboard';
import PortalProyectoDetail from './pages/PortalCliente/PortalProyectoDetail';
import GestionUsuarios from './pages/Admin/GestionUsuarios';
import PortalDespachante from './pages/Despachantes/PortalDespachante';
import DespachanteExpedienteDetail from './pages/Despachantes/DespachanteExpedienteDetail';
import Notificaciones from './pages/Notificaciones/Notificaciones';
import Cotizaciones from './pages/Cotizaciones';
import ConfiguracionMargenes from './pages/ConfiguracionMargenes';
import CatalogoServicios from './pages/CatalogoServicios';
import GestionProveedores from './pages/GestionProveedores';
import { CotizacionService } from './services/CotizacionService';
import { ANMATCasosList } from './components/ANMAT';

type View =
  | { type: 'dashboard' }
  | { type: 'wizard' }
  | { type: 'proyecto'; proyectoId: string }
  | { type: 'expediente'; expedienteId: string }
  | { type: 'finanzas' }
  | { type: 'clientes' }
  | { type: 'cliente'; clienteId: string }
  | { type: 'catalogo' }
  | { type: 'configuracion' }
  | { type: 'reportes' }
  | { type: 'notificaciones' }
  | { type: 'cotizaciones' }
  | { type: 'configuracion-margenes' }
  | { type: 'catalogo-servicios' }
  | { type: 'gestion-proveedores' }
  | { type: 'portal-cliente' }
  | { type: 'portal-proyecto'; proyectoId: string }
  | { type: 'admin-usuarios' }
  | { type: 'portal-despachante' }
  | { type: 'despachante-expediente'; expedienteId: string }
  | { type: 'anmat' };

function AppContent() {
  const { userRole, clienteId } = useAuth();
  const [view, setView] = useState<View>({ type: 'dashboard' });
  const mockClienteId = clienteId || 'cliente-demo-uuid';
  const mockDespachanteId = 'despachante-demo-uuid';

  if (userRole === 'cliente' && clienteId) {
    return (
      <PortalClienteLayout>
        {view.type === 'portal-proyecto' ? (
          <PortalProyectoDetail
            proyectoId={view.proyectoId}
            onBack={() => setView({ type: 'portal-cliente' })}
          />
        ) : (
          <PortalDashboard
            clienteId={clienteId}
            onViewProyecto={(proyectoId) => setView({ type: 'portal-proyecto', proyectoId })}
          />
        )}
      </PortalClienteLayout>
    );
  }

  const getPageTitle = () => {
    switch (view.type) {
      case 'dashboard':
        return 'Panel de Proyectos';
      case 'wizard':
        return 'Crear Nuevo Proyecto';
      case 'proyecto':
        return 'Detalle de Proyecto';
      case 'expediente':
        return 'Detalle de Expediente';
      case 'finanzas':
        return 'Módulo Financiero';
      case 'clientes':
        return 'Clientes';
      case 'cliente':
        return 'Detalle de Cliente';
      case 'catalogo':
        return 'Catálogo de Trámites';
      case 'configuracion':
        return 'Configuración';
      case 'reportes':
        return 'Reportes y Análisis';
      case 'notificaciones':
        return 'Notificaciones';
      case 'cotizaciones':
        return 'Cotizaciones';
      case 'configuracion-margenes':
        return 'Configuración de Márgenes';
      case 'catalogo-servicios':
        return 'Catálogo de Servicios';
      case 'gestion-proveedores':
        return 'Gestión de Proveedores';
      case 'portal-cliente':
        return 'Portal del Cliente';
      case 'portal-proyecto':
        return 'Mi Proyecto';
      case 'admin-usuarios':
        return 'Gestión de Usuarios';
      case 'portal-despachante':
        return 'Portal Despachante';
      case 'despachante-expediente':
        return 'Detalle de Expediente';
      case 'anmat':
        return 'Gestoría ANMAT';
      default:
        return 'SGT v5';
    }
  };

  const getCurrentPath = () => {
    switch (view.type) {
      case 'dashboard':
        return '/dashboard';
      case 'finanzas':
        return '/finanzas';
      case 'clientes':
      case 'cliente':
        return '/clientes';
      case 'catalogo':
        return '/catalogo';
      case 'configuracion':
        return '/configuracion';
      case 'reportes':
        return '/reportes';
      case 'notificaciones':
        return '/notificaciones';
      case 'cotizaciones':
        return '/cotizaciones';
      case 'configuracion-margenes':
        return '/configuracion';
      case 'anmat':
        return '/anmat';
      default:
        return '/dashboard';
    }
  };

  const getPrimaryAction = () => {
    if (view.type === 'dashboard') {
      return {
        label: 'Crear Nuevo Proyecto',
        onClick: () => setView({ type: 'wizard' }),
        icon: <Plus className="w-4 h-4" />
      };
    }
    if (view.type === 'clientes') {
      return {
        label: 'Nuevo Cliente',
        onClick: () => alert('Crear nuevo cliente - funcionalidad pendiente'),
        icon: <Plus className="w-4 h-4" />
      };
    }
    return undefined;
  };

  const handleNavigate = (path: string) => {
    if (path === '/dashboard') setView({ type: 'dashboard' });
    else if (path === '/finanzas') setView({ type: 'finanzas' });
    else if (path === '/clientes') setView({ type: 'clientes' });
    else if (path === '/catalogo') setView({ type: 'catalogo' });
    else if (path === '/configuracion') setView({ type: 'configuracion' });
    else if (path === '/reportes') setView({ type: 'reportes' });
    else if (path === '/notificaciones') setView({ type: 'notificaciones' });
    else if (path === '/cotizaciones') setView({ type: 'cotizaciones' });
    else if (path === '/catalogo-servicios') setView({ type: 'catalogo-servicios' });
    else if (path === '/gestion-proveedores') setView({ type: 'gestion-proveedores' });
    else if (path === '/portal-cliente') setView({ type: 'portal-cliente' });
    else if (path === '/portal-despachante') setView({ type: 'portal-despachante' });
    else if (path === '/anmat') setView({ type: 'anmat' });
  };

  if (view.type === 'portal-despachante' || view.type === 'despachante-expediente') {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SGT</span>
              </div>
              <div>
                <h1 className="font-bold text-slate-800">Portal de Despachante</h1>
              </div>
            </div>
            <button
              onClick={() => setView({ type: 'dashboard' })}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Volver al Panel de Gestor
            </button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">
          {view.type === 'portal-despachante' && (
            <PortalDespachante
              despachanteId={mockDespachanteId}
              onViewExpediente={(expedienteId) =>
                setView({ type: 'despachante-expediente', expedienteId })
              }
            />
          )}
          {view.type === 'despachante-expediente' && (
            <DespachanteExpedienteDetail
              expedienteId={view.expedienteId}
              despachanteId={mockDespachanteId}
              onBack={() => setView({ type: 'portal-despachante' })}
            />
          )}
        </main>
      </div>
    );
  }

  if (view.type === 'portal-cliente' || view.type === 'portal-proyecto') {
    return (
      <PortalClienteLayout onLogout={() => setView({ type: 'dashboard' })}>
        {view.type === 'portal-cliente' && (
          <PortalDashboard
            clienteId={mockClienteId}
            onViewProyecto={(proyectoId) => setView({ type: 'portal-proyecto', proyectoId })}
          />
        )}
        {view.type === 'portal-proyecto' && (
          <PortalProyectoDetail
            proyectoId={view.proyectoId}
            clienteId={mockClienteId}
            onBack={() => setView({ type: 'portal-cliente' })}
          />
        )}
      </PortalClienteLayout>
    );
  }

  return (
    <Layout
      currentPath={getCurrentPath()}
      onNavigate={handleNavigate}
      pageTitle={getPageTitle()}
      primaryAction={getPrimaryAction()}
    >
      {view.type === 'dashboard' && (
        <Dashboard
          onCreateProject={() => setView({ type: 'wizard' })}
          onViewProject={(proyectoId) => setView({ type: 'proyecto', proyectoId })}
        />
      )}
      {view.type === 'wizard' && (
        <ProyectoWizard
          onComplete={(proyectoId) => setView({ type: 'proyecto', proyectoId })}
          onCancel={() => setView({ type: 'dashboard' })}
        />
      )}
      {view.type === 'proyecto' && (
        <ProyectoDetail
          proyectoId={view.proyectoId}
          onBack={() => setView({ type: 'dashboard' })}
          onExpedienteClick={(expedienteId) => setView({ type: 'expediente', expedienteId })}
        />
      )}
      {view.type === 'expediente' && (
        <ExpedienteDetail
          expedienteId={view.expedienteId}
          onBack={() => setView({ type: 'dashboard' })}
        />
      )}
      {view.type === 'finanzas' && (
        <ModuloFinancieroContable
          onBack={() => setView({ type: 'dashboard' })}
          onViewProyecto={(proyectoId) => setView({ type: 'proyecto', proyectoId })}
        />
      )}
      {view.type === 'clientes' && (
        <Clientes
          onBack={() => setView({ type: 'dashboard' })}
          onViewCliente={(clienteId) => setView({ type: 'cliente', clienteId })}
        />
      )}
      {view.type === 'cliente' && (
        <ClienteDetail
          clienteId={view.clienteId}
          onBack={() => setView({ type: 'clientes' })}
          onViewProyecto={(proyectoId) => setView({ type: 'proyecto', proyectoId })}
        />
      )}
      {view.type === 'catalogo' && (
        <Catalogo onBack={() => setView({ type: 'dashboard' })} />
      )}
      {view.type === 'configuracion' && (
        <Configuracion onBack={() => setView({ type: 'dashboard' })} />
      )}
      {view.type === 'reportes' && (
        <Reportes onBack={() => setView({ type: 'dashboard' })} />
      )}
      {view.type === 'notificaciones' && (
        <Notificaciones
          onBack={() => setView({ type: 'dashboard' })}
          onNavigateToExpediente={(expedienteId) => setView({ type: 'expediente', expedienteId })}
          onNavigateToProyecto={(proyectoId) => setView({ type: 'proyecto', proyectoId })}
        />
      )}
      {view.type === 'cotizaciones' && (
        <Cotizaciones
          onBack={() => setView({ type: 'dashboard' })}
          onConvertirProyecto={async (cotizacionId) => {
            const resultado = await CotizacionService.convertirCotizacionAProyecto(cotizacionId);
            if (resultado.success && resultado.proyectoId) {
              alert('Proyecto creado exitosamente');
              setView({ type: 'proyecto', proyectoId: resultado.proyectoId });
            } else {
              alert('Error al convertir cotización: ' + resultado.error);
            }
          }}
        />
      )}
      {view.type === 'configuracion-margenes' && (
        <ConfiguracionMargenes onBack={() => setView({ type: 'configuracion' })} />
      )}
      {view.type === 'catalogo-servicios' && (
        <CatalogoServicios onBack={() => setView({ type: 'configuracion' })} />
      )}
      {view.type === 'gestion-proveedores' && (
        <GestionProveedores onBack={() => setView({ type: 'configuracion' })} />
      )}
      {view.type === 'admin-usuarios' && (
        <GestionUsuarios onBack={() => setView({ type: 'dashboard' })} />
      )}
      {view.type === 'anmat' && (
        <ANMATCasosList />
      )}
    </Layout>
  );
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
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
