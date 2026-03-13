/**
 * StockPage — Inventory management module (premium).
 *
 * Tabs: Inventario | Movimientos | Dashboard
 * Filtered by client when accessed from client detail, or shows all for admin.
 */
import { useState, useEffect } from 'react';
import {
  Package, Plus, Search, Loader2, ArrowDownCircle, ArrowUpCircle,
  AlertTriangle, ChevronDown, ChevronUp, Pencil, Trash2, X,
  BarChart3, TrendingDown, DollarSign, Boxes,
} from 'lucide-react';

const API = 'http://localhost:8500/api/v2';
const token = () => localStorage.getItem('sgrt_token') || '';
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

interface Producto {
  id: string;
  cliente_id: string;
  nombre: string;
  sku: string;
  categoria: string;
  descripcion: string;
  stock_actual: number;
  stock_minimo: number;
  unidad: string;
  ubicacion: string;
  precio_unitario: number;
}

interface Movimiento {
  id: string;
  producto_id: string;
  producto_nombre?: string;
  producto_sku?: string;
  tipo: string;
  cantidad: number;
  stock_anterior: number;
  stock_posterior: number;
  motivo: string;
  referencia: string;
  usuario_nombre: string;
  created_at: string;
}

interface StockStats {
  total_productos: number;
  bajo_stock: number;
  sin_stock: number;
  valor_inventario: number;
  categorias: { categoria: string; count: number }[];
}

type Tab = 'inventario' | 'movimientos' | 'stats';

interface Props {
  clienteId?: string;
}

