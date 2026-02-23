import { useState } from 'react';
import { Shield, FileText, Wrench, Sparkles } from 'lucide-react';
import { ANMATCasosList } from '../components/ANMAT/ANMATCasosList';
import { HerramientaFichaProducto } from '../components/ANMAT/HerramientaFichaProducto';
import { HerramientaBPM } from '../components/ANMAT/HerramientaBPM';

type Tab = 'casos' | 'herramientas';
type Herramienta = null | 'ficha-producto' | 'bpm-rne';

export default function ANMATPage() {
  const [tab, setTab] = useState<Tab>('casos');
  const [herramienta, setHerramienta] = useState<Herramienta>(null);

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
            onClick={() => { setTab('casos'); setHerramienta(null); }}
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
            onClick={() => { setTab('herramientas'); setHerramienta(null); }}
            className={`pb-3 px-1 font-medium text-sm transition-colors flex items-center gap-2 ${
              tab === 'herramientas'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Herramientas IA
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'casos' && <ANMATCasosList />}
      {tab === 'herramientas' && !herramienta && (
        <HerramientasSelector onSelect={setHerramienta} />
      )}
      {tab === 'herramientas' && herramienta === 'ficha-producto' && (
        <HerramientaFichaProducto />
      )}
      {tab === 'herramientas' && herramienta === 'bpm-rne' && (
        <HerramientaBPM />
      )}
    </div>
  );
}

function HerramientasSelector({ onSelect }: { onSelect: (h: Herramienta) => void }) {
  const herramientas = [
    {
      id: 'ficha-producto' as const,
      titulo: 'Ficha de Producto',
      descripcion: 'Genera fichas técnicas de producto con toda la información requerida por ANMAT: composición, materiales, fabricante, normativas aplicables y datos de aptitud sanitaria.',
      color: 'from-blue-500 to-cyan-600',
      bgLight: 'bg-blue-50 border-blue-200',
      hoverBorder: 'hover:border-blue-400',
    },
    {
      id: 'bpm-rne' as const,
      titulo: 'BPM para RNE',
      descripcion: 'Documentación de Buenas Prácticas de Manufactura para la obtención del RNE. Incluye: manual BPM, POEs, planillas POES, layout y flujogramas.',
      color: 'from-emerald-500 to-green-600',
      bgLight: 'bg-emerald-50 border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
          <div>
            <p className="font-semibold text-indigo-900">Herramientas IA - DeepSeek</p>
            <p className="text-sm text-indigo-700 mt-1">
              Generadores de documentación regulatoria potenciados por IA. Completá los datos de tu producto o establecimiento y la IA genera la documentación técnica.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {herramientas.map(h => (
          <button
            key={h.id}
            onClick={() => onSelect(h.id)}
            className={`text-left bg-white rounded-xl border-2 ${h.bgLight} ${h.hoverBorder} overflow-hidden transition-all hover:shadow-lg group`}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${h.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-slate-900">{h.titulo}</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{h.descripcion}</p>
                </div>
              </div>
            </div>
            <div className={`px-6 py-4 bg-gradient-to-r ${h.color} text-white font-medium text-sm text-center`}>
              Abrir herramienta
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
