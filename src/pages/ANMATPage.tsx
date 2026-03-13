import { useState } from 'react';
import { Shield, FileText, Wrench, Sparkles, Stethoscope, MessageCircle, ClipboardList } from 'lucide-react';
import { ANMATCasosList } from '../components/ANMAT/ANMATCasosList';
import { HerramientaFichaProducto } from '../components/ANMAT/HerramientaFichaProducto';
import { HerramientaBPM } from '../components/ANMAT/HerramientaBPM';
import ModuloTramites from '../components/Modulo/ModuloTramites';
import ModuloAsistente from '../components/Modulo/ModuloAsistente';

type Tab = 'casos' | 'herramientas' | 'tramites' | 'asistente';
type Herramienta = null | 'ficha-producto' | 'bpm-rne' | 'dispositivos';

const ANMAT_SYSTEM_PROMPT = `Sos un asistente experto en trámites ante ANMAT (Administración Nacional de Medicamentos, Alimentos y Tecnología Médica) de Argentina.

Tu conocimiento abarca:
- Registro y habilitación de dispositivos médicos (clasificación de riesgo I, II, III, IV)
- Registro de productos cosméticos y de higiene personal
- Registro de medicamentos y especialidades medicinales
- Buenas Prácticas de Manufactura (BPM) para establecimientos
- Habilitación de establecimientos productores, importadores y distribuidores
- Normativas ANMAT: disposiciones, resoluciones y reglamentaciones vigentes
- Trámites a Distancia (TAD) para presentaciones ante ANMAT
- Certificados de libre venta y comercialización
- Farmacovigilancia y tecnovigilancia
- Trazabilidad de medicamentos (SNT)
- Importación y exportación de productos regulados por ANMAT

Respondé siempre en español argentino, de forma clara y profesional. Cuando sea relevante, citá la normativa aplicable. Si no sabés algo con certeza, indicalo.`;

const ANMAT_QUESTIONS = [
  '¿Cómo se clasifica el riesgo de un dispositivo médico?',
  '¿Qué documentación necesito para habilitar un establecimiento ante ANMAT?',
  '¿Cuál es el proceso para registrar un producto cosmético?',
  '¿Qué son las BPM y cómo se implementan para obtener habilitación?',
];

export default function ANMATPage() {
  const [tab, setTab] = useState<Tab>('casos');
  const [herramienta, setHerramienta] = useState<Herramienta>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ANMAT</h1>
          <p className="text-sm text-slate-500">Dispositivos médicos, cosméticos, medicamentos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <TabButton
            active={tab === 'casos'}
            onClick={() => { setTab('casos'); setHerramienta(null); }}
            icon={FileText}
            label="Casos & Herramientas"
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
            label="Asistente ANMAT"
            badge="Gratis"
          />
        </div>
      </div>

      {/* Content */}
      {tab === 'casos' && !herramienta && <ANMATCasosList />}
      {tab === 'casos' && herramienta === 'ficha-producto' && (
        <HerramientaFichaProducto />
      )}
      {tab === 'casos' && herramienta === 'bpm-rne' && (
        <HerramientaBPM />
      )}
      {tab === 'casos' && herramienta === 'dispositivos' && (
        <PlaceholderTool onBack={() => setHerramienta(null)} />
      )}
      {tab === 'tramites' && (
        <ModuloTramites organismo="ANMAT" color="from-indigo-500 to-violet-600" />
      )}
      {tab === 'asistente' && (
        <ModuloAsistente
          modulo="ANMAT"
          color="from-indigo-500 to-violet-600"
          systemPrompt={ANMAT_SYSTEM_PROMPT}
          suggestedQuestions={ANMAT_QUESTIONS}
          placeholder="Preguntame sobre dispositivos médicos, cosméticos, habilitaciones..."
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
          ? 'text-indigo-600 border-b-2 border-indigo-600'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge && (
        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">{badge}</span>
      )}
    </button>
  );
}

function PlaceholderTool({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
        ← Volver a herramientas
      </button>
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Dispositivos Médicos</h2>
        <p className="text-slate-600 mt-2 max-w-md mx-auto">
          Módulo en desarrollo. Próximamente: registro de dispositivos médicos, clasificación de riesgo, documentación técnica.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm text-slate-500">
          <Sparkles className="w-4 h-4" />
          En desarrollo — próximamente disponible
        </div>
      </div>
    </div>
  );
}
