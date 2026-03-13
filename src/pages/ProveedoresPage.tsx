/**
 * ProveedoresPage — Supplier management & purchase orders (premium module).
 */
import { useState, useEffect } from 'react';
import {
  Truck, Plus, Search, Loader2, X, FileText, Phone, Mail,
  MapPin, ChevronDown, ChevronUp, Pencil, Trash2,
} from 'lucide-react';

const API = 'http://localhost:8500/api/v2';
const token = () => localStorage.getItem('sgrt_token') || '';
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` });

interface Proveedor {
  id: string;
  cliente_id: string;
  nombre: string;
  cuit: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  rubro: string;
  notas: string;
}

interface OrdenCompra {
  id: string;
  proveedor_id: string;
  proveedor_nombre: string;
  numero: number;
  estado: string;
  total: number;
  notas: string;
  fecha_entrega: string;
  created_at: string;
}

type Tab = 'proveedores' | 'ordenes';

interface Props {
  clienteId?: string;
}

export default function ProveedoresPage({ clienteId }: Props) {
  const [tab, setTab] = useState<Tab>('proveedores');
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({ nombre: '', cuit: '', contacto: '', telefono: '', email: '', direccion: '', rubro: '', notas: '' });
  const [saving, setSaving] = useState(false);

  const cid = clienteId || '';

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [provR, ordR] = await Promise.all([
        fetch(`${API}/proveedores?cliente_id=${cid}`, { headers: headers() }),
        fetch(`${API}/ordenes-compra?cliente_id=${cid}`, { headers: headers() }),
      ]);
      if (provR.ok) setProveedores(await provR.json());
      if (ordR.ok) setOrdenes(await ordR.json());
    } catch {}
    setLoading(false);
  }

  async function createProveedor() {
    if (!form.nombre || !cid) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/proveedores`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ ...form, cliente_id: cid }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ nombre: '', cuit: '', contacto: '', telefono: '', email: '', direccion: '', rubro: '', notas: '' });
        load();
      }
    } catch {}
    setSaving(false);
  }

  async function deleteProveedor(id: string) {
    await fetch(`${API}/proveedores/${id}`, { method: 'DELETE', headers: headers() });
    load();
  }

  const filtered = proveedores.filter(p =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.rubro.toLowerCase().includes(search.toLowerCase())
  );

  const estadoColor = (e: string) => {
    switch (e) {
      case 'borrador': return 'bg-slate-500/20 text-slate-400';
      case 'enviada': return 'bg-blue-500/20 text-blue-400';
      case 'confirmada': return 'bg-emerald-500/20 text-emerald-400';
      case 'recibida': return 'bg-green-500/20 text-green-400';
      case 'cancelada': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="w-7 h-7 text-orange-400" /> Proveedores
          </h1>
          <p className="text-slate-400 text-sm mt-1">Gestión de proveedores y órdenes de compra</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
        {(['proveedores', 'ordenes'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}>
            {t === 'proveedores' ? `Proveedores (${proveedores.length})` : `Órdenes (${ordenes.length})`}
          </button>
        ))}
      </div>

      {/* New proveedor form */}
      {showForm && (
        <div className="bg-slate-800 border border-orange-500/30 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Nuevo Proveedor</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'nombre', label: 'Nombre *', placeholder: 'Razón social' },
              { key: 'cuit', label: 'CUIT', placeholder: '20-12345678-9' },
              { key: 'contacto', label: 'Contacto', placeholder: 'Nombre contacto' },
              { key: 'telefono', label: 'Teléfono', placeholder: '+54 ...' },
              { key: 'email', label: 'Email', placeholder: 'proveedor@email.com' },
              { key: 'rubro', label: 'Rubro', placeholder: 'Materias primas, etc.' },
              { key: 'direccion', label: 'Dirección', placeholder: 'Calle 123' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-slate-400">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm mt-1 placeholder-slate-500" />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-slate-400">Notas</label>
            <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm mt-1 h-20" />
          </div>
          <button onClick={createProveedor} disabled={saving || !form.nombre}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm">
            {saving ? 'Guardando...' : 'Guardar Proveedor'}
          </button>
        </div>
      )}

      {/* Proveedores list */}
      {tab === 'proveedores' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proveedor..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500" />
          </div>
          <div className="space-y-2">
            {filtered.map(p => (
              <div key={p.id} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{p.nombre}</p>
                    <p className="text-xs text-slate-500">{[p.rubro, p.cuit].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    {p.telefono && <Phone className="w-4 h-4" />}
                    {p.email && <Mail className="w-4 h-4" />}
                    {expanded === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
                {expanded === p.id && (
                  <div className="px-4 pb-4 border-t border-slate-700 pt-3 space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      {p.contacto && <div><span className="text-slate-400">Contacto:</span> <span className="text-white">{p.contacto}</span></div>}
                      {p.telefono && <div><span className="text-slate-400">Tel:</span> <span className="text-white">{p.telefono}</span></div>}
                      {p.email && <div><span className="text-slate-400">Email:</span> <span className="text-white">{p.email}</span></div>}
                      {p.direccion && <div><span className="text-slate-400">Dir:</span> <span className="text-white">{p.direccion}</span></div>}
                    </div>
                    {p.notas && <p className="text-sm text-slate-400 italic">{p.notas}</p>}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => deleteProveedor(p.id)}
                        className="px-3 py-1.5 text-red-400 hover:bg-red-500/10 rounded text-xs flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!filtered.length && <p className="text-center text-slate-500 py-12">No hay proveedores registrados</p>}
          </div>
        </div>
      )}

      {/* Ordenes tab */}
      {tab === 'ordenes' && (
        <div className="space-y-2">
          {ordenes.map(o => (
            <div key={o.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center gap-4">
              <FileText className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">OC #{o.numero}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColor(o.estado)}`}>{o.estado}</span>
                </div>
                <p className="text-xs text-slate-500">{o.proveedor_nombre} · {new Date(o.created_at).toLocaleDateString()}</p>
              </div>
              <span className="font-bold text-orange-400">${o.total.toLocaleString()}</span>
            </div>
          ))}
          {!ordenes.length && <p className="text-center text-slate-500 py-12">No hay órdenes de compra</p>}
        </div>
      )}
    </div>
  );
}
