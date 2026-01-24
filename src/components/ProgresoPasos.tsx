import { CheckCircle, Circle, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  expedienteId: string;
  tramiteTipoId: string;
  pasoActual: number;
  onPasoChange?: () => void;
}

const PASOS_MOCK: { [key: string]: Array<{ orden: number; nombre: string; descripcion: string; rol: string }> } = {
  'TT-INAL-002': [
    { orden: 1, nombre: 'Recepción de Documentación', descripcion: 'Recibir documentos del cliente', rol: 'Gestor' },
    { orden: 2, nombre: 'Análisis de Laboratorio', descripcion: 'Envío a laboratorio autorizado', rol: 'Tercero' },
    { orden: 3, nombre: 'Presentación INAL', descripcion: 'Carga en plataforma SIFeGA', rol: 'Gestor' },
    { orden: 4, nombre: 'Evaluación INAL', descripcion: 'Revisión por autoridad sanitaria', rol: 'INAL' },
    { orden: 5, nombre: 'Emisión RNPA', descripcion: 'Emisión del registro', rol: 'INAL' }
  ],
  'TT-INAL-003': [
    { orden: 1, nombre: 'Recepción CFS', descripcion: 'Recibir Certificado de Libre Venta del país de origen', rol: 'Cliente' },
    { orden: 2, nombre: 'Validación Anexo III', descripcion: 'Verificar que el país está en Anexo III', rol: 'Gestor' },
    { orden: 3, nombre: 'Presentación TAD/VUCE', descripcion: 'Carga de documentos en plataforma', rol: 'Gestor' },
    { orden: 4, nombre: 'Autorización INAL', descripcion: 'Emisión de constancia', rol: 'INAL' }
  ]
};

export function ProgresoPasos({ expedienteId, tramiteTipoId, pasoActual, onPasoChange }: Props) {
  const [loading, setLoading] = useState(false);

  const pasos = PASOS_MOCK[tramiteTipoId] || [
    { orden: 1, nombre: 'Recepción de Documentación', descripcion: 'Recibir documentos del cliente', rol: 'Gestor' },
    { orden: 2, nombre: 'Presentación al Organismo', descripcion: 'Envío de trámite', rol: 'Gestor' },
    { orden: 3, nombre: 'Evaluación', descripcion: 'Revisión por autoridad', rol: 'Organismo' },
    { orden: 4, nombre: 'Aprobación', descripcion: 'Emisión de certificado', rol: 'Organismo' }
  ];

  const handleAvanzarPaso = async () => {
    if (pasoActual >= pasos.length) return;

    console.log('Avanzando paso:', { expedienteId, pasoActual, nuevoPaso: pasoActual + 1 });

    setLoading(true);
    const { data, error } = await supabase
      .from('expedientes')
      .update({ paso_actual: pasoActual + 1 })
      .eq('id', expedienteId)
      .select();

    console.log('Resultado update:', { data, error });

    if (error) {
      console.error('Error al actualizar paso:', error);
      alert(`Error al avanzar paso: ${error.message}`);
    } else {
      console.log('Paso actualizado correctamente');
      if (onPasoChange) {
        onPasoChange();
      }
    }
    setLoading(false);
  };

  const handleRetrocederPaso = async () => {
    if (pasoActual <= 1) return;

    console.log('Retrocediendo paso:', { expedienteId, pasoActual, nuevoPaso: pasoActual - 1 });

    setLoading(true);
    const { data, error } = await supabase
      .from('expedientes')
      .update({ paso_actual: pasoActual - 1 })
      .eq('id', expedienteId)
      .select();

    console.log('Resultado update:', { data, error });

    if (error) {
      console.error('Error al retroceder paso:', error);
      alert(`Error al retroceder paso: ${error.message}`);
    } else {
      console.log('Paso actualizado correctamente');
      if (onPasoChange) {
        onPasoChange();
      }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white border border-gray-200 rounded-lg p-4">
        <button
          onClick={handleRetrocederPaso}
          disabled={pasoActual <= 1 || loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          Paso Anterior
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">Paso actual</p>
          <p className="text-2xl font-bold text-blue-600">{pasoActual} / {pasos.length}</p>
        </div>

        <button
          onClick={handleAvanzarPaso}
          disabled={pasoActual >= pasos.length || loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente Paso
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
      {pasos.map((paso) => {
        const isCompletado = paso.orden < pasoActual;
        const isActual = paso.orden === pasoActual;

        let Icon = Circle;
        let color = 'text-slate-400';
        let bgClass = 'bg-white';

        if (isCompletado) {
          Icon = CheckCircle;
          color = 'text-green-600';
        } else if (isActual) {
          Icon = Loader2;
          color = 'text-blue-600';
          bgClass = 'bg-blue-50 border-blue-200';
        }

        return (
          <div
            key={paso.orden}
            className={`flex space-x-3 p-4 rounded-lg border ${bgClass}`}
          >
            <div className={`flex-shrink-0 ${color}`}>
              <Icon className={`w-6 h-6 ${isActual ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  isCompletado ? 'text-slate-600 line-through' : 'text-slate-900'
                }`}
              >
                Paso {paso.orden}: {paso.nombre}
              </p>
              <p className="text-sm text-slate-600 mt-1">{paso.descripcion}</p>
              <span className="inline-block mt-2 text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-full">
                Responsable: {paso.rol}
              </span>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
