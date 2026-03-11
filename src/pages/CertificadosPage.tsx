import { useState, useEffect } from 'react';
import { Award, Package, FileText, QrCode, Plus, Search, Eye, Edit2, Trash2, X, Check, AlertTriangle, Clock, RefreshCw, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// ─── Types ───

interface Producto {
  id: string;
  uuid: string;
  cliente_id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  pais_origen: string | null;
  ncm: string | null;
  tipo_producto: string | null;
  activo: boolean;
  created_at: string;
}

interface Certificado {
  id: string;
  producto_id: string;
  cliente_id: string;
  organismo: string;
  tipo: string;
  titulo: string;
  referencia: string | null;
  estado: string;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  resolucion: string | null;
  requiere_qr: boolean;
  created_at: string;
  productos_certificados?: { nombre: string; codigo: string };
}

interface DJC {
  id: string;
  producto_id: string;
  cliente_id: string;
  resolucion: string | null;
  estado: string;
  representante: string | null;
  representante_cuit: string | null;
  notas: string | null;
  created_at: string;
  productos_certificados?: { nombre: string; codigo: string };
}

interface QRAcceso {
  id: string;
  producto_id: string;
  ip: string | null;
  user_agent: string | null;
  accion: string;
  created_at: string;
  productos_certificados?: { nombre: string; codigo: string; uuid: string };
}

// ─── Constants ───

const ORGANISMOS = ['ANMAT', 'SENASA', 'INAL', 'ARCA', 'INPI', 'Otro'];
const TIPOS_CERT = ['registro', 'habilitacion', 'certificado', 'permiso', 'inscripcion', 'libre_venta'];
const ESTADOS_CERT = ['vigente', 'vencido', 'cancelado', 'suspendido', 'en_renovacion'];
const ESTADOS_DJC = ['borrador', 'generada', 'pendiente_firma', 'firmada'];

const ESTADO_COLORS: Record<string, string> = {
  vigente: 'bg-green-100 text-green-700',
  vencido: 'bg-red-100 text-red-700',
  cancelado: 'bg-slate-100 text-slate-600',
  suspendido: 'bg-amber-100 text-amber-700',
  en_renovacion: 'bg-blue-100 text-blue-700',
  borrador: 'bg-slate-100 text-slate-600',
  generada: 'bg-blue-100 text-blue-700',
  pendiente_firma: 'bg-amber-100 text-amber-700',
  firmada: 'bg-green-100 text-green-700',
};

type Tab = 'productos' | 'certificados' | 'djc' | 'qr';

interface Props {
  clienteId?: string;
  onBack?: () => void;
}

// ─── Component ───

export default function CertificadosPage({ clienteId }: Props) {
  const { user, userRole } = useAuth();
  const [tab, setTab] = useState<Tab>('productos');
  const [search, setSearch] = useState('');

  // Data
  const [productos, setProductos] = useState<Producto[]>([]);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [djcs, setDjcs] = useState<DJC[]>([]);
  const [accesos, setAccesos] = useState<QRAcceso[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showProductoForm, setShowProductoForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  const [showDjcForm, setShowDjcForm] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);

  // Determine effective client filter
  const isGestor = userRole === 'admin' || userRole === 'gestor';
  const effectiveClienteId = isGestor ? clienteId : undefined; // gestors see all unless filtered

  useEffect(() => {
    loadData();
    if (isGestor) loadClientes();
  }, [tab, effectiveClienteId]);

  async function loadClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre')
      .is('deleted_at', null)
      .order('nombre');
    if (data) setClientes(data);
  }

  async function loadData() {
    setLoading(true);
    try {
      if (tab === 'productos' || tab === 'qr') {
        let q = supabase.from('productos_certificados').select('*').eq('activo', true).order('created_at', { ascending: false });
        if (effectiveClienteId) q = q.eq('cliente_id', effectiveClienteId);
        const { data } = await q;
        setProductos(data || []);
      }
      if (tab === 'certificados') {
        let q = supabase.from('certificados').select('*, productos_certificados(nombre, codigo)').order('created_at', { ascending: false });
        if (effectiveClienteId) q = q.eq('cliente_id', effectiveClienteId);
        const { data } = await q;
        setCertificados(data || []);
      }
      if (tab === 'djc') {
        let q = supabase.from('djcs').select('*, productos_certificados(nombre, codigo)').order('created_at', { ascending: false });
        if (effectiveClienteId) q = q.eq('cliente_id', effectiveClienteId);
        const { data } = await q;
        setDjcs(data || []);
      }
      if (tab === 'qr') {
        let q = supabase.from('qr_accesos').select('*, productos_certificados(nombre, codigo, uuid)').order('created_at', { ascending: false }).limit(50);
        const { data } = await q;
        setAccesos(data || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setLoading(false);
  }

  // ─── Filtered data ───
  const filteredProductos = productos.filter(p =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCerts = certificados.filter(c =>
    !search || c.titulo.toLowerCase().includes(search.toLowerCase()) || c.organismo.toLowerCase().includes(search.toLowerCase())
  );
  const filteredDjcs = djcs.filter(d =>
    !search || (d.productos_certificados?.nombre || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Certificados & QR</h1>
          <p className="text-sm text-slate-500">Productos, certificados, DJC y Product Passport</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {([
            { id: 'productos' as Tab, label: 'Productos', icon: Package, count: productos.length },
            { id: 'certificados' as Tab, label: 'Certificados', icon: FileText, count: certificados.length },
            { id: 'djc' as Tab, label: 'DJC', icon: FileText, count: djcs.length },
            { id: 'qr' as Tab, label: 'QR & Passport', icon: QrCode, count: accesos.length },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-amber-500 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search + Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
          />
        </div>
        {tab === 'productos' && (
          <button onClick={() => { setEditingProducto(null); setShowProductoForm(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        )}
        {tab === 'certificados' && (
          <button onClick={() => setShowCertForm(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Nuevo Certificado
          </button>
        )}
        {tab === 'djc' && (
          <button onClick={() => setShowDjcForm(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Nueva DJC
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'productos' && <ProductosTab productos={filteredProductos} clientes={clientes} onEdit={p => { setEditingProducto(p); setShowProductoForm(true); }} onRefresh={loadData} />}
          {tab === 'certificados' && <CertificadosTab certificados={filteredCerts} />}
          {tab === 'djc' && <DJCTab djcs={filteredDjcs} onRefresh={loadData} />}
          {tab === 'qr' && <QRTab productos={productos} accesos={accesos} />}
        </>
      )}

      {/* Forms */}
      {showProductoForm && (
        <ProductoForm
          producto={editingProducto}
          clientes={clientes}
          defaultClienteId={effectiveClienteId}
          isGestor={isGestor}
          onClose={() => setShowProductoForm(false)}
          onSaved={() => { setShowProductoForm(false); loadData(); }}
        />
      )}
      {showCertForm && (
        <CertificadoForm
          productos={productos}
          clientes={clientes}
          defaultClienteId={effectiveClienteId}
          isGestor={isGestor}
          onClose={() => setShowCertForm(false)}
          onSaved={() => { setShowCertForm(false); loadData(); }}
        />
      )}
      {showDjcForm && (
        <DJCForm
          productos={productos}
          clientes={clientes}
          defaultClienteId={effectiveClienteId}
          isGestor={isGestor}
          onClose={() => setShowDjcForm(false)}
          onSaved={() => { setShowDjcForm(false); loadData(); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Tab components
// ═══════════════════════════════════════════════

function ProductosTab({ productos, clientes, onEdit, onRefresh }: { productos: Producto[]; clientes: { id: string; nombre: string }[]; onEdit: (p: Producto) => void; onRefresh: () => void }) {
  const clienteMap = Object.fromEntries(clientes.map(c => [c.id, c.nombre]));

  async function handleDelete(id: string) {
    if (!confirm('¿Desactivar este producto?')) return;
    const { error } = await supabase.from('productos_certificados').update({ activo: false }).eq('id', id);
    if (error) toast.error('Error al desactivar');
    else { toast.success('Producto desactivado'); onRefresh(); }
  }

  if (productos.length === 0) return <EmptyState message="No hay productos registrados" />;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Producto</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Marca</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Cliente</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">NCM</th>
            <th className="text-right px-4 py-3 font-medium text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {productos.map(p => (
            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.codigo}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{p.nombre}</td>
              <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{p.marca || '—'}</td>
              <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{clienteMap[p.cliente_id] || '—'}</td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500 hidden lg:table-cell">{p.ncm || '—'}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Desactivar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <a
                    href={`/passport/${p.uuid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                    title="Ver Passport"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CertificadosTab({ certificados }: { certificados: Certificado[] }) {
  if (certificados.length === 0) return <EmptyState message="No hay certificados registrados" />;

  return (
    <div className="grid gap-3">
      {certificados.map(c => (
        <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[c.estado] || 'bg-slate-100 text-slate-600'}`}>
                  {c.estado.replace('_', ' ')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{c.organismo}</span>
                <span className="text-xs text-slate-400">{c.tipo}</span>
              </div>
              <h3 className="font-semibold text-slate-900 truncate">{c.titulo}</h3>
              {c.productos_certificados && (
                <p className="text-xs text-slate-500 mt-0.5">Producto: {c.productos_certificados.nombre} ({c.productos_certificados.codigo})</p>
              )}
              {c.referencia && <p className="text-xs text-slate-400 mt-0.5">Ref: {c.referencia}</p>}
            </div>
            <div className="text-right text-xs text-slate-400 whitespace-nowrap">
              {c.fecha_emision && <p>Emisión: {new Date(c.fecha_emision).toLocaleDateString('es-AR')}</p>}
              {c.fecha_vencimiento && (
                <p className={new Date(c.fecha_vencimiento) < new Date() ? 'text-red-500 font-medium' : ''}>
                  Vence: {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DJCTab({ djcs, onRefresh }: { djcs: DJC[]; onRefresh: () => void }) {
  async function advanceStatus(djc: DJC) {
    const flow: Record<string, string> = { borrador: 'generada', generada: 'pendiente_firma', pendiente_firma: 'firmada' };
    const next = flow[djc.estado];
    if (!next) return;
    const { error } = await supabase.from('djcs').update({
      estado: next,
      ...(next === 'firmada' ? { firmado_at: new Date().toISOString() } : {}),
    }).eq('id', djc.id);
    if (error) toast.error('Error al avanzar estado');
    else { toast.success(`DJC → ${next.replace('_', ' ')}`); onRefresh(); }
  }

  if (djcs.length === 0) return <EmptyState message="No hay DJC registradas" />;

  return (
    <div className="grid gap-3">
      {djcs.map(d => (
        <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[d.estado] || 'bg-slate-100 text-slate-600'}`}>
                  {d.estado.replace('_', ' ')}
                </span>
                {d.resolucion && <span className="text-xs text-slate-400">Res. {d.resolucion}</span>}
              </div>
              {d.productos_certificados && (
                <h3 className="font-semibold text-slate-900">{d.productos_certificados.nombre} ({d.productos_certificados.codigo})</h3>
              )}
              {d.representante && <p className="text-xs text-slate-500 mt-0.5">Representante: {d.representante}</p>}
            </div>
            <div className="flex items-center gap-2">
              {d.estado !== 'firmada' && (
                <button
                  onClick={() => advanceStatus(d)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Avanzar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function QRTab({ productos, accesos }: { productos: Producto[]; accesos: QRAcceso[] }) {
  const baseUrl = window.location.origin;

  return (
    <div className="space-y-6">
      {/* QR Links per product */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Links QR por Producto</h3>
        {productos.length === 0 ? (
          <EmptyState message="Registrá un producto primero para generar su QR" />
        ) : (
          <div className="grid gap-2">
            {productos.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{p.nombre}</p>
                  <p className="text-xs text-slate-400 font-mono">{p.codigo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded hidden sm:block">
                    {baseUrl}/qr/{p.uuid}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${baseUrl}/qr/${p.uuid}`); toast.success('Link copiado'); }}
                    className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    Copiar QR
                  </button>
                  <a
                    href={`/passport/${p.uuid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Ver Passport
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Access log */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Últimos accesos QR</h3>
        {accesos.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">Sin accesos registrados</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600">Fecha</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600">Producto</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600 hidden md:table-cell">IP</th>
                  <th className="text-left px-4 py-2.5 font-medium text-slate-600">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accesos.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{new Date(a.created_at).toLocaleString('es-AR')}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{a.productos_certificados?.nombre || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-xs hidden md:table-cell">{a.ip || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{a.accion}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Forms
// ═══════════════════════════════════════════════

function ProductoForm({ producto, clientes, defaultClienteId, isGestor, onClose, onSaved }: {
  producto: Producto | null;
  clientes: { id: string; nombre: string }[];
  defaultClienteId?: string;
  isGestor: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    cliente_id: producto?.cliente_id || defaultClienteId || '',
    codigo: producto?.codigo || '',
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    marca: producto?.marca || '',
    pais_origen: producto?.pais_origen || '',
    ncm: producto?.ncm || '',
    tipo_producto: producto?.tipo_producto || '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id || !form.codigo || !form.nombre) { toast.error('Completá los campos requeridos'); return; }
    setSaving(true);
    try {
      if (producto) {
        const { error } = await supabase.from('productos_certificados').update({ ...form, updated_at: new Date().toISOString() }).eq('id', producto.id);
        if (error) throw error;
        toast.success('Producto actualizado');
      } else {
        const { error } = await supabase.from('productos_certificados').insert(form);
        if (error) throw error;
        toast.success('Producto creado');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
    setSaving(false);
  }

  return (
    <Modal title={producto ? 'Editar Producto' : 'Nuevo Producto'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isGestor && (
          <Field label="Cliente *">
            <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" required>
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Código *">
            <input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" required />
          </Field>
          <Field label="Nombre *">
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" required />
          </Field>
        </div>
        <Field label="Descripción">
          <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" rows={2} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Marca">
            <input value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
          </Field>
          <Field label="País de origen">
            <input value={form.pais_origen} onChange={e => setForm({ ...form, pais_origen: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="NCM">
            <input value={form.ncm} onChange={e => setForm({ ...form, ncm: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" placeholder="0000.00.00" />
          </Field>
          <Field label="Tipo de producto">
            <input value={form.tipo_producto} onChange={e => setForm({ ...form, tipo_producto: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" placeholder="alimento, cosmético, etc." />
          </Field>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50">
            {saving ? 'Guardando...' : producto ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CertificadoForm({ productos, clientes, defaultClienteId, isGestor, onClose, onSaved }: {
  productos: Producto[];
  clientes: { id: string; nombre: string }[];
  defaultClienteId?: string;
  isGestor: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    cliente_id: defaultClienteId || '',
    producto_id: '',
    organismo: 'ANMAT',
    tipo: 'registro',
    titulo: '',
    referencia: '',
    estado: 'vigente',
    fecha_emision: '',
    fecha_vencimiento: '',
    notas: '',
    resolucion: '',
    requiere_qr: false,
  });
  const [saving, setSaving] = useState(false);

  const filteredProducts = form.cliente_id ? productos.filter(p => p.cliente_id === form.cliente_id) : productos;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.producto_id || !form.titulo) { toast.error('Completá los campos requeridos'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('certificados').insert({
        ...form,
        fecha_emision: form.fecha_emision || null,
        fecha_vencimiento: form.fecha_vencimiento || null,
      });
      if (error) throw error;
      toast.success('Certificado creado');
      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
    setSaving(false);
  }

  return (
    <Modal title="Nuevo Certificado" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isGestor && (
          <Field label="Cliente *">
            <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value, producto_id: '' })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" required>
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Field>
        )}
        <Field label="Producto *">
          <select value={form.producto_id} onChange={e => setForm({ ...form, producto_id: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" required>
            <option value="">Seleccionar producto</option>
            {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Organismo *">
            <select value={form.organismo} onChange={e => setForm({ ...form, organismo: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none">
              {ORGANISMOS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Tipo *">
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none">
              {TIPOS_CERT.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Título *">
          <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Referencia">
            <input value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
          </Field>
          <Field label="Resolución">
            <input value={form.resolucion} onChange={e => setForm({ ...form, resolucion: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha emisión">
            <input type="date" value={form.fecha_emision} onChange={e => setForm({ ...form, fecha_emision: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
          </Field>
          <Field label="Fecha vencimiento">
            <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
          </Field>
        </div>
        <Field label="Estado">
          <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none">
            {ESTADOS_CERT.map(e => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.requiere_qr} onChange={e => setForm({ ...form, requiere_qr: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
          Requiere QR (Res. 237)
        </label>
        <Field label="Notas">
          <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" rows={2} />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50">
            {saving ? 'Guardando...' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DJCForm({ productos, clientes, defaultClienteId, isGestor, onClose, onSaved }: {
  productos: Producto[];
  clientes: { id: string; nombre: string }[];
  defaultClienteId?: string;
  isGestor: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    cliente_id: defaultClienteId || '',
    producto_id: '',
    resolucion: '',
    representante: '',
    representante_cuit: '',
    notas: '',
  });
  const [saving, setSaving] = useState(false);

  const filteredProducts = form.cliente_id ? productos.filter(p => p.cliente_id === form.cliente_id) : productos;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.producto_id) { toast.error('Seleccioná un producto'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('djcs').insert(form);
      if (error) throw error;
      toast.success('DJC creada');
      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
    setSaving(false);
  }

  return (
    <Modal title="Nueva Declaración Jurada de Composición" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isGestor && (
          <Field label="Cliente *">
            <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value, producto_id: '' })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" required>
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Field>
        )}
        <Field label="Producto *">
          <select value={form.producto_id} onChange={e => setForm({ ...form, producto_id: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" required>
            <option value="">Seleccionar producto</option>
            {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.codigo})</option>)}
          </select>
        </Field>
        <Field label="Resolución">
          <input value={form.resolucion} onChange={e => setForm({ ...form, resolucion: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" placeholder="Ej: 237/2024" />
        </Field>
        <Field label="Representante">
          <input value={form.representante} onChange={e => setForm({ ...form, representante: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" />
        </Field>
        <Field label="CUIT Representante">
          <input value={form.representante_cuit} onChange={e => setForm({ ...form, representante_cuit: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" placeholder="XX-XXXXXXXX-X" />
        </Field>
        <Field label="Notas">
          <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none" rows={2} />
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50">
            {saving ? 'Guardando...' : 'Crear DJC'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════
// Shared UI
// ═══════════════════════════════════════════════

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
