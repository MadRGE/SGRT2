/**
 * AlertasRegulatorias — Admin panel for creating and managing regulatory change alerts.
 *
 * Features:
 * - Create alerts manually
 * - Generate AI-enriched alerts via Ollama (expand brief descriptions into full analysis)
 * - See which clients are affected per alert
 * - Filter by module (ANMAT, INAL, SENASA)
 */
import { useState, useEffect } from 'react';
import {
  Shield, FlaskConical, Leaf, Loader2, AlertTriangle, Plus,
  Sparkles, ChevronDown, ChevronUp, Users, Bell, Send,
  Info, X,
} from 'lucide-react';
import api, { type AlertaRegulatoria } from '../../lib/api';

const MODULOS = [
  { id: 'ANMAT', label: 'ANMAT', icon: Shield, color: 'from-indigo-500 to-violet-600' },
  { id: 'INAL', label: 'INAL', icon: FlaskConical, color: 'from-emerald-500 to-teal-600' },
  { id: 'SENASA', label: 'SENASA', icon: Leaf, color: 'from-orange-500 to-amber-600' },
];

const IMPACTO_OPTIONS = [
  { value: 'bajo', label: 'Bajo', color: 'bg-blue-100 text-blue-700' },
  { value: 'medio', label: 'Medio', color: 'bg-amber-100 text-amber-700' },
  { value: 'alto', label: 'Alto', color: 'bg-orange-100 text-orange-700' },
  { value: 'critico', label: 'Crítico', color: 'bg-red-100 text-red-700' },
];

export default function AlertasRegulatorias() {
  const [alertas, setAlertas] = useState<AlertaRegulatoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMod, setFilterMod] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formModulo, setFormModulo] = useState('ANMAT');
  const [formTitulo, setFormTitulo] = useState('');
  const [formResumen, setFormResumen] = useState('');
  const [formFuente, setFormFuente] = useState('');
  const [formImpacto, setFormImpacto] = useState('medio');
  const [submitting, setSubmitting] = useState(false);
  const [useAI, setUseAI] = useState(true);

  useEffect(() => { loadAlertas(); }, [filterMod]);

  const loadAlertas = async () => {
    setLoading(true);
    try {
      const data = await api.alertas.list(filterMod || undefined);
      setAlertas(data);
    } catch {
      setAlertas([]);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formTitulo.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        modulo: formModulo,
        titulo: formTitulo.trim(),
        resumen: formResumen.trim(),
        fuente: formFuente.trim(),
        impacto: formImpacto,
      };

      if (useAI) {
        await api.alertas.generateWithAI(payload);
      } else {
        await api.alertas.create(payload);
      }

      setFormTitulo('');
      setFormResumen('');
      setFormFuente('');
      setShowForm(false);
      await loadAlertas();
    } catch (err: any) {
      alert(err.message || 'Error al crear la alerta');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Vigía Regulatorio</h2>
            <p className="text-xs text-slate-500">Alertas de cambios normativos para clientes</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Nueva alerta'}
        </button>
      </div>

      {/* Module filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterMod(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !filterMod ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos
        </button>
        {MODULOS.map(mod => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              onClick={() => setFilterMod(filterMod === mod.id ? null : mod.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterMod === mod.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {mod.label}
            </button>
          );
        })}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Crear alerta regulatoria</h3>

          {/* Module selector */}
          <div className="flex gap-2">
            {MODULOS.map(mod => (
              <button
                key={mod.id}
                onClick={() => setFormModulo(mod.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                  formModulo === mod.id
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <mod.icon className="w-3.5 h-3.5" />
                {mod.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <input
            value={formTitulo}
            onChange={e => setFormTitulo(e.target.value)}
            placeholder="Título del cambio regulatorio (ej: Nueva Disposición ANMAT 2026/15)"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
          />

          {/* Description */}
          <textarea
            value={formResumen}
            onChange={e => setFormResumen(e.target.value)}
            placeholder="Descripción breve del cambio (el agente IA la expande automáticamente)"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            {/* Source */}
            <input
              value={formFuente}
              onChange={e => setFormFuente(e.target.value)}
              placeholder="Fuente (ej: Boletín Oficial, ANMAT.gob.ar)"
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
            />

            {/* Impact */}
            <select
              value={formImpacto}
              onChange={e => setFormImpacto(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
            >
              {IMPACTO_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* AI toggle + submit */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setUseAI(!useAI)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                useAI
                  ? 'bg-violet-100 text-violet-700 border border-violet-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {useAI ? 'IA activa — expande automáticamente' : 'Sin IA — solo manual'}
            </button>

            <button
              onClick={handleSubmit}
              disabled={!formTitulo.trim() || submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 shadow-sm hover:shadow-md transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {useAI ? 'Analizando con IA...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {useAI ? 'Crear con IA' : 'Crear alerta'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : alertas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No hay alertas regulatorias</p>
          <p className="text-xs text-slate-400 mt-1">Creá una alerta cuando detectes un cambio normativo importante</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alertas.map(alerta => {
            const isExpanded = expandedId === alerta.id;
            const impactOpt = IMPACTO_OPTIONS.find(o => o.value === alerta.impacto);
            const modConfig = MODULOS.find(m => m.id === alerta.modulo);

            return (
              <div key={alerta.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : alerta.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  {modConfig && (
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${modConfig.color} flex items-center justify-center flex-shrink-0`}>
                      <modConfig.icon className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{alerta.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{alerta.modulo}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(alerta.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {impactOpt && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${impactOpt.color}`}>
                          {impactOpt.label}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 space-y-3">
                    {alerta.resumen && (
                      <p className="text-sm text-slate-600 mt-3 leading-relaxed">{alerta.resumen}</p>
                    )}

                    {alerta.detalle && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Análisis detallado</p>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{alerta.detalle}</p>
                      </div>
                    )}

                    {alerta.acciones_requeridas && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Acciones requeridas
                        </p>
                        <ul className="text-xs text-amber-800 space-y-1">
                          {alerta.acciones_requeridas.split(';').filter(Boolean).map((action, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-400 mt-0.5">•</span>
                              {action.trim()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {alerta.clientes_afectados && alerta.clientes_afectados.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Clientes afectados ({alerta.clientes_afectados.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {alerta.clientes_afectados.map(c => (
                            <span key={c.cliente_id} className="text-xs bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-700">
                              {c.razon_social}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {alerta.fuente && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Fuente: {alerta.fuente}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
