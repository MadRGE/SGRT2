import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, CheckSquare, List, ArrowLeft, Package, Building2 } from 'lucide-react';

interface Props {
  expedienteId: string;
  despachanteId: string;
  onBack: () => void;
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
  proyectos: {
    nombre_proyecto: string;
    clientes: {
      razon_social: string;
    };
  };
}

export default function DespachanteExpedienteDetail({
  expedienteId,
  despachanteId,
  onBack
}: Props) {
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpediente();
  }, [expedienteId]);

  const loadExpediente = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('expedientes')
      .select(
        `
        id,
        numero_expediente,
        estado,
        tramite_tipo_id,
        tramite_tipos (nombre, organismo),
        proyectos (
          nombre_proyecto,
          clientes (razon_social)
        )
      `
      )
      .eq('id', expedienteId)
      .single();

    if (data) {
      setExpediente(data as any);
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

  if (!expediente) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Expediente no encontrado o no tiene acceso.</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver a Mis Expedientes
      </button>

      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{expediente.tramite_tipos.nombre}</h1>
            <p className="text-lg text-slate-500 mt-1">{expediente.numero_expediente}</p>
          </div>
          <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
            {expediente.estado}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Proyecto</p>
              <p className="text-sm text-slate-800">{expediente.proyectos.nombre_proyecto}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Cliente</p>
              <p className="text-sm text-slate-800">
                {expediente.proyectos.clientes.razon_social}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Organismo</p>
              <p className="text-sm text-slate-800">{expediente.tramite_tipos.organismo}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-blue-600" />
          Documentación Requerida (Checklist)
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Por favor, suba los documentos que le han sido asignados.
        </p>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <p className="text-sm text-blue-800 mb-3">
            <strong>Nota técnica:</strong> En la versión completa, aquí se renderizará el
            componente ChecklistMaestro con prop{' '}
            <code className="bg-blue-100 px-2 py-1 rounded">rol="despachante"</code>
          </p>
          <p className="text-sm text-blue-800">
            El checklist filtrará y mostrará SOLO los ítems donde{' '}
            <code className="bg-blue-100 px-2 py-1 rounded">
              responsable == 'despachante'
            </code>
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-800">Certificado de Origen</p>
                  <p className="text-xs text-slate-500">Responsable: Despachante</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                Subir Documento
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-slate-800">DUA (Documento Único Aduanero)</p>
                  <p className="text-xs text-slate-500">Responsable: Despachante</p>
                  <p className="text-xs text-green-600 mt-1">✓ Documento subido y aprobado</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Aprobado
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <List className="w-5 h-5 text-slate-700" />
          Pasos Asignados
        </h3>
        <p className="text-slate-600 mb-4">
          Aquí verá los pasos del proceso que debe completar (Ej: "Presentación en Aduana").
        </p>

        <div className="space-y-3">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">1. Presentación en Aduana</p>
                <p className="text-xs text-slate-500 mt-1">Gestión del despacho aduanero</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                En Proceso
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">2. Retiro de Mercadería</p>
                <p className="text-xs text-slate-500 mt-1">Coordinación con terminal portuaria</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                Pendiente
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h4 className="font-semibold text-amber-900 mb-2">Recordatorio</h4>
        <p className="text-sm text-amber-800">
          Recuerde notificar al gestor asignado cuando complete la carga de documentos o si
          encuentra alguna observación durante el proceso.
        </p>
      </div>
    </div>
  );
}
