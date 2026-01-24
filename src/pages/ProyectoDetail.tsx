import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, FileText, DollarSign, Clock, User, Package, Globe, ChevronRight, Plus, MoreVertical, Archive, Trash2, GitBranch } from 'lucide-react';
import ExpedienteCreationModal from '../components/Expediente/ExpedienteCreationModal';
import ArchivarProyectoModal from '../components/Proyecto/ArchivarProyectoModal';
import EliminarProyectoModal from '../components/Proyecto/EliminarProyectoModal';
import SepararExpedientesModal from '../components/Proyecto/SepararExpedientesModal';
import { PresupuestoStatusWidget } from '../components/Presupuesto/PresupuestoStatusWidget';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  proyectoId: string;
  onBack: () => void;
  onExpedienteClick: (expedienteId: string) => void;
}

interface Proyecto {
  id: string;
  nombre_proyecto: string;
  estado: string;
  prioridad: string;
  fecha_inicio: string;
  clientes: {
    razon_social: string;
    cuit: string;
  };
  productos: {
    nombre: string;
    marca: string;
    pais_origen: string;
  };
}

interface Expediente {
  id: string;
  codigo: string;
  estado: string;
  fecha_limite: string;
  progreso: number;
  semaforo: string;
  tramite_tipos: {
    nombre: string;
    codigo: string;
    organismos: {
      sigla: string;
    };
  };
}

