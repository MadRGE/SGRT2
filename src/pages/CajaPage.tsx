/**
 * CajaPage — Cash register sessions (premium module).
 */
import { useState, useEffect } from 'react';
import {
  Wallet, Plus, Loader2, ArrowDownCircle, ArrowUpCircle,
  Lock, Unlock, Clock, DollarSign,
} from 'lucide-react';

const API = 'http://localhost:8500/api/v2';
const token = () => localStorage.getItem('sgrt_token') || '';
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

interface CajaSesion {
  id: string;
  cliente_id: string;
  usuario_nombre: string;
  monto_apertura: number;
  monto_cierre: number | null;
  estado: string;
  abierta_el: string;
  cerrada_el: string | null;
  movimientos?: Movimiento[];
  balance?: number;
  total_ingresos?: number;
  total_egresos?: number;
}

interface Movimiento {
  id: string;
  tipo: string;
  monto: number;
  descripcion: string;
  created_at: string;
}

interface Props {
  clienteId?: string;
}

export default function CajaPage({ clienteId }: Props) {
  const [sesionActiva, setSesionActiva] = useState<CajaSesion | null>(null);
  const [historial, setHistorial] = useState<CajaSesion[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [montoApertura, setMontoApertura] = useState(0);
  const [showMovForm, setShowMovForm] = useState(false);
  const [movTipo, setMovTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [movMonto, setMovMonto] = useState(0);
  const [movDesc, setMovDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const cid = clienteId || '';

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [activaR, histR] = await Promise.all([
        fetch(`${API}/caja/sesiones/activa?cliente_id=${cid}`, { headers: headers() }),
        fetch(`${API}/caja/sesiones?cliente_id=${cid}&limit=20`, { headers: headers() }),
      ]);
      if (activaR.ok) {
        const data = await activaR.json();
        setSesionActiva(data);
      }
      if (histR.ok) setHistorial(await histR.json());
    } catch {}
    setLoading(false);
  }

  async function abrirCaja() {
    if (!cid) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/caja/abrir`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ cliente_id: cid, monto_apertura: montoApertura }),
      });
      if (res.ok) {
        setMontoApertura(0);
        load();
      }
    } catch {}
    setSaving(false);
  }

  async function cerrarCaja() {
    if (!sesionActiva) return;
    setSaving(true);
    try {
      await fetch(`${API}/caja/sesiones/${sesionActiva.id}/cerrar`, { method: 'PUT', headers: headers() });
      load();
    } catch {}
    setSaving(false);
  }

  async function addMovimiento() {
    if (!sesionActiva || movMonto <= 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/caja/sesiones/${sesionActiva.id}/movimiento`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ tipo: movTipo, monto: movMonto, descripcion: movDesc }),
      });
      if (res.ok) {
        setShowMovForm(false);
        setMovMonto(0);
        setMovDesc('');
        load();
      }
    } catch {}
    setSaving(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-7 h-7 text-amber-400" /> Caja
        </h1>
        <p className="text-slate-400 text-sm mt-1">Sesiones de caja, ingresos y egresos</p>
      </div>

      {/* Active session or open new */}
      {sesionActiva ? (
        <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Unlock className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Caja Abierta</h2>
                <p className="text-xs text-slate-400">
                  {sesionActiva.usuario_nombre} · Abierta {new Date(sesionActiva.abierta_el).toLocaleString()}
                </p>
              </div>
            </div>
            <button onClick={cerrarCaja} disabled={saving}
              className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4" /> Cerrar Caja
            </button>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Apertura</p>
              <p className="text-lg font-bold text-white">${sesionActiva.monto_apertura.toLocaleString()}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Ingresos</p>
              <p className="text-lg font-bold text-emerald-400">+${(sesionActiva.total_ingresos || 0).toLocaleString()}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">Egresos</p>
              <p className="text-lg font-bold text-red-400">-${(sesionActiva.total_egresos || 0).toLocaleString()}</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-xs text-emerald-400">Balance Actual</p>
              <p className="text-lg font-bold text-emerald-400">${(sesionActiva.balance || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <button onClick={() => { setMovTipo('ingreso'); setShowMovForm(true); }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4" /> Ingreso
            </button>
            <button onClick={() => { setMovTipo('egreso'); setShowMovForm(true); }}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 text-sm flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4" /> Egreso
            </button>
          </div>

          {/* Movement form */}
          {showMovForm && (
            <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium text-white capitalize">Nuevo {movTipo}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Monto ($)</label>
                  <input type="number" value={movMonto} onChange={e => setMovMonto(+e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white mt-1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Descripción</label>
                  <input value={movDesc} onChange={e => setMovDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white mt-1" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addMovimiento} disabled={saving || movMonto <= 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm disabled:opacity-50">
                  Confirmar
                </button>
                <button onClick={() => setShowMovForm(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Movements list */}
          {sesionActiva.movimientos && sesionActiva.movimientos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-400">Movimientos</h3>
              {sesionActiva.movimientos.map(m => (
                <div key={m.id} className="flex items-center gap-3 bg-slate-700/30 rounded-lg px-3 py-2">
                  {m.tipo === 'ingreso'
                    ? <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                    : <ArrowUpCircle className="w-4 h-4 text-red-400" />}
                  <span className="text-sm text-white flex-1">{m.descripcion || m.tipo}</span>
                  <span className="text-xs text-slate-500">{new Date(m.created_at).toLocaleTimeString()}</span>
                  <span className={`font-medium text-sm ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center space-y-4">
          <Lock className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-lg font-semibold text-white">Caja Cerrada</h2>
          <p className="text-slate-400 text-sm">Abrí una nueva sesión de caja para empezar a registrar</p>
          <div className="flex items-center gap-3 justify-center">
            <div>
              <label className="text-xs text-slate-400">Monto de apertura ($)</label>
              <input type="number" value={montoApertura} onChange={e => setMontoApertura(+e.target.value)}
                className="w-40 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white mt-1" />
            </div>
            <button onClick={abrirCaja} disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium mt-5 flex items-center gap-2">
              <Unlock className="w-4 h-4" /> Abrir Caja
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" /> Historial de Sesiones
        </h2>
        <div className="space-y-2">
          {historial.filter(s => s.estado === 'cerrada').map(s => (
            <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center gap-4">
              <Lock className="w-5 h-5 text-slate-500" />
              <div className="flex-1">
                <p className="text-sm text-white">{s.usuario_nombre}</p>
                <p className="text-xs text-slate-500">
                  {new Date(s.abierta_el).toLocaleString()} → {s.cerrada_el && new Date(s.cerrada_el).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Apertura: ${s.monto_apertura.toLocaleString()}</p>
                <p className="text-sm font-medium text-emerald-400">Cierre: ${(s.monto_cierre || 0).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {historial.filter(s => s.estado === 'cerrada').length === 0 && (
            <p className="text-center text-slate-500 py-6">No hay sesiones previas</p>
          )}
        </div>
      </div>
    </div>
  );
}
