import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { ValidationService, DocumentValidation } from '../../services/ValidationService';

interface TabDocumentValidationProps {
  documentoId: string;
}

export function TabDocumentValidation({ documentoId }: TabDocumentValidationProps) {
  const [validations, setValidations] = useState<DocumentValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedValidationType, setSelectedValidationType] = useState('formato_archivo');

  useEffect(() => {
    loadValidations();
  }, [documentoId]);

  const loadValidations = async () => {
    setLoading(true);
    const { validations: data, error } = await ValidationService.getDocumentValidations(
      documentoId
    );
    if (!error) {
      setValidations(data);
    }
    setLoading(false);
  };

  const handleRunValidation = async () => {
    setLoading(true);
    const { validation, error } = await ValidationService.validateDocument(
      documentoId,
      selectedValidationType
    );
    if (!error && validation) {
      setValidations((prev) => [validation, ...prev]);
    }
    setLoading(false);
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'aprobado':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rechazado':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pendiente':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEstadoBadge = (estado: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (estado) {
      case 'aprobado':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rechazado':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pendiente':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading && validations.length === 0) {
    return <div className="p-4 text-gray-500">Cargando validaciones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Ejecutar Nueva Validación</h3>
        <div className="flex gap-4">
          <select
            value={selectedValidationType}
            onChange={(e) => setSelectedValidationType(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="formato_archivo">Validación de Formato de Archivo</option>
            <option value="nombre_archivo">Validación de Nombre de Archivo</option>
          </select>
          <button
            onClick={handleRunValidation}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Ejecutando...' : 'Ejecutar Validación'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Historial de Validaciones</h3>
        {validations.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            No hay validaciones registradas para este documento
          </div>
        ) : (
          validations.map((validation) => (
            <div
              key={validation.id}
              className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getEstadoIcon(validation.estado)}
                  <div>
                    <h4 className="font-medium">{validation.tipo_validacion}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(validation.created_at).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
                <span className={getEstadoBadge(validation.estado)}>
                  {validation.estado.toUpperCase()}
                </span>
              </div>

              {validation.resultado?.errores && validation.resultado.errores.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-red-800 mb-2">Errores:</h5>
                  <ul className="list-disc list-inside space-y-1">
                    {validation.resultado.errores.map((error: string, idx: number) => (
                      <li key={idx} className="text-sm text-red-700">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.resultado?.advertencias &&
                validation.resultado.advertencias.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-yellow-800 mb-2">Advertencias:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.resultado.advertencias.map((warn: string, idx: number) => (
                        <li key={idx} className="text-sm text-yellow-700">
                          {warn}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {validation.observaciones && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-800 mb-2">Observaciones:</h5>
                  <p className="text-sm text-gray-700">{validation.observaciones}</p>
                </div>
              )}

              {validation.resultado?.detalles && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    Ver detalles técnicos
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 overflow-auto text-xs">
                    {JSON.stringify(validation.resultado.detalles, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
