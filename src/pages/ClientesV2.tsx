import { useState, useEffect } from 'react';
import { supabase, filterActive } from '../lib/supabase';
import { PROVINCIAS } from '../lib/constants/enums';
import { Plus, Search, Users, ChevronRight, Loader2, X, Shield, AlertTriangle } from 'lucide-react';

interface Props {
  onNavigate: (page: any) => void;
  autoOpen?: boolean;
}

interface Cliente {
  id: string;
  razon_social: string;
  cuit: string | null;
  rne: string | null;
  email: string | null;
  telefono: string | null;
  origen: string;
  tramites_count?: number;
  registros_count?: number;
}

export default function ClientesV2({ onNavigate, autoOpen }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(!!autoOpen);

  useEffect(() => { loadClientes(); }, []);

  const loadClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await filterActive(supabase
        .from('clientes')
        .select('*'))
        .order('razon_social');

      if (data) {
        const withCounts = await Promise.all(
          data.map(async (c: any) => {
            const { count: tramites_count } = await supabase
              .from('tramites')
              .select('*', { count: 'exact', head: true })
              .eq('cliente_id', c.id);
            const { count: registros_count } = await supabase
              .from('registros_cliente')
              .select('*', { count: 'exact', head: true })
              .eq('cliente_id', c.id);
            return { ...c, tramites_count: tramites_count || 0, registros_count: registros_count || 0 };
          })
        );
        setClientes(withCounts);
      }
    } catch (e) {
      console.warn('Error cargando clientes:', e);
      setError('Error al cargar datos. Verifique su conexión.');
    }
    setLoading(false);
  };

  const filtered = search.trim()
    ? clientes.filter(c =>
        c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
        c.cuit?.includes(search) ||
        c.rne?.toLowerCase().includes(search.toLowerCase())
      )
    : clientes;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-slate-600 mb-4">{error}</p>
        <button onClick={loadClientes} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-[26px] tracking-tight font-bold text-slate-800">Clientes</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">Gestiona tu cartera de clientes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por razón social, CUIT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">{search ? 'No se encontraron clientes' : 'No hay clientes cargados'}</p>
          {!search && (
            <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
              Cargar primer cliente
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 divide-y divide-slate-100/80">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onNavigate({ type: 'cliente', id: c.id })}
              className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-sm">{c.razon_social.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{c.razon_social}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {c.cuit && <span className="text-xs text-slate-500">CUIT: {c.cuit}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 sm:hidden" />
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 pl-[52px] sm:pl-0">
                {(c.registros_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-xs">
                    <Shield className="w-3 h-3" /> {c.registros_count}
                  </span>
                )}
                <span className="text-xs sm:text-sm">{c.tramites_count} trámites</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Modal nuevo cliente */}
      {showForm && (
        <NuevoClienteModal
          onClose={() => setShowForm(false)}
          onCreated={(id) => {
            setShowForm(false);
            onNavigate({ type: 'cliente', id });
          }}
        />
      )}
    </div>
  );
}

function NuevoClienteModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({
    razon_social: '', cuit: '', email: '', telefono: '',
    contacto_nombre: '', direccion: '', localidad: '', provincia: '',
    origen: 'directo', referido_por: '', notas: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputClass = 'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload: Record<string, any> = {
      razon_social: form.razon_social,
      cuit: form.cuit || null,
      email: form.email || null,
      telefono: form.telefono || null,
    };
    // Only include extra fields if they have values (avoids schema cache errors if migration not run)
    if (form.contacto_nombre) payload.contacto_nombre = form.contacto_nombre;
    if (form.direccion) payload.direccion = form.direccion;
    if (form.localidad) payload.localidad = form.localidad;
    if (form.provincia) payload.provincia = form.provincia;
    if (form.origen !== 'directo') payload.origen = form.origen;
    if (form.referido_por) payload.referido_por = form.referido_por;
    if (form.notas) payload.notas = form.notas;

    const { data, error: insertError } = await supabase
      .from('clientes')
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      // If error is about missing column, retry with only basic fields
      if (insertError.message?.includes('schema cache')) {
        const { data: d2, error: e2 } = await supabase
          .from('clientes')
          .insert({
            razon_social: form.razon_social,
            cuit: form.cuit || null,
            email: form.email || null,
            telefono: form.telefono || null,
          })
          .select()
          .single();
        if (e2) {
          setError(e2.message);
          setSaving(false);
          return;
        }
        if (d2) { onCreated(d2.id); }
        setSaving(false);
        return;
      }
      setError(insertError.message || 'Error al crear el cliente');
      setSaving(false);
      return;
    }

    if (data) {
      onCreated(data.id);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">Nuevo Cliente</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Razón Social *</label>
            <input required value={form.razon_social} onChange={e => setForm({...form, razon_social: e.target.value})}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CUIT</label>
            <input value={form.cuit} onChange={e => setForm({...form, cuit: e.target.value})} placeholder="30-12345678-9"
              className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contacto</label>
              <input value={form.contacto_nombre} onChange={e => setForm({...form, contacto_nombre: e.target.value})} placeholder="Nombre del contacto"
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} placeholder="Calle y número"
              className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Localidad</label>
              <input value={form.localidad} onChange={e => setForm({...form, localidad: e.target.value})}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Provincia</label>
              <select value={form.provincia} onChange={e => setForm({...form, provincia: e.target.value})}
                className={inputClass}>
                <option value="">Seleccionar...</option>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Origen</label>
              <select value={form.origen} onChange={e => setForm({...form, origen: e.target.value})}
                className={inputClass}>
                <option value="directo">Directo</option>
                <option value="referido_cliente">Referido por cliente</option>
                <option value="referido_despachante">Referido por despachante</option>
              </select>
            </div>
            {form.origen !== 'directo' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Referido por</label>
                <input value={form.referido_por} onChange={e => setForm({...form, referido_por: e.target.value})}
                  className={inputClass} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} rows={2}
              placeholder="Observaciones generales..."
              className={inputClass} />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
