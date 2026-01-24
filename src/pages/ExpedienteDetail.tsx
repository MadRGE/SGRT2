import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, FileText, Clock, Activity, Shield, Flame, Feather, HeartPulse, List, Truck, Package
} from 'lucide-react';
import { ProgresoPasos } from '../components/ProgresoPasos';
import { ChecklistMaestro } from '../components/ChecklistMaestro';
import { HistorialExpediente } from '../components/HistorialExpediente';
import { ModuloCITES } from '../components/ModuloCITES';
import { ModuloRENPRE } from '../components/ModuloRENPRE';
import { ModuloANMAC } from '../components/ModuloANMAC';
import { ModuloPM } from '../components/ModuloPM';
import { TabLogisticaTerceros } from '../components/Expediente/TabLogisticaTerceros';
import { ExpedienteMultiProducto } from '../components/Expediente/ExpedienteMultiProducto';

interface Props {
  expedienteId: string;
  onBack: () => void;
}

interface Expediente {
  id: string;
  codigo: string;
  estado: string;
  fecha_limite: string;
  fecha_finalizacion: string | null;
  paso_actual: number;
  progreso: number;
  semaforo: string;
  observaciones: string | null;
  tramite_tipos: {
    id: string;
    nombre: string;
    codigo: string;
    logica_especial: string | null;
    base_legal: string[];
    renovacion: string;
    organismos: {
      sigla: string;
      nombre: string;
      plataforma_presentacion: string;
    };
  };
  proyectos: {
    nombre_proyecto: string;
    clientes: {
      razon_social: string;
    };
    productos: {
      nombre: string;
    };
  };
}

export default function ExpedienteDetail({ expedienteId, onBack }: Props) {
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [activeTab, setActiveTab] = useState<string>('productos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [expedienteId]);

  const loadData = async () => {
    setLoading(true);

    const { data: expData } = await supabase
      .from('expedientes')
      .select(`
        *,
        tramite_tipos (
          id,
          nombre,
          codigo,
          logica_especial,
          base_legal,
          renovacion,
          organismos (sigla, nombre, plataforma_presentacion)
        ),
        proyectos (
          nombre_proyecto,
          clientes (razon_social),
          productos (nombre)
        )
      `)
      .eq('id', expedienteId)
      .single();

    if (expData) {
      setExpediente(expData as any);
    }

    setLoading(false);
  };

  const getTabs = () => {
    const tabs = [
      { id: 'productos', label: 'Productos', icon: Package },
      { id: 'progreso', label: 'Progreso', icon: List },
      { id: 'documentos', label: 'Documentos (Checklist)', icon: FileText },
      { id: 'logistica', label: 'Logística/Terceros', icon: Truck },
      { id: 'historial', label: 'Historial', icon: Clock }
    ];

    const logicaEspecial = expediente?.tramite_tipos.logica_especial;

    if (logicaEspecial === 'CITES') {
      tabs.push({ id: 'cites', label: 'Gestión CITES', icon: Feather });
    }
    if (logicaEspecial === 'RENPRE') {
      tabs.push({ id: 'renpre', label: 'Gestión RENPRE', icon: Flame });
    }
    if (logicaEspecial === 'ANMAC') {
      tabs.push({ id: 'anmac', label: 'Gestión ANMaC', icon: Shield });
    }
    if (logicaEspecial === 'PRODUCTO_MEDICO') {
      tabs.push({ id: 'anmat-pm', label: 'Gestión ANMAT-PM', icon: HeartPulse });
    }

    return tabs;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!expediente) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800">Expediente no encontrado</h3>
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

  const tabs = getTabs();

  return (
    <div className="max-w-6xl mx-auto p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver al Proyecto
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-blue-600 font-semibold">{expediente.codigo}</p>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{expediente.tramite_tipos.nombre}</h1>
            <p className="text-slate-600">
              Proyecto: {expediente.proyectos.nombre_proyecto}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Trámite: {expediente.tramite_tipos.codigo}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-4 h-4 rounded-full ${
                  expediente.semaforo === 'verde'
                    ? 'bg-green-500'
                    : expediente.semaforo === 'amarillo'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              ></div>
              <span className="text-sm text-slate-600">{expediente.semaforo.toUpperCase()}</span>
            </div>
            <span className="text-lg font-semibold capitalize text-blue-600">{expediente.estado}</span>
          </div>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          {activeTab === 'productos' && (
            <ExpedienteMultiProducto expedienteId={expediente.id} />
          )}

          {activeTab === 'progreso' && (
            <ProgresoPasos
              expedienteId={expediente.id}
              tramiteTipoId={expediente.tramite_tipos.id}
              pasoActual={expediente.paso_actual}
              onPasoChange={loadData}
            />
          )}

          {activeTab === 'documentos' && (
            <ChecklistMaestro
              expedienteId={expediente.id}
              tramiteTipoId={expediente.tramite_tipos.id}
            />
          )}

          {activeTab === 'logistica' && (
            <TabLogisticaTerceros expedienteId={expediente.id} />
          )}

          {activeTab === 'historial' && (
            <HistorialExpediente expedienteId={expediente.id} />
          )}

          {activeTab === 'cites' && (
            <ModuloCITES expedienteId={expediente.id} />
          )}

          {activeTab === 'renpre' && (
            <ModuloRENPRE expedienteId={expediente.id} />
          )}

          {activeTab === 'anmac' && (
            <ModuloANMAC expedienteId={expediente.id} />
          )}

          {activeTab === 'anmat-pm' && (
            <ModuloPM expedienteId={expediente.id} />
          )}
        </div>
      </div>
    </div>
  );
}