export default function StockPage({ clienteId }: Props) {
  const [tab, setTab] = useState<Tab>('inventario');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [stats, setStats] = useState<StockStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showBajoStock, setShowBajoStock] = useState(false);

  // Form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [showMovForm, setShowMovForm] = useState<string | null>(null); // producto_id
  const [movTipo, setMovTipo] = useState<'ingreso' | 'egreso'>('ingreso');

  useEffect(() => { loadAll(); }, [clienteId]);

  const loadAll = async () => {
    setLoading(true);
    const qs = clienteId ? `?cliente_id=${clienteId}` : '';
    try {
      const [prods, movs, st] = await Promise.all([
        fetch(`${API}/stock/productos${qs}`, { headers: headers() }).then(r => r.json()),
        fetch(`${API}/stock/movimientos${qs}&limit=30`.replace('movimientos&', `movimientos${qs ? '&' : '?'}`), { headers: headers() }).then(r => r.json()),
        fetch(`${API}/stock/stats${qs}`, { headers: headers() }).then(r => r.json()),
      ]);
      setProductos(Array.isArray(prods) ? prods : []);
      setMovimientos(Array.isArray(movs) ? movs : []);
      setStats(st);
    } catch {
      setProductos([]);
      setMovimientos([]);
    }
    setLoading(false);
  };

  const filtered = productos.filter(p => {
    if (showBajoStock && (p.stock_actual > p.stock_minimo || p.stock_minimo === 0)) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Package className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Control de Stock</h1>
            <p className="text-xs text-slate-500">Inventario, movimientos, alertas</p>
          </div>
        </div>
        <button
          onClick={() => setShowProductForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="w-4 h-4" /> Producto
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        {([
          { id: 'inventario' as Tab, label: 'Inventario', icon: Package },
          { id: 'movimientos' as Tab, label: 'Movimientos', icon: ArrowDownCircle },
          { id: 'stats' as Tab, label: 'Dashboard', icon: BarChart3 },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 px-1 text-sm font-medium flex items-center gap-2 transition-colors ${
              tab === t.id ? 'text-cyan-600 border-b-2 border-cyan-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* ── Inventario Tab ── */}
          {tab === 'inventario' && (
            <div className="space-y-4">
              {/* Search + Filter */}
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, SKU, categoría..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
                  />
                </div>
                <button
                  onClick={() => setShowBajoStock(!showBajoStock)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    showBajoStock ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Bajo stock {stats?.bajo_stock ? `(${stats.bajo_stock})` : ''}
                </button>
              </div>

              {/* Products list */}
              {filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                  <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">{search || showBajoStock ? 'Sin resultados' : 'Sin productos en inventario'}</p>
                  <button onClick={() => setShowProductForm(true)} className="mt-2 text-xs text-cyan-600 font-semibold">
                    Agregar primer producto
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-4">Producto</div>
                    <div className="col-span-2">Categoría</div>
                    <div className="col-span-2 text-right">Stock</div>
                    <div className="col-span-2 text-right">Valor</div>
                    <div className="col-span-2 text-right">Acciones</div>
                  </div>

                  {filtered.map(p => {
                    const isBajo = p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo;
                    const isCero = p.stock_actual === 0;
                    return (
                      <div key={p.id} className={`grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                        isCero ? 'bg-red-50/30' : isBajo ? 'bg-amber-50/30' : ''
                      }`}>
                        <div className="col-span-4">
                          <p className="text-sm font-medium text-slate-800 truncate">{p.nombre}</p>
                          <p className="text-[11px] text-slate-400">{p.sku || 'Sin SKU'} · {p.ubicacion || 'Sin ubicación'}</p>
                        </div>
                        <div className="col-span-2">
                          {p.categoria ? (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p.categoria}</span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </div>
                        <div className="col-span-2 text-right">
                          <span className={`text-sm font-bold ${
                            isCero ? 'text-red-600' : isBajo ? 'text-amber-600' : 'text-slate-800'
                          }`}>
                            {p.stock_actual}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">{p.unidad}</span>
                          {isBajo && !isCero && (
                            <p className="text-[10px] text-amber-500">Mín: {p.stock_minimo}</p>
                          )}
                          {isCero && (
                            <p className="text-[10px] text-red-500 font-semibold">SIN STOCK</p>
                          )}
                        </div>
                        <div className="col-span-2 text-right">
                          <span className="text-sm text-slate-600">
                            ${(p.stock_actual * p.precio_unitario).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setShowMovForm(p.id); setMovTipo('ingreso'); }}
                            className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Ingreso"
                          >
                            <ArrowDownCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setShowMovForm(p.id); setMovTipo('egreso'); }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Egreso"
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Movimientos Tab ── */}
          {tab === 'movimientos' && (
            <div className="space-y-4">
              {movimientos.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                  <ArrowDownCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Sin movimientos registrados</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {movimientos.map((m, i) => (
                    <div key={m.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-slate-50' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        m.tipo === 'ingreso' ? 'bg-green-50 text-green-500' :
                        m.tipo === 'egreso' ? 'bg-red-50 text-red-500' :
                        'bg-blue-50 text-blue-500'
                      }`}>
                        {m.tipo === 'ingreso' ? <ArrowDownCircle className="w-4 h-4" /> :
                         m.tipo === 'egreso' ? <ArrowUpCircle className="w-4 h-4" /> :
                         <Package className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {m.producto_nombre || 'Producto'}
                          <span className="text-slate-400 font-normal"> · {m.tipo}</span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {m.motivo || 'Sin motivo'}
                          {m.usuario_nombre && ` · ${m.usuario_nombre}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${
                          m.tipo === 'ingreso' ? 'text-green-600' : m.tipo === 'egreso' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {m.tipo === 'ingreso' ? '+' : m.tipo === 'egreso' ? '-' : '='}{m.cantidad}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {m.stock_anterior} → {m.stock_posterior}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-300 flex-shrink-0 w-14 text-right">
                        {new Date(m.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Stats Tab ── */}
          {tab === 'stats' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Boxes} label="Productos" value={stats.total_productos} color="text-cyan-600" bg="bg-cyan-50" />
                <StatCard icon={AlertTriangle} label="Bajo stock" value={stats.bajo_stock} color="text-amber-600" bg="bg-amber-50" />
                <StatCard icon={TrendingDown} label="Sin stock" value={stats.sin_stock} color="text-red-600" bg="bg-red-50" />
                <StatCard icon={DollarSign} label="Valor inv." value={`$${stats.valor_inventario.toLocaleString('es-AR')}`} color="text-green-600" bg="bg-green-50" />
              </div>

              {stats.categorias.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Por categoría</h3>
                  <div className="space-y-2">
                    {stats.categorias.map(cat => (
                      <div key={cat.categoria} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{cat.categoria}</span>
                        <span className="text-sm font-bold text-slate-800">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── New Product Modal ── */}
      {showProductForm && (
        <ProductFormModal
          clienteId={clienteId}
          onClose={() => setShowProductForm(false)}
          onCreated={() => { setShowProductForm(false); loadAll(); }}
        />
      )}

      {/* ── Movement Modal ── */}
      {showMovForm && (
        <MovementModal
          productoId={showMovForm}
          tipo={movTipo}
          onClose={() => setShowMovForm(null)}
          onCreated={() => { setShowMovForm(null); loadAll(); }}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───

function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: any; label: string; value: string | number; color: string; bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
        <Icon className={`w-4.5 h-4.5 ${color}`} />
      </div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
      <p className="text-[11px] text-slate-400 font-medium">{label}</p>
    </div>
  );
}

function ProductFormModal({ clienteId, onClose, onCreated }: { clienteId?: string; onClose: () => void; onCreated: () => void }) {
  const [nombre, setNombre] = useState('');
  const [sku, setSku] = useState('');
  const [categoria, setCategoria] = useState('');
  const [stockInicial, setStockInicial] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('0');
  const [unidad, setUnidad] = useState('unidades');
  const [ubicacion, setUbicacion] = useState('');
  const [precio, setPrecio] = useState('0');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      await fetch(`${API}/stock/productos`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          cliente_id: clienteId || '',
          nombre: nombre.trim(),
          sku: sku.trim(),
          categoria: categoria.trim(),
          stock_actual: parseFloat(stockInicial) || 0,
          stock_minimo: parseFloat(stockMinimo) || 0,
          unidad,
          ubicacion: ubicacion.trim(),
          precio_unitario: parseFloat(precio) || 0,
        }),
      });
      onCreated();
    } catch {
      alert('Error al crear producto');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Nuevo producto</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del producto *" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400" />

        <div className="grid grid-cols-2 gap-3">
          <input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU / Código" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400" />
          <input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Categoría" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Stock inicial</label>
            <input value={stockInicial} onChange={e => setStockInicial(e.target.value)} type="number" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Stock mínimo</label>
            <input value={stockMinimo} onChange={e => setStockMinimo(e.target.value)} type="number" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase">Precio unit.</label>
            <input value={precio} onChange={e => setPrecio(e.target.value)} type="number" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select value={unidad} onChange={e => setUnidad(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20">
            <option value="unidades">Unidades</option>
            <option value="kg">Kilogramos</option>
            <option value="litros">Litros</option>
            <option value="metros">Metros</option>
            <option value="cajas">Cajas</option>
            <option value="pallets">Pallets</option>
          </select>
          <input value={ubicacion} onChange={e => setUbicacion(e.target.value)} placeholder="Ubicación" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!nombre.trim() || saving}
          className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:shadow-md transition-all flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Crear producto
        </button>
      </div>
    </div>
  );
}

function MovementModal({ productoId, tipo, onClose, onCreated }: {
  productoId: string; tipo: 'ingreso' | 'egreso'; onClose: () => void; onCreated: () => void;
}) {
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const qty = parseFloat(cantidad);
    if (!qty || qty <= 0) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API}/stock/movimientos`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          producto_id: productoId,
          tipo,
          cantidad: qty,
          motivo: motivo.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.detail || 'Error');
        setSaving(false);
        return;
      }
      onCreated();
    } catch {
      setError('Error de conexión');
    }
    setSaving(false);
  };

  const isIngreso = tipo === 'ingreso';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-bold ${isIngreso ? 'text-green-700' : 'text-red-700'}`}>
            {isIngreso ? 'Ingreso de stock' : 'Egreso de stock'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-slate-400 uppercase">Cantidad</label>
          <input
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            type="number"
            min="0"
            autoFocus
            placeholder="0"
            className="w-full px-3 py-3 rounded-xl border border-slate-200 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400"
          />
        </div>

        <input
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Motivo (opcional)"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
        />

        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!cantidad || parseFloat(cantidad) <= 0 || saving}
          className={`w-full py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:shadow-md transition-all flex items-center justify-center gap-2 ${
            isIngreso ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'
          }`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isIngreso ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
          {isIngreso ? 'Registrar ingreso' : 'Registrar egreso'}
        </button>
      </div>
    </div>
  );
}
