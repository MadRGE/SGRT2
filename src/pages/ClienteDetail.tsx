import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, FileText, Landmark, ShieldCheck, List, FolderOpen, Award, 
  Clock, CheckCircle2, Users, Package, Building2, Truck, AlertTriangle,
  Plus, Edit2, Trash2, Archive, MoreVertical, ExternalLink, Calendar,
  Box, Zap, TestTube, ChevronRight, Eye
} from 'lucide-react';
import { TabDocumentacionGlobal } from '../components/Cliente/TabDocumentacionGlobal';
import { TabUsuarios } from '../components/Cliente/TabUsuarios';
import EnvasesList from '../components/Envases/EnvasesList';
interface Props {
  clienteId: string;
  onBack: () => void;
  onViewProyecto: (proyectoId: string) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
  cuit: string;
  email: string | null;
  telefono: string | null;
  direccion?: string | null;
  localidad?: string | null;
  provincia?: string | null;
}

interface Proyecto {
  id: string;
  nombre_proyecto: string;
  estado: string;
  created_at: string;
  expedientes_count?: number;
  expedientes_activos?: number;
}

interface ProductoRegistrado {
  id: string;
  tipo: 'envase' | 'cosmetico' | 'alimento' | 'pm' | 'certificacion';
  organismo: string;
  numero_registro: string;
  descripcion: string;
  marca?: string;
  estado: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite';
  fecha_otorgamiento?: string;
  fecha_vencimiento?: string;
  expediente_id?: string;
}

interface Habilitacion {
  id: string;
  tipo: string;
  organismo: string;
  numero: string;
  descripcion: string;
  estado: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite';
  fecha_otorgamiento?: string;
  fecha_vencimiento?: string;
}

interface Deposito {
  id: string;
  nombre: string;
  direccion: string;
  localidad: string;
  provincia: string;
  habilitaciones: { organismo: string; numero: string; vence: string }[];
}

interface ResumenCliente {
  productos_vigentes: number;
  productos_por_vencer: number;
  productos_en_tramite: number;
  habilitaciones_vigentes: number;
  habilitaciones_por_vencer: number;
  proyectos_activos: number;
  alertas: number;
}

type TabType = 'resumen' | 'productos' | 'envases' | 'habilitaciones' | 'depositos' | 'proyectos' | 'finalizados' | 'documentacion' | 'facturacion' | 'info';

