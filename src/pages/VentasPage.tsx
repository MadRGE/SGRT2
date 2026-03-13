/**
 * VentasPage — POS & sales management (premium module).
 */
import { useState, useEffect } from 'react';
import {
  ShoppingCart, Plus, Search, Loader2, X, DollarSign,
  CreditCard, Banknote, QrCode, TrendingUp, Hash, Ban,
} from 'lucide-react';
import type { Page } from '../components/Layout/Layout';

const API = 'http://localhost:8500/api/v2';
const token = () => localStorage.getItem('sgrt_token') || '';
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

interface Venta {
  id: string;
  numero: number;
  cliente_id: string;
  total: number;
  descuento: number;
  metodo_pago: string;
  estado: string;
  vendedor_nombre: string;
  notas: string;
  created_at: string;
  items?: VentaItem[];
}

interface VentaItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Producto {
  id: string;
  nombre: string;
  precio_unitario: number;
  stock_actual: number;
  sku: string;
}

interface Stats {
  total_ventas: number;
  monto_total: number;
  ventas_hoy: number;
  monto_hoy: number;
  metodos_pago: { metodo_pago: string; count: number; monto: number }[];
}

type Tab = 'pos' | 'historial' | 'stats';

interface Props {
  clienteId?: string;
  onNavigate: (p: Page) => void;
}

