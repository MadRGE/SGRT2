import { useState } from 'react';
import { FlaskConical, Package, FileText, Wrench, Sparkles, MessageCircle, ClipboardList } from 'lucide-react';
import { HerramientaRegistroEnvase } from '../components/ANMAT/HerramientaRegistroEnvase';
import ModuloTramites from '../components/Modulo/ModuloTramites';
import ModuloAsistente from '../components/Modulo/ModuloAsistente';

type Tab = 'herramientas' | 'tramites' | 'asistente';
type Herramienta = null | 'registro-envase' | 'rne' | 'rnpa';

const INAL_SYSTEM_PROMPT = `Sos un asistente experto en trámites ante el INAL (Instituto Nacional de Alimentos) de Argentina.

Tu conocimiento abarca:
- Registro de envases y materiales en contacto con alimentos
- Registro Nacional de Establecimiento (RNE) — requisitos, BPM, habilitación
- Registro Nacional de Producto Alimenticio (RNPA)
- Clasificación de riesgo de materiales (bajo, medio, alto)
- Normativa del Código Alimentario Argentino (CAA)
- Resolución GMC 56/92 — migración de materiales plásticos
- Disposiciones ANMAT sobre envases alimentarios
- Fichas técnicas y certificados de composición
- Trámites a Distancia (TAD) para presentaciones ante INAL
- Materiales permitidos: PP, HDPE, PET, acero inoxidable 304/316, vidrio borosilicato, silicona grado alimenticio, etc.
- Temperaturas de uso, aptitud para microondas, lavavajillas, BPA-free

Respondé siempre en español argentino, de forma clara y profesional. Cuando sea relevante, citá la normativa aplicable. Si no sabés algo con certeza, indicalo.`;

const INAL_QUESTIONS = [
  '¿Qué materiales plásticos están permitidos para contacto con alimentos?',
  '¿Cómo se clasifica el riesgo de un envase importado?',
  '¿Qué documentación necesito para un RNE?',
  '¿Cuál es el proceso para registrar un envase ante INAL?',
];

export default function INALPage() {
  const [tab, setTab] = useState<Tab>('herramientas');
  const [herramienta, setHerramienta] = useState<Herramienta>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <FlaskConical className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">INAL — Alimentos & Envases</h1>
          <p className="text-sm text-slate-500">Instituto Nacional de Alimentos — Registro de envases, RNE, RNPA</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <TabButton
            active={tab === 'herramientas'}
            onClick={() => { setTab('herramientas'); setHerramienta(null); }}
            icon={Wrench}
            label="Herramientas"
          />
          <TabButton
            active={tab === 'tramites'}
            onClick={() => setTab('tramites')}
            icon={ClipboardList}
            label="Mis Trámites"
          />
          <TabButton
            active={tab === 'asistente'}
            onClick={() => setTab('asistente')}
            icon={MessageCircle}
            label="Asistente INAL"
            badge="Gratis"
          />
        </div>
      </div>

      {/* Content */}
      {tab === 'herramientas' && !herramienta && (
        <HerramientasINAL onSelect={setHerramienta} />
      )}
      {tab === 'herramientas' && herramienta === 'registro-envase' && (
        <HerramientaRegistroEnvase onBack={() => setHerramienta(null)} />
      )}
      {tab === 'herramientas' && herramienta === 'rne' && (
        <PlaceholderTool title="RNE — Registro Nacional de Establecimiento" onBack={() => setHerramienta(null)} />
      )}
      {tab === 'herramientas' && herramienta === 'rnpa' && (
        <PlaceholderTool title="RNPA — Registro Nacional de Producto Alimenticio" onBack={() => setHerramienta(null)} />
      )}
      {tab === 'tramites' && (
        <ModuloTramites organismo="INAL" color="from-emerald-500 to-teal-600" />
      )}
      {tab === 'asistente' && (
        <ModuloAsistente
          modulo="INAL"
          color="from-emerald-500 to-teal-600"
          systemPrompt={INAL_SYSTEM_PROMPT}
          suggestedQuestions={INAL_QUESTIONS}
          placeholder="Preguntame sobre envases, RNE, RNPA, materiales..."
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, badge }: {
  active: boolean;
  onClick: () => void;
  icon: typeof Wrench;
  label: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 px-1 font-medium text-sm transition-colors flex items-center gap-2 ${
        active
          ? 'text-emerald-600 border-b-2 border-emerald-600'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge && (
        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">{badge}</span>
      )}
    </button>
  );
}

function HerramientasINAL({ onSelect }: { onSelect: (h: Herramienta) => void }) {
  const herramientas = [
    {
      id: 'registro-envase' as const,
      titulo: 'Registro de Envase',
      descripcion: 'Proceso completo: cargá la factura/invoice, detecta materiales, genera fichas técnicas ANMAT y solicitud TAD. Integrado con Hammer.',
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50 border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
      icon: Package,
      badge: 'ACTIVO',
    },
    {
      id: 'rne' as const,
      titulo: 'RNE — Establecimiento',
      descripcion: 'Alta y renovación del Registro Nacional de Establecimiento. Documentación BPM, habilitación municipal, layout, flujogramas.',
      color: 'from-teal-500 to-cyan-600',
      bgLight: 'bg-teal-50 border-teal-200',
      hoverBorder: 'hover:border-teal-400',
      icon: FileText,
      badge: 'PRÓXIMO',
    },
    {
      id: 'rnpa' as const,
      titulo: 'RNPA — Producto',
      descripcion: 'Registro de productos alimenticios: rótulo nutricional, composición, ensayos de laboratorio.',
      color: 'from-cyan-500 to-blue-600',
      bgLight: 'bg-cyan-50 border-cyan-200',
      hoverBorder: 'hover:border-cyan-400',
      icon: Sparkles,
      badge: 'PRÓXIMO',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <FlaskConical className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-900">Módulo INAL</p>
            <p className="text-sm text-emerald-700 mt-1">
              Herramientas para trámites ante INAL. Generación de documentación y automatización via Hammer.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {herramientas.map(h => (
          <button
            key={h.id}
            onClick={() => onSelect(h.id)}
            className={`text-left bg-white rounded-xl border-2 ${h.bgLight} ${h.hoverBorder} overflow-hidden transition-all hover:shadow-lg group relative`}
          >
            {h.badge && (
              <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                h.badge === 'ACTIVO' ? 'bg-emerald-400 text-emerald-900' : 'bg-slate-200 text-slate-600'
              }`}>{h.badge}</span>
            )}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${h.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <h.icon className="w-6 h-6 text-white" />
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

function PlaceholderTool({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
        ← Volver a herramientas
      </button>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Wrench className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-500">
          <Sparkles className="w-4 h-4" /> En desarrollo — próximamente
        </div>
      </div>
    </div>
  );
}
