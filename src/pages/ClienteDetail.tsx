import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, FileText, Landmark, ShieldCheck, List, ArrowLeft, FolderOpen, Award, Clock, CheckCircle2, Users } from 'lucide-react';
import { TabDocumentacionGlobal } from '../components/Cliente/TabDocumentacionGlobal';
import { TabUsuarios } from '../components/Cliente/TabUsuarios';

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
}

interface Proyecto {
  id: string;
  nombre_proyecto: string;
  estado: string;
  created_at: string;
  expedientes_count?: number;
}

interface Habilitacion {
  id: string;
  nombre: string;
  estado: string;
  paso_actual: number;
  progreso: number;
  semaforo: string;
  fecha_finalizacion: string | null;
  tramite_tipo: string;
}

interface Presupuesto {
  id: string;
  proyecto_id: string;
  proyecto_nombre: string;
  total_final: number;
  estado: string;
  fecha_envio: string | null;
}

export default function ClienteDetail({ clienteId, onBack, onViewProyecto }: Props) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [activeTab, setActiveTab] = useState<
    'proyectos' | 'habilitaciones' | 'info' | 'usuarios' | 'facturacion' | 'documentacion' | 'certificados' | 'finalizados'
  >('proyectos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCliente();
  }, [clienteId]);

  const loadCliente = async () => {
    setLoading(true);

    const { data } = await supabase.from('clientes').select('*').eq('id', clienteId).single();

    if (data) setCliente(data);
    setLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Client Info Card */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{cliente.razon_social}</h2>
            <p className="text-slate-500">CUIT: {cliente.cuit}</p>
          </div>
        </div>
        {(cliente.email || cliente.telefono) && (
          <div className="mt-4 flex gap-4 text-sm text-slate-600">
            {cliente.email && <span>Email: {cliente.email}</span>}
            {cliente.telefono && <span>Tel: {cliente.telefono}</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200">
        <div className="border-b border-slate-200 overflow-hidden">
          <div className="flex gap-1 px-4 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
            <button
              onClick={() => setActiveTab('proyectos')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                activeTab === 'proyectos'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
              Proyectos
            </button>
            <button
              onClick={() => setActiveTab('habilitaciones')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                activeTab === 'habilitaciones'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Habilitaciones (Blockers)
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                activeTab === 'info'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              Información General
            </button>
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                activeTab === 'usuarios'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Usuarios
            </button>
            <button
              onClick={() => setActiveTab('facturacion')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                activeTab === 'facturacion'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Landmark className="w-4 h-4" />
              Facturación
            </button>
            <button
              onClick={() => setActiveTab('documentacion')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                activeTab === 'documentacion'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Documentación Global
            </button>
            <button
              onClick={() => setActiveTab('finalizados')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                activeTab === 'finalizados'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Proyectos Finalizados
            </button>
            <button
              onClick={() => setActiveTab('certificados')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 flex-shrink-0 whitespace-nowrap ${
                activeTab === 'certificados'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              Certificados
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'proyectos' && (
            <TabProyectosActivos clienteId={clienteId} onViewProyecto={onViewProyecto} />
          )}
          {activeTab === 'finalizados' && (
            <TabProyectosFinalizados clienteId={clienteId} onViewProyecto={onViewProyecto} />
          )}
          {activeTab === 'habilitaciones' && <TabHabilitaciones clienteId={clienteId} />}
          {activeTab === 'info' && <TabInformacion cliente={cliente} onUpdate={loadCliente} />}
          {activeTab === 'usuarios' && <TabUsuarios clienteId={clienteId} />}
          {activeTab === 'facturacion' && <TabFacturacion clienteId={clienteId} />}
          {activeTab === 'documentacion' && <TabDocumentacionGlobal clienteId={clienteId} />}
          {activeTab === 'certificados' && <TabCertificados clienteId={clienteId} />}
        </div>
      </div>
    </div>
  );
}

function TabProyectosActivos({
  clienteId,
  onViewProyecto
}: {
  clienteId: string;
  onViewProyecto: (proyectoId: string) => void;
}) {
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

      setProyectos(proyectosWithCount as any);
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
        <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p>No hay proyectos activos en este momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proyectos.map((proyecto) => (
        <div
          key={proyecto.id}
          onClick={() => onViewProyecto(proyecto.id)}
          className="bg-slate-50 p-6 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-blue-700 text-lg">{proyecto.nombre_proyecto}</h4>
              <div className="flex gap-4 mt-2">
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Total expedientes:</span> {proyecto.expedientes_count}
                </p>
                <p className="text-sm text-green-600">
                  <span className="font-medium">Activos:</span> {(proyecto as any).expedientes_activos}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Creado: {new Date(proyecto.created_at).toLocaleDateString('es-AR')}
              </p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {proyecto.estado}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabProyectosFinalizados({
  clienteId,
  onViewProyecto
}: {
  clienteId: string;
  onViewProyecto: (proyectoId: string) => void;
}) {
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
    <div className="space-y-4">
      {proyectos.map((proyecto) => (
        <div
          key={proyecto.id}
          onClick={() => onViewProyecto(proyecto.id)}
          className="bg-slate-50 p-6 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-shadow opacity-75"
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-slate-700 text-lg">{proyecto.nombre_proyecto}</h4>
              <p className="text-sm text-slate-600 mt-1">
                {proyecto.expedientes_count} expediente(s)
              </p>
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

function TabHabilitaciones({ clienteId }: { clienteId: string }) {
  const [habilitaciones, setHabilitaciones] = useState<Habilitacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHabilitaciones();
  }, [clienteId]);

  const loadHabilitaciones = async () => {
    setLoading(true);

    const { data: proyectos } = await supabase
      .from('proyectos')
      .select('id')
      .eq('cliente_id', clienteId);

    if (proyectos && proyectos.length > 0) {
      const proyectoIds = proyectos.map((p) => p.id);

      const { data } = await supabase
        .from('expedientes')
        .select(
          `
          id,
          nombre,
          estado,
          paso_actual,
          progreso,
          semaforo,
          fecha_finalizacion,
          tramite_tipos!inner (
            nombre,
            es_habilitacion_previa
          )
        `
        )
        .in('proyecto_id', proyectoIds)
        .eq('tramite_tipos.es_habilitacion_previa', true);

      if (data) {
        const habilitacionesData = data.map((exp: any) => {
          let estadoCalculado = exp.estado;

          if (exp.estado === 'finalizado') {
            estadoCalculado = 'Completado';
          } else if (exp.progreso === 0) {
            estadoCalculado = 'Pendiente';
          } else if (exp.progreso > 0 && exp.progreso < 100) {
            estadoCalculado = 'En Proceso';
          }

          return {
            id: exp.id,
            nombre: exp.nombre,
            estado: estadoCalculado,
            paso_actual: exp.paso_actual,
            progreso: exp.progreso,
            semaforo: exp.semaforo,
            fecha_finalizacion: exp.fecha_finalizacion,
            tramite_tipo: exp.tramite_tipos.nombre
          };
        });

        setHabilitaciones(habilitacionesData);
      }
    }

    setLoading(false);
  };

  const getEstadoColor = (estado: string) => {
    if (estado === 'Completado') return 'bg-green-100 text-green-800';
    if (estado === 'En Proceso') return 'bg-blue-100 text-blue-800';
    if (estado === 'Pendiente') return 'bg-yellow-100 text-yellow-800';
    if (estado === 'rechazado' || estado === 'vencido') return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-800';
  };

  const getSemaforoIcon = (semaforo: string) => {
    if (semaforo === 'verde') return '🟢';
    if (semaforo === 'amarillo') return '🟡';
    if (semaforo === 'rojo') return '🔴';
    return '⚪';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (habilitaciones.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p>No hay habilitaciones previas registradas para este cliente</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-3 text-left text-sm font-medium text-slate-700">
              Habilitación (Trámite)
            </th>
            <th className="p-3 text-left text-sm font-medium text-slate-700">Tipo</th>
            <th className="p-3 text-center text-sm font-medium text-slate-700">Progreso</th>
            <th className="p-3 text-center text-sm font-medium text-slate-700">Semáforo</th>
            <th className="p-3 text-left text-sm font-medium text-slate-700">Estado</th>
            <th className="p-3 text-left text-sm font-medium text-slate-700">
              Fecha Finalización
            </th>
          </tr>
        </thead>
        <tbody>
          {habilitaciones.map((hab) => (
            <tr key={hab.id} className="border-t border-slate-200">
              <td className="p-3 font-medium text-slate-800">{hab.nombre}</td>
              <td className="p-3 text-sm text-slate-600">{hab.tramite_tipo}</td>
              <td className="p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${hab.progreso}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-600 font-medium">{hab.progreso}%</span>
                </div>
              </td>
              <td className="p-3 text-center text-xl">
                {getSemaforoIcon(hab.semaforo)}
              </td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                    hab.estado
                  )}`}
                >
                  {hab.estado}
                </span>
              </td>
              <td className="p-3 text-sm text-slate-600">
                {hab.fecha_finalizacion
                  ? new Date(hab.fecha_finalizacion).toLocaleDateString('es-AR')
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabInformacion({ cliente, onUpdate }: { cliente: Cliente; onUpdate: () => void }) {
  const [formData, setFormData] = useState({
    razon_social: cliente.razon_social,
    cuit: cliente.cuit,
    email: cliente.email || '',
    telefono: cliente.telefono || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await supabase
      .from('clientes')
      .update({
        razon_social: formData.razon_social,
        cuit: formData.cuit,
        email: formData.email || null,
        telefono: formData.telefono || null
      })
      .eq('id', cliente.id);

    setSaving(false);
    onUpdate();
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Información General</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Razón Social</label>
            <input
              type="text"
              required
              value={formData.razon_social}
              onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">CUIT</label>
            <input
              type="text"
              required
              value={formData.cuit}
              onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Contacto</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono</label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-md"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

function TabFacturacion({ clienteId }: { clienteId: string }) {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPresupuestos();
  }, [clienteId]);

  const loadPresupuestos = async () => {
    setLoading(true);

    const { data: proyectos } = await supabase
      .from('proyectos')
      .select('id')
      .eq('cliente_id', clienteId);

    if (proyectos && proyectos.length > 0) {
      const proyectoIds = proyectos.map((p) => p.id);

      const { data } = await supabase
        .from('presupuestos')
        .select(
          `
          *,
          proyectos (nombre_proyecto)
        `
        )
        .in('proyecto_id', proyectoIds)
        .order('created_at', { ascending: false });

      if (data) {
        const presupuestosData = data.map((p: any) => ({
          id: p.id,
          proyecto_id: p.proyecto_id,
          proyecto_nombre: p.proyectos.nombre_proyecto,
          total_final: p.total_final,
          estado: p.estado,
          fecha_envio: p.fecha_envio
        }));

        setPresupuestos(presupuestosData);
      }
    }

    setLoading(false);
  };

  const getEstadoColor = (estado: string) => {
    if (estado === 'aprobado') return 'bg-green-100 text-green-800';
    if (estado === 'rechazado') return 'bg-red-100 text-red-800';
    if (estado === 'enviado') return 'bg-blue-100 text-blue-800';
    return 'bg-slate-100 text-slate-800';
  };

  const totalFacturado = presupuestos
    .filter((p) => p.estado === 'aprobado')
    .reduce((sum, p) => sum + p.total_final, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 font-medium">Total Facturado</p>
          <p className="text-3xl font-bold text-green-800 mt-2">
            ${totalFacturado.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Presupuestos Totales</p>
          <p className="text-3xl font-bold text-blue-800 mt-2">{presupuestos.length}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-700 font-medium">Pendientes de Aprobación</p>
          <p className="text-3xl font-bold text-yellow-800 mt-2">
            {presupuestos.filter((p) => p.estado === 'enviado').length}
          </p>
        </div>
      </div>

      {presupuestos.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Landmark className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>No hay presupuestos registrados para este cliente</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Proyecto</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Estado</th>
                <th className="p-3 text-right text-sm font-medium text-slate-700">Monto</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Fecha Envío</th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.map((presupuesto) => (
                <tr key={presupuesto.id} className="border-t border-slate-200">
                  <td className="p-3 font-medium text-slate-800">{presupuesto.proyecto_nombre}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                        presupuesto.estado
                      )}`}
                    >
                      {presupuesto.estado}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-slate-800">
                    ${presupuesto.total_final.toLocaleString('es-AR')}
                  </td>
                  <td className="p-3 text-sm text-slate-600">
                    {presupuesto.fecha_envio
                      ? new Date(presupuesto.fecha_envio).toLocaleDateString('es-AR')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface Certificado {
  id: string;
  codigo_certificado: string;
  numero_registro: string | null;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  estado: string;
  tramite_tipo: string;
  expediente_nombre: string;
  url_documento: string | null;
}

function TabCertificados({ clienteId }: { clienteId: string }) {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificados();
  }, [clienteId]);

  const loadCertificados = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('certificados_finalizados')
      .select(`
        id,
        codigo_certificado,
        numero_registro,
        fecha_emision,
        fecha_vencimiento,
        estado,
        url_documento,
        tramite_tipos (nombre),
        expedientes (nombre)
      `)
      .eq('cliente_id', clienteId)
      .order('fecha_emision', { ascending: false });

    if (data) {
      const certificadosData = data.map((cert: any) => ({
        id: cert.id,
        codigo_certificado: cert.codigo_certificado,
        numero_registro: cert.numero_registro,
        fecha_emision: cert.fecha_emision,
        fecha_vencimiento: cert.fecha_vencimiento,
        estado: cert.estado,
        tramite_tipo: cert.tramite_tipos?.nombre || 'N/A',
        expediente_nombre: cert.expedientes?.nombre || 'N/A',
        url_documento: cert.url_documento
      }));

      setCertificados(certificadosData);
    }

    setLoading(false);
  };

  const getEstadoColor = (estado: string) => {
    if (estado === 'activo') return 'bg-green-100 text-green-800';
    if (estado === 'vencido') return 'bg-red-100 text-red-800';
    if (estado === 'cancelado') return 'bg-slate-100 text-slate-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const isProximoVencer = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) return false;
    const dias = Math.floor(
      (new Date(fechaVencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return dias > 0 && dias <= 30;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const certificadosActivos = certificados.filter((c) => c.estado === 'activo');
  const certificadosProximosVencer = certificados.filter((c) =>
    isProximoVencer(c.fecha_vencimiento)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 font-medium">Certificados Activos</p>
          <p className="text-3xl font-bold text-green-800 mt-2">{certificadosActivos.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Total Certificados</p>
          <p className="text-3xl font-bold text-blue-800 mt-2">{certificados.length}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-700 font-medium">Próximos a Vencer</p>
          <p className="text-3xl font-bold text-orange-800 mt-2">
            {certificadosProximosVencer.length}
          </p>
        </div>
      </div>

      {certificados.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>No hay certificados registrados para este cliente</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Código</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Trámite</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Expediente</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">
                  Número Registro
                </th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">
                  Fecha Emisión
                </th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">
                  Vencimiento
                </th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Estado</th>
              </tr>
            </thead>
            <tbody>
              {certificados.map((cert) => (
                <tr
                  key={cert.id}
                  className={`border-t border-slate-200 ${
                    isProximoVencer(cert.fecha_vencimiento) ? 'bg-orange-50' : ''
                  }`}
                >
                  <td className="p-3 font-mono text-sm text-blue-700">{cert.codigo_certificado}</td>
                  <td className="p-3 text-sm text-slate-600">{cert.tramite_tipo}</td>
                  <td className="p-3 text-sm text-slate-600">{cert.expediente_nombre}</td>
                  <td className="p-3 text-sm text-slate-600">{cert.numero_registro || '-'}</td>
                  <td className="p-3 text-sm text-slate-600">
                    {new Date(cert.fecha_emision).toLocaleDateString('es-AR')}
                  </td>
                  <td className="p-3 text-sm text-slate-600">
                    {cert.fecha_vencimiento ? (
                      <div className="flex items-center gap-1">
                        {isProximoVencer(cert.fecha_vencimiento) && (
                          <span className="text-orange-600" title="Próximo a vencer">
                            ⚠️
                          </span>
                        )}
                        {new Date(cert.fecha_vencimiento).toLocaleDateString('es-AR')}
                      </div>
                    ) : (
                      'Sin vencimiento'
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(
                        cert.estado
                      )}`}
                    >
                      {cert.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
