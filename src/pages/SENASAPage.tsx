import { useState } from 'react';
import { Leaf, Bug, Pill, Wrench, Sparkles, Truck, MessageCircle, ClipboardList } from 'lucide-react';
import ModuloTramites from '../components/Modulo/ModuloTramites';
import ModuloAsistente from '../components/Modulo/ModuloAsistente';

type Tab = 'herramientas' | 'tramites' | 'asistente';
type Herramienta = null | 'fitosanitario' | 'veterinario' | 'transito';

const SENASA_SYSTEM_PROMPT = `Sos un asistente experto en trámites ante SENASA (Servicio Nacional de Sanidad y Calidad Agroalimentaria) de Argentina.

Tu conocimiento abarca:
- Certificados fitosanitarios de importación y exportación
- Registro de productos veterinarios y fitosanitarios
- Documento de Tránsito Vegetal (DTV) y guías de tránsito
- Habilitación de establecimientos agroalimentarios
- Control de plagas y enfermedades de declaración obligatoria
- Normativa de SENASA: resoluciones, disposiciones, circulares
- Requisitos sanitarios por país destino/origen
- Trámites en la plataforma SIGTRÁMITE de SENASA
- LMR (Límites Máximos de Residuos) de plaguicidas
- Buenas prácticas agrícolas (BPA) y manufactura (BPM)
- Certificación orgánica
- Trazabilidad animal y vegetal

Respondé siempre en español argentino, de forma clara y profesional. Citá normativa cuando corresponda. Si no sabés algo con certeza, indicalo.`;

const SENASA_QUESTIONS = [
  '¿Qué necesito para obtener un certificado fitosanitario de exportación?',
  '¿Cómo registro un producto veterinario ante SENASA?',
  '¿Cuáles son los requisitos para un DTV (Documento de Tránsito Vegetal)?',
  '¿Qué plagas son de declaración obligatoria en Argentina?',
];

export default function SENASAPage() {
  const [tab, setTab] = useState<Tab>('herramientas');
  const [herramienta, setHerramienta] = useState<Herramienta>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Leaf className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SENASA</h1>
          <p className="text-sm text-slate-500">Servicio Nacional de Sanidad y Calidad Agroalimentaria</p>
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
            label="Asistente SENASA"
            badge="Gratis"
          />
        </div>
      </div>

      {/* Content */}
      {tab === 'herramientas' && !herramienta && <HerramientasSENASA onSelect={setHerramienta} />}
      {tab === 'herramientas' && herramienta && (
        <PlaceholderTool herramienta={herramienta} onBack={() => setHerramienta(null)} />
      )}
      {tab === 'tramites' && (
        <ModuloTramites organismo="SENASA" color="from-orange-500 to-amber-600" />
      )}
      {tab === 'asistente' && (
        <ModuloAsistente
          modulo="SENASA"
          color="from-orange-500 to-amber-600"
          systemPrompt={SENASA_SYSTEM_PROMPT}
          suggestedQuestions={SENASA_QUESTIONS}
          placeholder="Preguntame sobre fitosanitarios, DTV, registro de productos..."
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
          ? 'text-orange-600 border-b-2 border-orange-600'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge && (
        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">{badge}</span>
      )}
    </button>
  );
}

function HerramientasSENASA({ onSelect }: { onSelect: (h: Herramienta) => void }) {
  const herramientas = [
    {
      id: 'fitosanitario' as const,
      titulo: 'Certificado Fitosanitario',
      descripcion: 'Gestión de certificados fitosanitarios para exportación/importación de productos vegetales.',
      color: 'from-orange-500 to-amber-600',
      bgLight: 'bg-orange-50 border-orange-200',
      hoverBorder: 'hover:border-orange-400',
      icon: Bug,
    },
    {
      id: 'veterinario' as const,
      titulo: 'Productos Veterinarios',
      descripcion: 'Registro y habilitación de productos veterinarios. Formulación, ensayos de eficacia, documentación técnica.',
      color: 'from-amber-500 to-yellow-600',
      bgLight: 'bg-amber-50 border-amber-200',
      hoverBorder: 'hover:border-amber-400',
      icon: Pill,
    },
    {
      id: 'transito' as const,
      titulo: 'Tránsito Federal',
      descripcion: 'DTV, guías de tránsito, certificaciones para transporte interprovincial de productos agropecuarios.',
      color: 'from-yellow-500 to-orange-600',
      bgLight: 'bg-yellow-50 border-yellow-200',
      hoverBorder: 'hover:border-yellow-400',
      icon: Truck,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Leaf className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-900">Módulo SENASA</p>
            <p className="text-sm text-orange-700 mt-1">
              Herramientas para trámites ante SENASA. Fitosanitarios, veterinarios, tránsito federal.
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
            <span className="absolute top-3 right-3 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold">
              PRÓXIMO
            </span>
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

function PlaceholderTool({ herramienta, onBack }: { herramienta: string; onBack: () => void }) {
  const titles: Record<string, string> = {
    fitosanitario: 'Certificado Fitosanitario',
    veterinario: 'Productos Veterinarios',
    transito: 'Tránsito Federal',
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
        ← Volver a herramientas
      </button>
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Wrench className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{titles[herramienta] || herramienta}</h2>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-500">
          <Sparkles className="w-4 h-4" /> En desarrollo — próximamente
        </div>
      </div>
    </div>
  );
}
