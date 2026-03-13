/**
 * ClienteModulos — Module assignment & regulatory alert panel for a client.
 *
 * Shows:
 * 1. Toggle switches for ANMAT/INAL/SENASA module assignment
 * 2. Agent toggle (enable/disable regulatory monitoring)
 * 3. Recent regulatory alerts for this client's modules
 */
import { useState, useEffect } from 'react';
import {
  Shield, FlaskConical, Leaf, Loader2, Bell, BellOff,
  AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp,
  Sparkles, ExternalLink, Eye, Package, Truck, ClipboardCheck,
  BarChart3, Lock, Zap, ShoppingCart, Wallet, Factory,
  ClipboardList, Route,
} from 'lucide-react';
import api, { type AlertaRegulatoria, type ClienteModulo } from '../../lib/api';

interface Props {
  clienteId: string;
}

type ModuleTier = 'included' | 'premium';

interface ModuloDef {
  id: string;
  label: string;
  desc: string;
  icon: typeof Shield;
  color: string;
  border: string;
  bg: string;
  tier: ModuleTier;
  price?: string; // monthly price display
}

const MODULOS: ModuloDef[] = [
  // ── Included (regulatory) ──
  { id: 'ANMAT', label: 'ANMAT', desc: 'Dispositivos médicos, cosméticos, medicamentos', icon: Shield, color: 'from-indigo-500 to-violet-600', border: 'border-indigo-300', bg: 'bg-indigo-50', tier: 'included' },
  { id: 'INAL', label: 'INAL', desc: 'Alimentos, envases, RNE/RNPA', icon: FlaskConical, color: 'from-emerald-500 to-teal-600', border: 'border-emerald-300', bg: 'bg-emerald-50', tier: 'included' },
  { id: 'SENASA', label: 'SENASA', desc: 'Fitosanitarios, veterinarios, tránsito', icon: Leaf, color: 'from-orange-500 to-amber-600', border: 'border-orange-300', bg: 'bg-orange-50', tier: 'included' },
  // ── Premium (add-ons) ──
  { id: 'STOCK', label: 'Control de Stock', desc: 'Inventario, movimientos, alertas de stock mínimo', icon: Package, color: 'from-cyan-500 to-blue-600', border: 'border-cyan-300', bg: 'bg-cyan-50', tier: 'premium', price: '$15.000/mes' },
  { id: 'VENTAS', label: 'Ventas / POS', desc: 'Punto de venta, registro de operaciones, métodos de pago', icon: ShoppingCart, color: 'from-emerald-500 to-green-600', border: 'border-emerald-300', bg: 'bg-emerald-50', tier: 'premium', price: '$20.000/mes' },
  { id: 'CAJA', label: 'Caja', desc: 'Sesiones de caja, apertura/cierre, ingresos y egresos', icon: Wallet, color: 'from-amber-500 to-yellow-600', border: 'border-amber-300', bg: 'bg-amber-50', tier: 'premium', price: '$10.000/mes' },
  { id: 'PROVEEDORES', label: 'Proveedores', desc: 'Gestión de proveedores, órdenes de compra', icon: Truck, color: 'from-orange-500 to-red-600', border: 'border-orange-300', bg: 'bg-orange-50', tier: 'premium', price: '$12.000/mes' },
  { id: 'PRODUCCION', label: 'Producción', desc: 'Órdenes de producción, insumos, control de proceso', icon: Factory, color: 'from-violet-500 to-purple-600', border: 'border-violet-300', bg: 'bg-violet-50', tier: 'premium', price: '$18.000/mes' },
  { id: 'PEDIDOS', label: 'Pedidos Online', desc: 'Recepción y seguimiento de pedidos, estados de entrega', icon: ClipboardList, color: 'from-blue-500 to-indigo-600', border: 'border-blue-300', bg: 'bg-blue-50', tier: 'premium', price: '$15.000/mes' },
  { id: 'LOGISTICA', label: 'Logística', desc: 'Vehículos, rutas de entrega, seguimiento de paradas', icon: Route, color: 'from-teal-500 to-cyan-600', border: 'border-teal-300', bg: 'bg-teal-50', tier: 'premium', price: '$15.000/mes' },
  { id: 'CALIDAD', label: 'Calidad', desc: 'BPM, auditorías, no conformidades, CAPA', icon: ClipboardCheck, color: 'from-teal-500 to-green-600', border: 'border-teal-300', bg: 'bg-teal-50', tier: 'premium', price: '$18.000/mes' },
  { id: 'REPORTES', label: 'Reportes Avanzados', desc: 'Dashboards, métricas, exportación automática', icon: BarChart3, color: 'from-violet-500 to-purple-600', border: 'border-violet-300', bg: 'bg-violet-50', tier: 'premium', price: '$8.000/mes' },
];

