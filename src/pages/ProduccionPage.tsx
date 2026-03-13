/**
 * ProduccionPage — Production orders & supplies (premium module).
 */
import { useState, useEffect } from 'react';
import {
  Factory, Plus, Loader2, X, Package, AlertTriangle,
  Clock, CheckCircle, Play, Pause,
} from 'lucide-react';

const API = 'http://localhost:8500/api/v2';
const token = () => localStorage.getItem('sgrt_token') || '';
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

interface OrdenProduccion {
  id: string;
  producto_nombre: string;
  cantidad: number;
  estado: string;
  prioridad: string;
  fecha_estimada: string;
  notas: string;
  created_at: string;
}

interface Insumo {
  id: string;
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
}

interface Stats {
  pendientes: number;
  en_progreso: number;
  completadas: number;
  insumos_bajo_stock: number;
}

type Tab = 'ordenes' | 'insumos';

interface Props {
  clienteId?: string;
}

export default function ProduccionPage({ clienteId }: Props) {
  const [tab, setTab] = useState<Tab>('ordenes');
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [formNombre, setFormNombre] = useState('');
  const [formCantidad, setFormCantidad] = useState(1);
  const [formPrioridad, setFormPrioridad] = useState('media');
  const [formFecha, setFormFecha] = useState('');
  const [formNotas, setFormNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const cid = clienteId || '';

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [ordR, insR, statsR] = await Promise.all([
        fetch(`${API}/produccion/ordenes?cliente_id=${cid}`, { headers: headers() }),
        fetch(`${API}/produccion/insumos?cliente_id=${cid}`, { headers: headers() }),
        fetch(`${API}/produccion/stats?cliente_id=${cid}`, { headers: headers() }),
      ]);
      if (ordR.ok) setOrdenes(await ordR.json());
      if (insR.ok) setInsumos(await insR.json());
      if (statsR.ok) setStats(await statsR.json());
    } catch {}
    setLoading(false);
  }

  async function createOrden() {
    if (!formNombre || !cid) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/produccion/ordenes`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({
          cliente_id: cid, producto_nombre: formNombre,
          cantidad: formCantidad, prioridad: formPrioridad,
          fecha_estimada: formFecha, notas: formNotas,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setFormNombre(''); setFormCantidad(1); setFormNotas('');
        load();
      }
    } catch {}
    setSaving(false);
  }

  async function updateEstado(id: string, estado: string) {
    await fetch(`${API}/produccion/ordenes/${id}/estado?estado=${estado}`, { method: 'PUT', headers: headers() });
    load();
  }

  const prioridadColor = (p: string) => {
    switch (p) {
      case 'alta': return 'bg-red-500/20 text-red-400';
      case 'media': return 'bg-amber-500/20 text-amber-400';
      case 'baja': return 'bg-slate-500/20 text-slate-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const estadoIcon = (e: string) => {
    switch (e) {
      case 'pendiente': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'en_progreso': return <Play className="w-4 h-4 text-blue-400" />;
      case 'completada': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default: return <Pause className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Factory className="w-7 h-7 text-violet-400" /> Producción
          </h1>
          <p className="text-slate-400 text-sm mt-1">Órdenes de producción e insumos</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Orden
        </button>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">Pendientes</p>
            <p className="text-xl font-bold text-amber-400">{stats.pendientes}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">En Progreso</p>
            <p className="text-xl font-bold text-blue-400">{stats.en_progreso}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">Completadas</p>
            <p className="text-xl font-bold text-emerald-400">{stats.completadas}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">Insumos Bajo Stock</p>
            <p className={`text-xl font-bold ${stats.insumos_bajo_stock > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{stats.insumos_bajo_stock}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {(['ordenes', 'insumos'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}>
            {t === 'ordenes' ? `Órdenes (${ordenes.length})` : `Insumos (${insumos.length})`}
          </button>
        ))}
      </div>

      {/* New order form */}
      {showForm && (
        <div className="bg-slate-800 border border-violet-500/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Nueva Orden de Producción</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-400">Producto *</label>
              <input value={formNombre} onChange={e => setFormNombre(e.target.value)} placeholder="Nombre del producto"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Cantidad</label>
              <input type="number" value={formCantidad} onChange={e => setFormCantidad(+e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Prioridad</label>
              <select value={formPrioridad} onChange={e => setFormPrioridad(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm mt-1">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Fecha estimada</label>
              <input type="date" value={formFecha} onChange={e => setFormFecha(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Notas</label>
              <input value={formNotas} onChange={e => setFormNotas(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm mt-1" />
            </div>
          </div>
          <button onClick={createOrden} disabled={saving || !formNombre}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm">
            {saving ? 'Creando...' : 'Crear Orden'}
          </button>
        </div>
      )}

      {/* Orders list */}
      {tab === 'ordenes' && (
        <div className="space-y-2">
          {ordenes.map(o => (
            <div key={o.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center gap-4">
              {estadoIcon(o.estado)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{o.producto_nombre}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${prioridadColor(o.prioridad)}`}>{o.prioridad}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {o.cantidad} unidades · {new Date(o.created_at).toLocaleDateString()}
                  {o.fecha_estimada && ` · Est: ${o.fecha_estimada}`}
                </p>
              </div>
              <div className="flex gap-1">
                {o.estado === 'pendiente' && (
                  <button onClick={() => updateEstado(o.id, 'en_progreso')}
                    className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30">
                    Iniciar
                  </button>
                )}
                {o.estado === 'en_progreso' && (
                  <button onClick={() => updateEstado(o.id, 'completada')}
                    className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded text-xs hover:bg-emerald-600/30">
                    Completar
                  </button>
                )}
              </div>
            </div>
          ))}
          {!ordenes.length && <p className="text-center text-slate-500 py-12">No hay órdenes de producción</p>}
        </div>
      )}

      {/* Insumos list */}
      {tab === 'insumos' && (
        <div className="space-y-2">
          {insumos.map(i => (
            <div key={i.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center gap-4">
              <Package className="w-5 h-5 text-violet-400" />
              <div className="flex-1">
                <p className="font-medium text-white">{i.nombre}</p>
                <p className="text-xs text-slate-500">{i.unidad} · Costo: ${i.costo_unitario}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${i.stock_actual <= i.stock_minimo && i.stock_minimo > 0 ? 'text-red-400' : 'text-white'}`}>
                  {i.stock_actual} {i.unidad}
                </p>
                {i.stock_minimo > 0 && <p className="text-xs text-slate-500">Min: {i.stock_minimo}</p>}
              </div>
              {i.stock_actual <= i.stock_minimo && i.stock_minimo > 0 && (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
            </div>
          ))}
          {!insumos.length && <p className="text-center text-slate-500 py-12">No hay insumos registrados</p>}
        </div>
      )}
    </div>
  );
}