export default function ProyectoDetail({ proyectoId, onBack, onExpedienteClick }: Props) {
  const { user } = useAuth();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [activeTab, setActiveTab] = useState<'expedientes' | 'presupuesto' | 'historial'>('expedientes');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showArchivarModal, setShowArchivarModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [showSepararModal, setShowSepararModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [proyectoId]);

  const loadData = async () => {
    setLoading(true);

    const { data: proyectoData } = await supabase
      .from('proyectos')
      .select(`
        *,
        clientes (razon_social, cuit),
        productos (nombre, marca, pais_origen)
      `)
      .eq('id', proyectoId)
      .single();

    if (proyectoData) setProyecto(proyectoData as any);

    const { data: expedientesData } = await supabase
      .from('expedientes')
      .select(`
        *,
        tramite_tipos (
          nombre,
          codigo,
          organismos (sigla)
        )
      `)
      .eq('proyecto_id', proyectoId)
      .order('created_at', { ascending: false });

    if (expedientesData) setExpedientes(expedientesData as any);

    setLoading(false);
  };

  const handleArchivarProyecto = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('proyectos')
        .update({ archivado: true })
        .eq('id', proyectoId);

      if (error) throw error;

      await supabase.from('historial').insert({
        proyecto_id: proyectoId,
        accion: 'Proyecto archivado',
        descripcion: `El proyecto "${proyecto?.nombre_proyecto}" fue archivado`,
        usuario_id: user?.id
      });

      setShowArchivarModal(false);
      onBack();
    } catch (error) {
      console.error('Error archivando proyecto:', error);
      alert('Error al archivar el proyecto');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEliminarProyecto = async () => {
    setActionLoading(true);
    try {
      await supabase.from('historial').insert({
        proyecto_id: proyectoId,
        accion: 'Proyecto eliminado',
        descripcion: `El proyecto "${proyecto?.nombre_proyecto}" fue eliminado permanentemente`,
        usuario_id: user?.id
      });

      const { error } = await supabase
        .from('proyectos')
        .delete()
        .eq('id', proyectoId);

      if (error) throw error;

      setShowEliminarModal(false);
      onBack();
    } catch (error) {
      console.error('Error eliminando proyecto:', error);
      alert('Error al eliminar el proyecto');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSepararExpedientes = async (selectedIds: string[], nuevoNombre: string) => {
    setActionLoading(true);
    try {
      if (!proyecto) return;

      const { data: nuevoProyecto, error: proyectoError } = await supabase
        .from('proyectos')
        .insert({
          nombre_proyecto: nuevoNombre,
          cliente_id: proyecto.clientes_id || (proyecto as any).cliente_id,
          estado: proyecto.estado,
          prioridad: proyecto.prioridad,
          observaciones: `Separado del proyecto: ${proyecto.nombre_proyecto}`
        })
        .select()
        .single();

      if (proyectoError) throw proyectoError;

      const { error: updateError } = await supabase
        .from('expedientes')
        .update({ proyecto_id: nuevoProyecto.id })
        .in('id', selectedIds);

      if (updateError) throw updateError;

      await supabase.from('historial').insert([
        {
          proyecto_id: proyectoId,
          accion: 'Expedientes separados',
          descripcion: `${selectedIds.length} expediente(s) movidos al proyecto "${nuevoNombre}"`,
          usuario_id: user?.id
        },
        {
          proyecto_id: nuevoProyecto.id,
          accion: 'Proyecto creado por separación',
          descripcion: `Proyecto creado con ${selectedIds.length} expediente(s) desde "${proyecto.nombre_proyecto}"`,
          usuario_id: user?.id
        }
      ]);

      setShowSepararModal(false);
      await loadData();
    } catch (error) {
      console.error('Error separando expedientes:', error);
      alert('Error al separar los expedientes');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!proyecto) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800">Proyecto no encontrado</h3>
        </div>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-slate-800">{proyecto.nombre_proyecto}</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar Trámite
            </button>
            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-300"
              >
                <MoreVertical className="w-5 h-5 text-slate-600" />
              </button>
              {showActionsMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-10">
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      setShowArchivarModal(true);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                  >
                    <Archive className="w-4 h-4 text-blue-600" />
                    Archivar Proyecto
                  </button>
                  {expedientes.length >= 2 && (
                    <button
                      onClick={() => {
                        setShowActionsMenu(false);
                        setShowSepararModal(true);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                    >
                      <GitBranch className="w-4 h-4 text-green-600" />
                      Separar Expedientes
                    </button>
                  )}
                  {user?.rol === 'admin' && (
                    <>
                      <div className="border-t border-slate-200 my-2"></div>
                      <button
                        onClick={() => {
                          setShowActionsMenu(false);
                          setShowEliminarModal(true);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar Proyecto
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-600">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            <span>{proyecto.clientes.razon_social} (CUIT: {proyecto.clientes.cuit})</span>
          </div>
          <div className="flex items-center">
            <Package className="w-4 h-4 mr-2" />
            <span>{proyecto.productos.nombre}</span>
          </div>
          <div className="flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            <span>Origen: {proyecto.productos.pais_origen}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <PresupuestoStatusWidget
          proyectoId={proyectoId}
          onDireccionarClick={() => {
            setActiveTab('presupuesto');
          }}
          onVerDetallesClick={() => setActiveTab('presupuesto')}
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="border-b border-slate-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('expedientes')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'expedientes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Expedientes ({expedientes.length})
            </button>
            <button
              onClick={() => setActiveTab('presupuesto')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'presupuesto'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Presupuesto y Pagos
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'historial'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              Historial del Proyecto
            </button>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === 'expedientes' && (
            <div className="space-y-4">
              {expedientes.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>No hay expedientes en este proyecto</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Crear primer trámite
                  </button>
                </div>
              ) : (
                expedientes.map((exp) => (
                  <ExpedienteResumenCard
                    key={exp.id}
                    expediente={exp}
                    onClick={() => onExpedienteClick(exp.id)}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'presupuesto' && (
            <PresupuestoIntegrado proyectoId={proyectoId} />
          )}

          {activeTab === 'historial' && (
            <HistorialEventos proyectoId={proyectoId} />
          )}
        </div>
      </div>

      {showCreateModal && (
        <ExpedienteCreationModal
          proyectoId={proyectoId}
          proyectoNombre={proyecto.nombre_proyecto}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(expedienteId) => {
            setShowCreateModal(false);
            loadData();
            onExpedienteClick(expedienteId);
          }}
        />
      )}

      {showArchivarModal && (
        <ArchivarProyectoModal
          proyectoNombre={proyecto.nombre_proyecto}
          onConfirm={handleArchivarProyecto}
          onClose={() => setShowArchivarModal(false)}
          loading={actionLoading}
        />
      )}

      {showEliminarModal && (
        <EliminarProyectoModal
          proyectoNombre={proyecto.nombre_proyecto}
          expedientesCount={expedientes.length}
          onConfirm={handleEliminarProyecto}
          onClose={() => setShowEliminarModal(false)}
          loading={actionLoading}
        />
      )}

      {showSepararModal && (
        <SepararExpedientesModal
          proyectoNombre={proyecto.nombre_proyecto}
          expedientes={expedientes}
          onConfirm={handleSepararExpedientes}
          onClose={() => setShowSepararModal(false)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

interface ExpedienteResumenCardProps {
  expediente: Expediente;
  onClick: () => void;
}

function ExpedienteResumenCard({ expediente, onClick }: ExpedienteResumenCardProps) {
  const getSemaforoColor = (semaforo: string) => {
    if (semaforo === 'rojo') return 'border-l-red-500';
    if (semaforo === 'amarillo') return 'border-l-yellow-500';
    return 'border-l-green-500';
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white p-4 rounded-lg border-l-4 ${getSemaforoColor(
        expediente.semaforo
      )} cursor-pointer hover:shadow-md transition-shadow border border-slate-200`}
    >
      <div className="flex flex-col md:flex-row justify-between">
        <div className="mb-2 md:mb-0 flex-1">
          <h4 className="font-semibold text-blue-700">{expediente.tramite_tipos.nombre}</h4>
          <p className="text-sm text-slate-600">{expediente.codigo}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-center">
            <span className="text-slate-500 block">Organismo</span>
            <span className="font-medium text-slate-800">{expediente.tramite_tipos.organismos.sigla}</span>
          </div>
          <div className="text-sm text-center">
            <span className="text-slate-500 block">Estado</span>
            <span className="font-medium text-blue-600 capitalize">{expediente.estado}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </div>
    </div>
  );
}

interface PresupuestoIntegradoProps {
  proyectoId: string;
}

function PresupuestoIntegrado({ proyectoId }: PresupuestoIntegradoProps) {
  const [presupuesto, setPresupuesto] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadPresupuesto();
  }, [proyectoId]);

  const loadPresupuesto = async () => {
    setLoading(true);

    const { data: presupuestoData } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .maybeSingle();

    if (presupuestoData) {
      setPresupuesto(presupuestoData);

      const { data: itemsData } = await supabase
        .from('presupuesto_items')
        .select('*')
        .eq('presupuesto_id', presupuestoData.id)
        .order('id');

      if (itemsData) setItems(itemsData);
    }

    setLoading(false);
  };

  const handleAddItem = async () => {
    if (!presupuesto) return;

    const newItem = {
      presupuesto_id: presupuesto.id,
      concepto: 'Nuevo Ítem',
      tipo: 'honorario',
      monto: 0
    };

    const { data } = await supabase
      .from('presupuesto_items')
      .insert(newItem)
      .select()
      .single();

    if (data) {
      setItems([...items, data]);
    }
  };

  const handleUpdateItem = async (id: number, field: string, value: any) => {
    const { error } = await supabase
      .from('presupuesto_items')
      .update({ [field]: value })
      .eq('id', id);

    if (!error) {
      setItems(items.map(i => (i.id === id ? { ...i, [field]: value } : i)));
      recalcularTotal();
    }
  };

  const handleDeleteItem = async (id: number) => {
    const { error } = await supabase
      .from('presupuesto_items')
      .delete()
      .eq('id', id);

    if (!error) {
      setItems(items.filter(i => i.id !== id));
      recalcularTotal();
    }
  };

  const recalcularTotal = async () => {
    const total = items.reduce((sum, i) => sum + (parseFloat(i.monto) || 0), 0);
    await supabase
      .from('presupuestos')
      .update({ total_final: total })
      .eq('id', presupuesto.id);
    setPresupuesto({ ...presupuesto, total_final: total });
  };

  const handleSetEstado = async (nuevoEstado: string) => {
    const { error } = await supabase
      .from('presupuestos')
      .update({ estado: nuevoEstado })
      .eq('id', presupuesto.id);

    if (!error) {
      setPresupuesto({ ...presupuesto, estado: nuevoEstado });
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!presupuesto) {
    return (
      <div className="text-center py-12 text-slate-500">
        <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p>No se encontró presupuesto para este proyecto</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700 font-medium">TOTAL PROYECTO</p>
        <p className="text-3xl font-bold text-blue-900">
          ${(presupuesto.total_final || 0).toLocaleString('es-AR')}
        </p>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-2 items-center">
              <input
                type="text"
                value={item.concepto}
                onChange={(e) => handleUpdateItem(item.id, 'concepto', e.target.value)}
                className="flex-1 p-2 border border-slate-300 rounded-md"
              />
              <select
                value={item.tipo}
                onChange={(e) => handleUpdateItem(item.id, 'tipo', e.target.value)}
                className="p-2 border border-slate-300 rounded-md bg-white"
              >
                <option value="honorario">Honorario</option>
                <option value="tasa_organismo">Tasa Organismo</option>
                <option value="tercero_laboratorio">Tercero/Laboratorio</option>
              </select>
              <input
                type="number"
                value={item.monto}
                onChange={(e) => handleUpdateItem(item.id, 'monto', parseFloat(e.target.value))}
                className="w-32 p-2 border border-slate-300 rounded-md"
              />
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={handleAddItem}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Añadir Ítem
          </button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Concepto</th>
                <th className="p-3 text-left text-sm font-medium text-slate-700">Tipo</th>
                <th className="p-3 text-right text-sm font-medium text-slate-700">Monto</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="p-3 text-slate-800">{item.concepto}</td>
                  <td className="p-3 text-slate-600 capitalize">
                    {item.tipo.replace('_', ' ')}
                  </td>
                  <td className="p-3 text-right text-slate-800">
                    ${parseFloat(item.monto).toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold">
          Estado:{' '}
          <span className="text-blue-600 capitalize">
            {presupuesto.estado.replace('_', ' ')}
          </span>
        </div>
        <div className="flex gap-3">
          {presupuesto.estado === 'borrador' && (
            <>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
              >
                {isEditing ? 'Ver' : 'Editar'}
              </button>
              <button
                onClick={() => handleSetEstado('enviado')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Enviar al Cliente
              </button>
            </>
          )}
          {presupuesto.estado === 'enviado' && (
            <button
              onClick={() => handleSetEstado('aprobado')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Aprobar Presupuesto
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface HistorialEventosProps {
  proyectoId: string;
}

function HistorialEventos({ proyectoId }: HistorialEventosProps) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistorial();
  }, [proyectoId]);

  const loadHistorial = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('historial')
      .select(`
        *,
        usuarios (nombre)
      `)
      .eq('proyecto_id', proyectoId)
      .order('fecha', { ascending: false });

    if (data) setHistorial(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p>No hay eventos registrados para este proyecto</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {historial.map((item) => (
        <div key={item.id} className="flex space-x-3 p-4 bg-slate-50 rounded-lg">
          <div className="flex-shrink-0">
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">{item.accion}</p>
            {item.descripcion && (
              <p className="text-sm text-slate-700 mt-1">{item.descripcion}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {new Date(item.fecha).toLocaleString('es-AR')}
              {item.usuarios && ` por ${item.usuarios.nombre}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