const IMPACTO_CONFIG: Record<string, { icon: typeof Info; color: string; label: string }> = {
  bajo: { icon: Info, color: 'text-blue-500 bg-blue-50', label: 'Bajo' },
  medio: { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50', label: 'Medio' },
  alto: { icon: AlertTriangle, color: 'text-orange-500 bg-orange-50', label: 'Alto' },
  critico: { icon: AlertTriangle, color: 'text-red-500 bg-red-50', label: 'Crítico' },
};

export default function ClienteModulos({ clienteId }: Props) {
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [agenteActivo, setAgenteActivo] = useState(true);
  const [alertas, setAlertas] = useState<AlertaRegulatoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedAlerta, setExpandedAlerta] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [clienteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mods, als] = await Promise.all([
        api.clienteModulos.get(clienteId),
        api.alertas.forClient(clienteId),
      ]);
      setAssigned(new Set(mods.map((m: ClienteModulo) => m.modulo)));
      setAgenteActivo(mods.length === 0 || mods.some((m: ClienteModulo) => m.agente_activo === 1));
      setAlertas(als);
    } catch {
      // Backend might not have the tables yet
    }
    setLoading(false);
  };

  const toggleModule = async (modId: string) => {
    const next = new Set(assigned);
    if (next.has(modId)) {
      next.delete(modId);
    } else {
      next.add(modId);
    }
    setAssigned(next);
    await saveModules(Array.from(next));
  };

  const toggleAgente = async () => {
    const next = !agenteActivo;
    setAgenteActivo(next);
    await saveModules(Array.from(assigned), next);
  };

  const saveModules = async (mods: string[], agente?: boolean) => {
    setSaving(true);
    try {
      await api.clienteModulos.set(clienteId, mods, agente ?? agenteActivo);
    } catch (err) {
      console.error('Error saving modules:', err);
    }
    setSaving(false);
  };

  const markRead = async (alertaId: string) => {
    try {
      await api.alertas.markRead(clienteId, alertaId);
      setAlertas(prev => prev.map(a => a.id === alertaId ? { ...a, cliente_leida: 1 } : a));
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const unreadCount = alertas.filter(a => !a.cliente_leida).length;

  return (
    <div className="space-y-6">
      {/* Module toggles */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Módulos asignados</h3>
          {saving && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>

        {/* Included modules (regulatory) */}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Regulatorios — incluidos</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {MODULOS.filter(m => m.tier === 'included').map(mod => {
            const isOn = assigned.has(mod.id);
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => toggleModule(mod.id)}
                className={`relative text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                  isOn
                    ? `${mod.bg} ${mod.border} shadow-sm`
                    : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${mod.color} flex items-center justify-center flex-shrink-0 ${
                    isOn ? 'shadow-sm' : 'grayscale opacity-50'
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{mod.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{mod.desc}</p>
                  </div>
                </div>
                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isOn ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'
                }`}>
                  {isOn && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Premium modules (add-ons with pricing) */}
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Módulos adicionales</p>
          <Zap className="w-3 h-3 text-amber-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MODULOS.filter(m => m.tier === 'premium').map(mod => {
            const isOn = assigned.has(mod.id);
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => toggleModule(mod.id)}
                className={`relative text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                  isOn
                    ? `${mod.bg} ${mod.border} shadow-sm`
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:opacity-100 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${mod.color} flex items-center justify-center flex-shrink-0 ${
                    isOn ? 'shadow-sm' : 'grayscale-[30%] opacity-70'
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">{mod.label}</p>
                      {!isOn && <Lock className="w-3 h-3 text-slate-400" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{mod.desc}</p>
                    {mod.price && (
                      <p className={`text-[11px] font-semibold mt-1.5 ${isOn ? 'text-green-600' : 'text-amber-600'}`}>
                        {isOn ? 'Activo' : mod.price}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isOn ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'
                }`}>
                  {isOn && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Agent toggle */}
        <div className="mt-4 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {agenteActivo ? (
              <Bell className="w-4 h-4 text-blue-500" />
            ) : (
              <BellOff className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-sm text-slate-600">
              Agente Vigía Regulatorio
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              agenteActivo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {agenteActivo ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </div>
          <button
            onClick={toggleAgente}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              agenteActivo ? 'bg-blue-500' : 'bg-slate-300'
            }`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              agenteActivo ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 px-1">
          Cuando está activo, este cliente recibe alertas automáticas sobre cambios regulatorios en sus módulos.
        </p>
      </div>

      {/* Regulatory Alerts */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Alertas Regulatorias
            {unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
        </div>

        {alertas.length === 0 ? (
          <div className="py-6 text-center">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Sin alertas regulatorias</p>
            <p className="text-xs text-slate-400 mt-1">
              {assigned.size === 0
                ? 'Asigná módulos para recibir alertas'
                : 'Las alertas aparecerán cuando haya cambios normativos'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alertas.map(alerta => {
              const impact = IMPACTO_CONFIG[alerta.impacto] || IMPACTO_CONFIG.medio;
              const ImpactIcon = impact.icon;
              const isExpanded = expandedAlerta === alerta.id;
              const isUnread = !alerta.cliente_leida;

              return (
                <div
                  key={alerta.id}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    isUnread ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white'
                  }`}
                >
                  <button
                    onClick={() => {
                      setExpandedAlerta(isExpanded ? null : alerta.id);
                      if (isUnread) markRead(alerta.id);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${impact.color}`}>
                      <ImpactIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isUnread && <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />}
                        <p className={`text-sm font-medium truncate ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                          {alerta.titulo}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{alerta.modulo}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(alerta.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${impact.color}`}>
                          {impact.label}
                        </span>
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
                          <p className="text-xs font-semibold text-slate-500 mb-1">Detalle del cambio</p>
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

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {alerta.fuente && (
                          <span className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {alerta.fuente}
                          </span>
                        )}
                        <span className="capitalize">{alerta.tipo_cambio}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