export default function ClienteDetail({ clienteId, onBack, onViewProyecto }: Props) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenCliente>({
    productos_vigentes: 0,
    productos_por_vencer: 0,
    productos_en_tramite: 0,
    habilitaciones_vigentes: 0,
    habilitaciones_por_vencer: 0,
    proyectos_activos: 0,
    alertas: 0
  });

  useEffect(() => {
    loadCliente();
  }, [clienteId]);

  const loadCliente = async () => {
    setLoading(true);
    const { data } = await supabase.from('clientes').select('*').eq('id', clienteId).single();
    if (data) {
      setCliente(data);
      await loadResumen();
    }
    setLoading(false);
  };

  const loadResumen = async () => {
    // Cargar contadores para el resumen
    const { count: proyectosActivos } = await supabase
      .from('proyectos')
      .select('*', { count: 'exact', head: true })
      .eq('cliente_id', clienteId)
      .not('estado', 'in', '(finalizado,archivado)');

    setResumen({
      productos_vigentes: 6, // TODO: cargar de BD
      productos_por_vencer: 0,
      productos_en_tramite: 4,
      habilitaciones_vigentes: 1,
      habilitaciones_por_vencer: 1,
      proyectos_activos: proyectosActivos || 0,
      alertas: 1
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cliente) {
    return <div className="text-center py-12 text-slate-500">Cliente no encontrado</div>;
  }

  const tabs: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: 'resumen', label: 'Resumen', icon: Eye },
    { id: 'productos', label: 'Productos', icon: Package, badge: resumen.productos_vigentes + resumen.productos_en_tramite },
    { id: 'habilitaciones', label: 'Habilitaciones', icon: ShieldCheck, badge: resumen.habilitaciones_vigentes },
    { id: 'depositos', label: 'Depósitos', icon: Building2 },
    { id: 'proyectos', label: 'Expedientes', icon: List, badge: resumen.proyectos_activos },
    { id: 'finalizados', label: 'Finalizados', icon: CheckCircle2 },
    { id: 'documentacion', label: 'Documentación', icon: FolderOpen },
    { id: 'facturacion', label: 'Facturación', icon: Landmark },
    { id: 'info', label: 'Info', icon: User },
    { id: 'envases', label: 'Envases', icon: Box },
  ];

  return (
    <div className="space-y-6">
      {/* Header del Cliente */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">
                {cliente.razon_social.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{cliente.razon_social}</h2>
              <p className="text-slate-500">CUIT: {cliente.cuit}</p>
              {cliente.direccion && (
                <p className="text-sm text-slate-400 mt-1">
                  {cliente.direccion}, {cliente.localidad}, {cliente.provincia}
                </p>
              )}
            </div>
          </div>
          
          {/* Alertas rápidas */}
          {resumen.alertas > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                {resumen.alertas} alerta(s) pendiente(s)
              </span>
            </div>
          )}
        </div>

        {/* Cards de resumen rápido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-emerald-700">Productos Vigentes</span>
            </div>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{resumen.productos_vigentes}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700">En Trámite</span>
            </div>
            <p className="text-2xl font-bold text-blue-800 mt-1">{resumen.productos_en_tramite}</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-700">Habilitaciones</span>
            </div>
            <p className="text-2xl font-bold text-purple-800 mt-1">{resumen.habilitaciones_vigentes}</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-orange-700">Expedientes Activos</span>
            </div>
            <p className="text-2xl font-bold text-orange-800 mt-1">{resumen.proyectos_activos}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex gap-1 px-4 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-600 hover:text-slate-800 border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'resumen' && <TabResumen clienteId={clienteId} onViewProyecto={onViewProyecto} />}
          {activeTab === 'productos' && <TabProductos clienteId={clienteId} />}
          {activeTab === 'envases' && <EnvasesList empresaId={clienteId} />}
          {activeTab === 'habilitaciones' && <TabHabilitaciones clienteId={clienteId} />}
          {activeTab === 'depositos' && <TabDepositos clienteId={clienteId} />}
          {activeTab === 'proyectos' && <TabProyectosActivos clienteId={clienteId} onViewProyecto={onViewProyecto} />}
          {activeTab === 'finalizados' && <TabProyectosFinalizados clienteId={clienteId} onViewProyecto={onViewProyecto} />}
          {activeTab === 'documentacion' && <TabDocumentacionGlobal clienteId={clienteId} />}
          {activeTab === 'facturacion' && <TabFacturacion clienteId={clienteId} />}
          {activeTab === 'info' && <TabInformacion cliente={cliente} onUpdate={loadCliente} />}
        </div>
      </div>
    </div>
  );
}

// ==================== TAB RESUMEN ====================
function TabResumen({ clienteId, onViewProyecto }: { clienteId: string; onViewProyecto: (id: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Alertas */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5" />
          Alertas y Pendientes
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
            <div className="flex items-center gap-3">
              <span className="text-red-500">🔴</span>
              <div>
                <p className="font-medium text-slate-800">RNEE Envases por iniciar</p>
                <p className="text-sm text-slate-500">Habilitación requerida para importar envases</p>
              </div>
            </div>
            <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              Iniciar trámite
            </button>
          </div>
        </div>
      </div>

      {/* Productos por organismo */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Productos Registrados por Organismo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* ANMAT Envases */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Box className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">ANMAT - Envases</h4>
                <p className="text-xs text-blue-600">Registro de envases alimentarios</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">✅ Terminados</span>
                <span className="font-semibold text-green-700">3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">📋 Por iniciar</span>
                <span className="font-semibold text-amber-700">4</span>
              </div>
            </div>
          </div>

          {/* INTI/SIC Juguetes */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <TestTube className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-900">Seguridad Juguetes</h4>
                <p className="text-xs text-purple-600">Certificación INTI/SIC</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">✅ Certificados</span>
                <span className="font-semibold text-green-700">1</span>
              </div>
            </div>
          </div>

          {/* Seguridad Eléctrica */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">Seguridad Eléctrica</h4>
                <p className="text-xs text-amber-600">Res. 169 / Certificación</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">✅ Certificados</span>
                <span className="font-semibold text-green-700">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expedientes recientes */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <List className="w-5 h-5 text-blue-600" />
          Últimos Expedientes
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <div>
                <p className="font-medium text-slate-800">Registro Envases - Lote 1</p>
                <p className="text-sm text-slate-500">3 productos • Finalizado</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div>
                <p className="font-medium text-slate-800">Certificación Juguetes</p>
                <p className="text-sm text-slate-500">1 producto • Finalizado</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TAB PRODUCTOS ====================
function TabProductos({ clienteId }: { clienteId: string }) {
  const [filtroOrganismo, setFiltroOrganismo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Datos de ejemplo - LOCHEMAR
  const productos: ProductoRegistrado[] = [
    // Envases terminados
    { id: '1', tipo: 'envase', organismo: 'ANMAT', numero_registro: 'ENV-2024-001', descripcion: 'Envase PET 500ml', estado: 'vigente', fecha_vencimiento: '2029-01-15' },
    { id: '2', tipo: 'envase', organismo: 'ANMAT', numero_registro: 'ENV-2024-002', descripcion: 'Envase PEAD 1L', estado: 'vigente', fecha_vencimiento: '2029-01-15' },
    { id: '3', tipo: 'envase', organismo: 'ANMAT', numero_registro: 'ENV-2024-003', descripcion: 'Tapa rosca PP', estado: 'vigente', fecha_vencimiento: '2029-01-15' },
    // Envases por iniciar
    { id: '4', tipo: 'envase', organismo: 'ANMAT', numero_registro: '-', descripcion: 'Envase Riesgo II - Producto A', estado: 'en_tramite' },
    { id: '5', tipo: 'envase', organismo: 'ANMAT', numero_registro: '-', descripcion: 'Envase Riesgo II - Producto B', estado: 'en_tramite' },
    { id: '6', tipo: 'envase', organismo: 'ANMAT', numero_registro: '-', descripcion: 'Envase Riesgo II - Producto C', estado: 'en_tramite' },
    { id: '7', tipo: 'envase', organismo: 'ANMAT', numero_registro: '-', descripcion: 'Envase Riesgo II - Producto D', estado: 'en_tramite' },
    // Certificaciones
    { id: '8', tipo: 'certificacion', organismo: 'INTI/SIC', numero_registro: 'CERT-JUG-2024-001', descripcion: 'Certificación Seguridad Juguetes', estado: 'vigente', fecha_vencimiento: '2026-06-15' },
    { id: '9', tipo: 'certificacion', organismo: 'INTI/SIC', numero_registro: 'CERT-ELEC-2024-001', descripcion: 'Certificación Seguridad Eléctrica - Prod 1', estado: 'vigente', fecha_vencimiento: '2026-06-15' },
    { id: '10', tipo: 'certificacion', organismo: 'INTI/SIC', numero_registro: 'CERT-ELEC-2024-002', descripcion: 'Certificación Seguridad Eléctrica - Prod 2', estado: 'vigente', fecha_vencimiento: '2026-06-15' },
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'vigente': return 'bg-green-100 text-green-800';
      case 'por_vencer': return 'bg-amber-100 text-amber-800';
      case 'vencido': return 'bg-red-100 text-red-800';
      case 'en_tramite': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'vigente': return 'Vigente';
      case 'por_vencer': return 'Por vencer';
      case 'vencido': return 'Vencido';
      case 'en_tramite': return 'En trámite';
      default: return estado;
    }
  };

  const productosFiltrados = productos.filter(p => {
    if (filtroOrganismo !== 'todos' && p.organismo !== filtroOrganismo) return false;
    if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filtros y botón agregar */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3">
          <select 
            value={filtroOrganismo}
            onChange={(e) => setFiltroOrganismo(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los organismos</option>
            <option value="ANMAT">ANMAT</option>
            <option value="INTI/SIC">INTI/SIC</option>
            <option value="INAL">INAL</option>
            <option value="SENASA">SENASA</option>
          </select>
          <select 
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="vigente">Vigente</option>
            <option value="en_tramite">En trámite</option>
            <option value="por_vencer">Por vencer</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Agregar Producto
        </button>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Producto</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Organismo</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Registro</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Vencimiento</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Estado</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((producto) => (
              <tr key={producto.id} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{producto.descripcion}</p>
                  <p className="text-xs text-slate-500 capitalize">{producto.tipo}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{producto.organismo}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-600">{producto.numero_registro}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {producto.fecha_vencimiento 
                    ? new Date(producto.fecha_vencimiento).toLocaleDateString('es-AR')
                    : '-'
                  }
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(producto.estado)}`}>
                    {getEstadoLabel(producto.estado)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="p-1 text-slate-400 hover:text-slate-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== TAB HABILITACIONES ====================
function TabHabilitaciones({ clienteId }: { clienteId: string }) {
  const habilitaciones: Habilitacion[] = [
    { 
      id: '1', 
      tipo: 'RNEE', 
      organismo: 'ANMAT', 
      numero: '-', 
      descripcion: 'Registro Nacional de Establecimiento - Envases',
      estado: 'en_tramite'
    }
  ];

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'vigente': return 'bg-green-100 text-green-800';
      case 'por_vencer': return 'bg-amber-100 text-amber-800';
      case 'vencido': return 'bg-red-100 text-red-800';
      case 'en_tramite': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Habilitaciones y Legajos</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Agregar Habilitación
        </button>
      </div>

      {habilitaciones.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>No hay habilitaciones registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habilitaciones.map((hab) => (
            <div key={hab.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-800">{hab.tipo}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(hab.estado)}`}>
                      {hab.estado === 'en_tramite' ? 'Por iniciar' : hab.estado}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{hab.descripcion}</p>
                  <p className="text-xs text-slate-500 mt-1">Organismo: {hab.organismo}</p>
                </div>
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  Iniciar trámite
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== TAB DEPÓSITOS ====================
function TabDepositos({ clienteId }: { clienteId: string }) {
  const depositos: Deposito[] = [
    {
      id: '1',
      nombre: 'Depósito Mar del Plata',
      direccion: 'Av. San Juan 3545',
      localidad: 'Mar Chiquita',
      provincia: 'Buenos Aires',
      habilitaciones: []
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Depósitos Habilitados</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Agregar Depósito
        </button>
      </div>

      <div className="space-y-3">
        {depositos.map((dep) => (
          <div key={dep.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-slate-800">{dep.nombre}</h4>
                </div>
                <p className="text-sm text-slate-600 mt-1">{dep.direccion}</p>
                <p className="text-xs text-slate-500">{dep.localidad}, {dep.provincia}</p>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== TAB PROYECTOS ACTIVOS ====================
function TabProyectosActivos({ clienteId, onViewProyecto }: { clienteId: string; onViewProyecto: (id: string) => void }) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProyectos();
  }, [clienteId]);

  const loadProyectos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('proyectos')
      .select('*')
      .eq('cliente_id', clienteId)
      .not('estado', 'in', '(finalizado,archivado)')
      .order('created_at', { ascending: false });

    if (data) {
      const proyectosWithCount = await Promise.all(
        data.map(async (proyecto) => {
          const { count: totalCount } = await supabase
            .from('expedientes')
            .select('*', { count: 'exact', head: true })
            .eq('proyecto_id', proyecto.id);

          const { count: activosCount } = await supabase
            .from('expedientes')
            .select('*', { count: 'exact', head: true })
            .eq('proyecto_id', proyecto.id)
            .not('estado', 'eq', 'finalizado');

          return {
            ...proyecto,
            expedientes_count: totalCount || 0,
            expedientes_activos: activosCount || 0
          };
        })
      );
      setProyectos(proyectosWithCount);
    }
    setLoading(false);
  };

  const handleDelete = async (proyectoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
      // Primero eliminar expedientes asociados
      await supabase.from('expedientes').delete().eq('proyecto_id', proyectoId);
      // Luego eliminar el proyecto
      await supabase.from('proyectos').delete().eq('id', proyectoId);
      loadProyectos();
    }
  };

  const handleArchive = async (proyectoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('proyectos').update({ estado: 'archivado' }).eq('id', proyectoId);
    loadProyectos();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (proyectos.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p>No hay expedientes activos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proyectos.map((proyecto) => (
        <div
          key={proyecto.id}
          onClick={() => onViewProyecto(proyecto.id)}
          className="p-4 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-blue-700">{proyecto.nombre_proyecto}</h4>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-slate-600">Total: {proyecto.expedientes_count}</span>
                <span className="text-green-600">Activos: {proyecto.expedientes_activos}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Creado: {new Date(proyecto.created_at).toLocaleDateString('es-AR')}
              </p>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => handleArchive(proyecto.id, e)}
                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                title="Archivar"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => handleDelete(proyecto.id, e)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== TAB PROYECTOS FINALIZADOS ====================
function TabProyectosFinalizados({ clienteId, onViewProyecto }: { clienteId: string; onViewProyecto: (id: string) => void }) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProyectos();
  }, [clienteId]);

  const loadProyectos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('proyectos')
      .select('*')
      .eq('cliente_id', clienteId)
      .in('estado', ['finalizado', 'archivado'])
      .order('created_at', { ascending: false });

    if (data) {
      const proyectosWithCount = await Promise.all(
        data.map(async (proyecto) => {
          const { count } = await supabase
            .from('expedientes')
            .select('*', { count: 'exact', head: true })
            .eq('proyecto_id', proyecto.id);
          return { ...proyecto, expedientes_count: count || 0 };
        })
      );
      setProyectos(proyectosWithCount);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (proyectos.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p>No hay proyectos finalizados</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proyectos.map((proyecto) => (
        <div
          key={proyecto.id}
          onClick={() => onViewProyecto(proyecto.id)}
          className="p-4 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-all opacity-75"
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-slate-700">{proyecto.nombre_proyecto}</h4>
              <p className="text-sm text-slate-600 mt-1">{proyecto.expedientes_count} expediente(s)</p>
              <p className="text-xs text-slate-500 mt-1">
                Creado: {new Date(proyecto.created_at).toLocaleDateString('es-AR')}
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-sm">
              {proyecto.estado}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== TAB FACTURACIÓN ====================
function TabFacturacion({ clienteId }: { clienteId: string }) {
  return (
    <div className="text-center py-12 text-slate-500">
      <Landmark className="w-16 h-16 mx-auto mb-4 opacity-20" />
      <p>Módulo de facturación en desarrollo</p>
    </div>
  );
}

// ==================== TAB INFORMACIÓN ====================
function TabInformacion({ cliente, onUpdate }: { cliente: Cliente; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(cliente);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('clientes').update(formData).eq('id', cliente.id);
    setSaving(false);
    setEditing(false);
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Información General</h3>
        {!editing ? (
          <button 
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social</label>
          {editing ? (
            <input 
              type="text" 
              value={formData.razon_social}
              onChange={(e) => setFormData({...formData, razon_social: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-slate-800">{cliente.razon_social}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">CUIT</label>
          <p className="text-slate-800">{cliente.cuit}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          {editing ? (
            <input 
              type="email" 
              value={formData.email || ''}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-slate-800">{cliente.email || '-'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
          {editing ? (
            <input 
              type="tel" 
              value={formData.telefono || ''}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-slate-800">{cliente.telefono || '-'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
