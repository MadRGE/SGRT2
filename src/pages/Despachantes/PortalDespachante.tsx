import { useState, useEffect } from 'react';
import { FileText, ChevronRight, AlertTriangle, CheckCircle, Package } from 'lucide-react';

interface Props {
  despachanteId: string;
  onViewExpediente: (expedienteId: string) => void;
}

interface ExpedienteAsignado {
  id: string;
  numero_expediente: string;
  estado: string;
  documentos_pendientes: number;
  proyectos: {
    nombre_proyecto: string;
  };
  tramite_tipos: {
    nombre: string;
  };
  clientes: {
    razon_social: string;
  };
}

export default function PortalDespachante({ despachanteId, onViewExpediente }: Props) {
  const [expedientes, setExpedientes] = useState<ExpedienteAsignado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpedientes();
  }, [despachanteId]);

  const loadExpedientes = () => {
    const mockExpedientes: ExpedienteAsignado[] = [
      {
        id: 'exp-uuid-1',
        numero_expediente: 'SGT-2025-INAL-001',
        estado: 'iniciado',
        documentos_pendientes: 1,
        proyectos: { nombre_proyecto: 'Importación Lata de Atún' },
        tramite_tipos: { nombre: 'Equivalencia Sanitaria' },
        clientes: { razon_social: 'Cliente A S.A.' }
      },
      {
        id: 'exp-uuid-2',
        numero_expediente: 'SGT-2025-SENASA-002',
        estado: 'iniciado',
        documentos_pendientes: 2,
        proyectos: { nombre_proyecto: 'Importación Lata de Atún' },
        tramite_tipos: { nombre: 'Autorización Producto Animal' },
        clientes: { razon_social: 'Cliente A S.A.' }
      },
      {
        id: 'exp-uuid-3',
        numero_expediente: 'SGT-2025-ENACOM-003',
        estado: 'observado',
        documentos_pendientes: 0,
        proyectos: { nombre_proyecto: 'Homologación Router WiFi' },
        tramite_tipos: { nombre: 'Homologación ENACOM' },
        clientes: { razon_social: 'Cliente B S.R.L.' }
      }
    ];
    setExpedientes(mockExpedientes);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Portal de Despachante</h1>
        <p className="text-slate-600 mt-2">
          Bienvenido. Aquí puede gestionar los expedientes que le han sido asignados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Expedientes Asignados</p>
              <p className="text-3xl font-bold text-slate-900">{expedientes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Documentos Pendientes</p>
              <p className="text-3xl font-bold text-slate-900">
                {expedientes.reduce((sum, exp) => sum + exp.documentos_pendientes, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Al Día</p>
              <p className="text-3xl font-bold text-slate-900">
                {expedientes.filter((exp) => exp.documentos_pendientes === 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Mis Expedientes Asignados</h2>

        {expedientes.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 mb-4">No tiene expedientes asignados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expedientes.map((exp) => (
              <div
                key={exp.id}
                onClick={() => onViewExpediente(exp.id)}
                className="bg-slate-50 p-4 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-700">
                          {exp.tramite_tipos.nombre}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {exp.numero_expediente} • {exp.proyectos.nombre_proyecto}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          Cliente: {exp.clientes.razon_social}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {exp.documentos_pendientes > 0 ? (
                      <div className="flex items-center gap-1 font-medium text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">{exp.documentos_pendientes} pendientes</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Al día</span>
                      </div>
                    )}
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                      {exp.estado}
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h4 className="font-semibold text-amber-900 mb-2">Instrucciones para Despachantes</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Revise los expedientes asignados y complete la documentación requerida</li>
          <li>• Suba los documentos en formato PDF cuando estén disponibles</li>
          <li>• Marque los pasos completados en el checklist de cada expediente</li>
          <li>• Notifique al gestor si encuentra alguna observación o inconveniente</li>
        </ul>
      </div>
    </div>
  );
}
