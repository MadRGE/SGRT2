import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { List, DollarSign, Package, Globe, ArrowLeft, FileText } from 'lucide-react';
import { ChecklistMaestro } from '../../components/ChecklistMaestro';
import { PresupuestoIntegrado } from '../../components/PresupuestoIntegrado';

interface Props {
  proyectoId: string;
  clienteId: string;
  onBack: () => void;
}

interface Proyecto {
  id: string;
  nombre_proyecto: string;
  estado: string;
  producto_nombre: string | null;
  pais_origen: string | null;
}

interface Expediente {
  id: string;
  numero_expediente: string;
  estado: string;
  tramite_tipo_id: string;
  tramite_tipos: {
    nombre: string;
    organismo: string;
  };
}

export default function PortalProyectoDetail({ proyectoId, clienteId, onBack }: Props) {
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [activeTab, setActiveTab] = useState<'expedientes' | 'presupuesto'>('expedientes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProyecto();
  }, [proyectoId]);

  const loadProyecto = async () => {
    setLoading(true);

    const { data: proyectoData } = await supabase
      .from('proyectos')
      .select(
        `
        id,
        nombre_proyecto,
        estado,
        producto_id,
        productos (nombre, pais_origen)
      `
      )
      .eq('id', proyectoId)
      .eq('cliente_id', clienteId)
      .maybeSingle();

    if (proyectoData) {
      const proyecto: Proyecto = {
        id: proyectoData.id,
        nombre_proyecto: proyectoData.nombre_proyecto,
        estado: proyectoData.estado,
        producto_nombre: (proyectoData.productos as any)?.nombre || null,
        pais_origen: (proyectoData.productos as any)?.pais_origen || null
      };
      setProyecto(proyecto);

      const { data: expedientesData } = await supabase
        .from('expedientes')
        .select(
          `
          id,
          codigo,
          estado,
          tramite_tipo_id,
          tramite_tipos (nombre, organismos(sigla))
        `
        )
        .eq('proyecto_id', proyectoId)
        .order('created_at');

      if (expedientesData) {
        const formattedExpedientes = expedientesData.map((exp: any) => ({
          id: exp.id,
          numero_expediente: exp.codigo,
          estado: exp.estado,
          tramite_tipo_id: exp.tramite_tipo_id,
          tramite_tipos: {
            nombre: exp.tramite_tipos?.nombre || 'Sin nombre',
            organismo: exp.tramite_tipos?.organismos?.sigla || 'N/A'
          }
        }));
        setExpedientes(formattedExpedientes);
      }
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

  if (!proyecto) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Proyecto no encontrado o no tiene acceso.</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver a Mis Proyectos
      </button>

      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <h1 className="text-3xl font-bold text-slate-800">{proyecto.nombre_proyecto}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-slate-600">
          {proyecto.producto_nombre && (
            <div className="flex items-center">
              <Package className="w-4 h-4 mr-2" />
              <span>{proyecto.producto_nombre}</span>
            </div>
          )}
          {proyecto.pais_origen && (
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              <span>Origen: {proyecto.pais_origen}</span>
            </div>
          )}
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            <span className="font-medium text-blue-600 capitalize">{proyecto.estado}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex gap-1 px-4">
            <button
              onClick={() => setActiveTab('expedientes')}
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'expedientes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
              Expedientes y Documentos
            </button>
            <button
              onClick={() => setActiveTab('presupuesto')}
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'presupuesto'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Presupuesto
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'expedientes' && (
            <div className="space-y-6">
              {expedientes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600">No hay expedientes registrados</p>
                </div>
              ) : (
                expedientes.map((exp) => (
                  <div
                    key={exp.id}
                    className="bg-slate-50 rounded-lg border border-slate-200 p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-800">
                          {exp.tramite_tipos.nombre}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {exp.tramite_tipos.organismo} • Expediente: {exp.numero_expediente}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                        {exp.estado}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-300">
                      <h4 className="font-semibold text-slate-700 mb-3">
                        Documentación Requerida
                      </h4>
                      <ChecklistMaestro
                        expedienteId={exp.id}
                        tramiteTipoId={exp.tramite_tipo_id}
                        esCliente={true}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'presupuesto' && (
            <PresupuestoIntegrado proyectoId={proyectoId} esCliente={true} />
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">¿Necesita ayuda?</h4>
        <p className="text-sm text-blue-800">
          Si tiene dudas sobre la documentación requerida o el estado de su proyecto, no dude en
          contactar a su gestor asignado.
        </p>
      </div>
    </div>
  );
}
