import { useState } from 'react';
import { Shield, FileText, Wrench, ClipboardList, Factory } from 'lucide-react';
import { ANMATCasosList } from '../components/ANMAT/ANMATCasosList';

type Tab = 'casos' | 'herramientas';

export default function ANMATPage() {
  const [tab, setTab] = useState<Tab>('casos');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestoría ANMAT</h1>
          <p className="text-sm text-slate-500">Gestión regulatoria y herramientas documentales</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <button
            onClick={() => setTab('casos')}
            className={`pb-3 px-1 font-medium text-sm transition-colors flex items-center gap-2 ${
              tab === 'casos'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Casos ANMAT
          </button>
          <button
            onClick={() => setTab('herramientas')}
            className={`pb-3 px-1 font-medium text-sm transition-colors flex items-center gap-2 ${
              tab === 'herramientas'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Herramientas
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'casos' && <ANMATCasosList />}
      {tab === 'herramientas' && <HerramientasANMAT />}
    </div>
  );
}

function HerramientasANMAT() {
  const herramientas = [
    {
      id: 'ficha-producto',
      titulo: 'Ficha de Producto',
      descripcion: 'Genera fichas técnicas de producto con toda la información requerida por ANMAT: composición, materiales, fabricante, normativas aplicables y datos de aptitud sanitaria.',
      icon: ClipboardList,
      color: 'from-blue-500 to-cyan-600',
      bgLight: 'bg-blue-50 border-blue-200',
      campos: ['Descripción del producto', 'Composición / materiales', 'País de origen / fabricante', 'Normativas aplicables', 'Uso previsto', 'Clasificación (envase, alimento, cosmético, etc.)'],
      estado: 'disponible_pronto',
    },
    {
      id: 'bpm-rne',
      titulo: 'BPM para RNE',
      descripcion: 'Armado de documentación de Buenas Prácticas de Manufactura necesaria para la obtención del RNE (Registro Nacional de Establecimiento). Incluye: manual BPM, POEs, planillas POES, layout y flujogramas.',
      icon: Factory,
      color: 'from-emerald-500 to-green-600',
      bgLight: 'bg-emerald-50 border-emerald-200',
      campos: ['Manual de BPM', 'Procedimientos Operativos Estandarizados (POEs)', 'Planillas POES (Sanitización)', 'Layout / Plano del establecimiento', 'Flujograma de proceso', 'Plan de control de plagas', 'Programa de capacitación', 'Registros y trazabilidad'],
      estado: 'disponible_pronto',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Wrench className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div>
            <p className="font-semibold text-indigo-900">Herramientas Regulatorias</p>
            <p className="text-sm text-indigo-700 mt-1">
              Generadores de documentación regulatoria para trámites ANMAT. Estas herramientas te ayudan a armar la documentación técnica requerida por cada tipo de trámite.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {herramientas.map(h => {
          const Icon = h.icon;
          return (
            <div key={h.id} className={`bg-white rounded-xl border-2 ${h.bgLight} overflow-hidden`}>
              {/* Card header */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${h.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-800">{h.titulo}</h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Próximamente
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{h.descripcion}</p>
                  </div>
                </div>
              </div>

              {/* Campos que incluye */}
              <div className="px-6 pb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Incluye:</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {h.campos.map((campo, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                      {campo}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                <button
                  disabled
                  className="w-full py-2.5 bg-slate-200 text-slate-500 rounded-lg font-medium text-sm cursor-not-allowed"
                >
                  Próximamente disponible
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