export default function VentasPage({ clienteId }: Props) {
  const [tab, setTab] = useState<Tab>('pos');
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // POS state
  const [cart, setCart] = useState<{ producto: Producto; cantidad: number }[]>([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [descuento, setDescuento] = useState(0);
  const [saving, setSaving] = useState(false);

  const cid = clienteId || '';

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [ventasR, productosR] = await Promise.all([
        fetch(`${API}/ventas?cliente_id=${cid}&limit=100`, { headers: headers() }),
        fetch(`${API}/stock/productos?cliente_id=${cid}`, { headers: headers() }),
      ]);
      if (ventasR.ok) setVentas(await ventasR.json());
      if (productosR.ok) setProductos(await productosR.json());

      if (cid) {
        const statsR = await fetch(`${API}/ventas/stats/${cid}`, { headers: headers() });
        if (statsR.ok) setStats(await statsR.json());
      }
    } catch {}
    setLoading(false);
  }

  function addToCart(p: Producto) {
    setCart(prev => {
      const existing = prev.find(c => c.producto.id === p.id);
      if (existing) return prev.map(c => c.producto.id === p.id ? { ...c, cantidad: c.cantidad + 1 } : c);
      return [...prev, { producto: p, cantidad: 1 }];
    });
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCart(prev => prev.filter(c => c.producto.id !== productId));
    } else {
      setCart(prev => prev.map(c => c.producto.id === productId ? { ...c, cantidad: qty } : c));
    }
  }

  const subtotal = cart.reduce((s, c) => s + c.producto.precio_unitario * c.cantidad, 0);
  const total = subtotal - descuento;

  async function completarVenta() {
    if (!cart.length || !cid) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/ventas`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          cliente_id: cid,
          metodo_pago: metodoPago,
          descuento,
          items: cart.map(c => ({
            producto_id: c.producto.id,
            descripcion: c.producto.nombre,
            cantidad: c.cantidad,
            precio_unitario: c.producto.precio_unitario,
          })),
        }),
      });
      if (res.ok) {
        setCart([]);
        setDescuento(0);
        load();
      }
    } catch {}
    setSaving(false);
  }

  async function cancelarVenta(id: string) {
    await fetch(`${API}/ventas/${id}/cancelar`, { method: 'PUT', headers: headers() });
    load();
  }

  const filteredProductos = productos.filter(p =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const metodoPagoIcon = (m: string) => {
    switch (m) {
      case 'efectivo': return <Banknote className="w-4 h-4" />;
      case 'debito': case 'credito': return <CreditCard className="w-4 h-4" />;
      case 'transferencia': return <DollarSign className="w-4 h-4" />;
      case 'qr': return <QrCode className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-emerald-400" /> Ventas / POS
          </h1>
          <p className="text-slate-400 text-sm mt-1">Punto de venta y registro de operaciones</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {(['pos', 'historial', 'stats'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}>
            {t === 'pos' ? 'Punto de Venta' : t === 'historial' ? 'Historial' : 'Estadísticas'}
          </button>
        ))}
      </div>

      {/* POS Tab */}
      {tab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product catalog */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar producto por nombre o SKU..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProductos.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-left hover:border-emerald-500 transition-all group">
                  <p className="font-medium text-white text-sm truncate">{p.nombre}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.sku || 'Sin SKU'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-emerald-400 font-bold">${p.precio_unitario.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">Stock: {p.stock_actual}</span>
                  </div>
                </button>
              ))}
              {!filteredProductos.length && (
                <p className="col-span-full text-center text-slate-500 py-8">No hay productos disponibles</p>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4 h-fit sticky top-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> Carrito
              {cart.length > 0 && <span className="bg-emerald-600 text-xs px-2 py-0.5 rounded-full">{cart.length}</span>}
            </h3>

            {!cart.length ? (
              <p className="text-slate-500 text-sm py-6 text-center">Agregá productos tocando las tarjetas</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map(c => (
                  <div key={c.producto.id} className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{c.producto.nombre}</p>
                      <p className="text-xs text-slate-400">${c.producto.precio_unitario.toLocaleString()} c/u</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(c.producto.id, c.cantidad - 1)}
                        className="w-6 h-6 rounded bg-slate-600 text-white text-sm hover:bg-slate-500">−</button>
                      <span className="w-8 text-center text-white text-sm">{c.cantidad}</span>
                      <button onClick={() => updateQty(c.producto.id, c.cantidad + 1)}
                        className="w-6 h-6 rounded bg-slate-600 text-white text-sm hover:bg-slate-500">+</button>
                    </div>
                    <span className="text-emerald-400 font-medium text-sm w-20 text-right">
                      ${(c.producto.precio_unitario * c.cantidad).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Payment method */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Método de pago</label>
              <div className="grid grid-cols-3 gap-1">
                {['efectivo', 'debito', 'credito', 'transferencia', 'qr'].map(m => (
                  <button key={m} onClick={() => setMetodoPago(m)}
                    className={`px-2 py-1.5 rounded text-xs font-medium flex items-center gap-1 justify-center transition-all ${
                      metodoPago === m ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}>
                    {metodoPagoIcon(m)} {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Descuento ($)</label>
              <input type="number" value={descuento} onChange={e => setDescuento(+e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm" />
            </div>

            {/* Totals */}
            <div className="border-t border-slate-600 pt-3 space-y-1">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span><span>${subtotal.toLocaleString()}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm text-amber-400">
                  <span>Descuento</span><span>-${descuento.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-white">
                <span>Total</span><span className="text-emerald-400">${total.toLocaleString()}</span>
              </div>
            </div>

            <button onClick={completarVenta} disabled={!cart.length || saving}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-5 h-5" />}
              Completar Venta
            </button>
          </div>
        </div>
      )}

      {/* Historial Tab */}
      {tab === 'historial' && (
        <div className="space-y-3">
          {ventas.map(v => (
            <div key={v.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <Hash className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">Venta #{v.numero}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    v.estado === 'completada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>{v.estado}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(v.created_at).toLocaleString()} · {v.vendedor_nombre} · {v.metodo_pago}
                </p>
              </div>
              <span className="text-lg font-bold text-emerald-400">${v.total.toLocaleString()}</span>
              {v.estado === 'completada' && (
                <button onClick={() => cancelarVenta(v.id)}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors" title="Cancelar">
                  <Ban className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {!ventas.length && <p className="text-center text-slate-500 py-12">No hay ventas registradas</p>}
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400">Ventas Totales</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.total_ventas}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400">Monto Total</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">${stats.monto_total.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400">Ventas Hoy</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.ventas_hoy}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-xs text-slate-400">Monto Hoy</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">${stats.monto_hoy.toLocaleString()}</p>
          </div>

          {stats.metodos_pago.length > 0 && (
            <div className="col-span-full bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="font-medium text-white mb-3">Métodos de Pago</h3>
              <div className="space-y-2">
                {stats.metodos_pago.map(m => (
                  <div key={m.metodo_pago} className="flex items-center gap-3">
                    {metodoPagoIcon(m.metodo_pago)}
                    <span className="text-sm text-slate-300 capitalize flex-1">{m.metodo_pago}</span>
                    <span className="text-sm text-slate-400">{m.count} ventas</span>
                    <span className="text-sm font-medium text-emerald-400">${m.monto.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
