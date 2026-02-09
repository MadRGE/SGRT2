import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, FileText, ChevronRight, Loader2, Pencil, Save, X, Shield, Trash2 } from 'lucide-react';

interface Props {
  clienteId: string;
  onNavigate: (page: any) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
  cuit: string | null;
  rne: string | null;
  email: string | null;
  telefono: string | null;
  contacto_nombre: string | null;
  origen: string;
  referido_por: string | null;
  notas: string | null;
}

interface Tramite {
  id: string;
  titulo: string;
  estado: string;
  organismo: string | null;
  tipo: string;
  fecha_vencimiento: string | null;
}

interface Registro {
  id: string;
  tipo: string;
  numero: string | null;
  organismo: string | null;
  descripcion: string | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  estado: string;
  notas: string | null;
}

const ESTADO_LABELS: Record<string, string> = {
  consulta: 'Consulta', presupuestado: 'Presupuestado', en_curso: 'En Curso',
  esperando_cliente: 'Esp. Cliente', esperando_organismo: 'Esp. Organismo',
  observado: 'Observado', aprobado: 'Aprobado', rechazado: 'Rechazado', vencido: 'Vencido',
};

const ESTADO_COLORS: Record<string, string> = {
  consulta: 'bg-slate-100 text-slate-600', presupuestado: 'bg-purple-100 text-purple-700',
  en_curso: 'bg-blue-100 text-blue-700', esperando_cliente: 'bg-yellow-100 text-yellow-700',
  esperando_organismo: 'bg-orange-100 text-orange-700', observado: 'bg-red-100 text-red-700',
  aprobado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700', vencido: 'bg-red-100 text-red-700',
};

const REGISTRO_TIPOS = [
  { value: 'RNE', label: 'RNE' },
  { value: 'RNEE', label: 'RNEE' },
  { value: 'habilitacion_anmat', label: 'Habilitación ANMAT' },
  { value: 'habilitacion_senasa', label: 'Habilitación SENASA' },
  { value: 'habilitacion_inal', label: 'Habilitación INAL' },
  { value: 'habilitacion_enacom', label: 'Habilitación ENACOM' },
  { value: 'habilitacion_cites', label: 'Habilitación CITES' },
  { value: 'habilitacion_renpre', label: 'Habilitación RENPRE' },
  { value: 'habilitacion_sedronar', label: 'Habilitación SEDRONAR' },
  { value: 'habilitacion_anmac', label: 'Habilitación ANMAC' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'otro', label: 'Otro' },
];

const REGISTRO_ESTADOS = [
  { value: 'vigente', label: 'Vigente', color: 'bg-green-100 text-green-700' },
  { value: 'en_tramite', label: 'En Trámite', color: 'bg-blue-100 text-blue-700' },
  { value: 'vencido', label: 'Vencido', color: 'bg-red-100 text-red-700' },
  { value: 'suspendido', label: 'Suspendido', color: 'bg-yellow-100 text-yellow-700' },
];

export default function ClienteDetailV2({ clienteId, onNavigate }: Props) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Cliente>>({});
  const [showRegistroForm, setShowRegistroForm] = useState(false);

  useEffect(() => { loadData(); }, [clienteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: c } = await supabase.from('clientes').select('*').eq('id', clienteId).single();
      if (c) { setCliente(c); setEditForm(c); }

      const { data: t } = await supabase
        .from('tramites')
        .select('id, titulo, estado, organismo, tipo, fecha_vencimiento')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      setTramites(t || []);

      const { data: r } = await supabase
        .from('registros_cliente')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('tipo', { ascending: true });
      setRegistros(r || []);
    } catch (e) {
      console.warn('Error:', e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('clientes')
      .update({
        razon_social: editForm.razon_social,
        cuit: editForm.cuit || null,
        rne: editForm.rne || null,
        email: editForm.email || null,
        telefono: editForm.telefono || null,
        contacto_nombre: editForm.contacto_nombre || null,
        notas: editForm.notas || null,
      })
      .eq('id', clienteId);

    if (!error) {
      setEditing(false);
      loadData();
    }
  };

  const handleDeleteRegistro = async (id: string) => {
    if (!confirm('¿Eliminar este registro/habilitación?')) return;
    await supabase.from('registros_cliente').delete().eq('id', id);
    loadData();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!cliente) {
    return <div className="text-center py-20 text-slate-500">Cliente no encontrado</div>;
  }

  const tipoLabel = (tipo: string) => REGISTRO_TIPOS.find(t => t.value === tipo)?.label || tipo;
  const estadoColor = (estado: string) => REGISTRO_ESTADOS.find(e => e.value === estado)?.color || 'bg-slate-100 text-slate-600';
  const estadoLabel = (estado: string) => REGISTRO_ESTADOS.find(e => e.value === estado)?.label || estado;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => onNavigate({ type: 'clientes' })} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Volver a Clientes
      </button>

      {/* Info del cliente */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[26px] tracking-tight font-bold text-slate-800">{cliente.razon_social}</h1>
            <p className="text-sm text-slate-400 mt-0.5">Detalle del cliente</p>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              <Pencil className="w-4 h-4" /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setEditForm(cliente); }} className="flex items-center gap-1 text-sm text-slate-600">
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button onClick={handleSave} className="flex items-center gap-1 text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 rounded-lg hover:shadow-lg hover:shadow-blue-500/25">
                <Save className="w-4 h-4" /> Guardar
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Razón Social</label>
              <input value={editForm.razon_social || ''} onChange={e => setEditForm({...editForm, razon_social: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">CUIT</label>
              <input value={editForm.cuit || ''} onChange={e => setEditForm({...editForm, cuit: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
              <input value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
              <input value={editForm.telefono || ''} onChange={e => setEditForm({...editForm, telefono: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Contacto</label>
              <input value={editForm.contacto_nombre || ''} onChange={e => setEditForm({...editForm, contacto_nombre: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">RNE (legacy)</label>
              <input value={editForm.rne || ''} onChange={e => setEditForm({...editForm, rne: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Notas</label>
              <textarea value={editForm.notas || ''} onChange={e => setEditForm({...editForm, notas: e.target.value})} rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <InfoField label="CUIT" value={cliente.cuit} />
            <InfoField label="Email" value={cliente.email} />
            <InfoField label="Teléfono" value={cliente.telefono} />
            <InfoField label="Contacto" value={cliente.contacto_nombre} />
            <InfoField label="Origen" value={cliente.origen === 'directo' ? 'Directo' : `Referido${cliente.referido_por ? ` por ${cliente.referido_por}` : ''}`} />
            {cliente.notas && <div className="col-span-2"><InfoField label="Notas" value={cliente.notas} /></div>}
          </div>
        )}
      </div>

      {/* Registros y Habilitaciones */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            Registros y Habilitaciones ({registros.length})
          </h2>
          <button
            onClick={() => setShowRegistroForm(true)}
            className="flex items-center gap-1 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {registros.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Sin registros ni habilitaciones</p>
            <button onClick={() => setShowRegistroForm(true)} className="mt-2 text-xs text-blue-600 font-semibold hover:text-blue-700">
              Agregar RNE, RNEE o habilitación
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {registros.map((r) => (
              <div key={r.id} className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {tipoLabel(r.tipo)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estadoColor(r.estado)}`}>
                      {estadoLabel(r.estado)}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    {r.numero && <p className="text-sm font-medium text-slate-800">N° {r.numero}</p>}
                    {r.descripcion && <p className="text-sm text-slate-600">{r.descripcion}</p>}
                    <div className="flex items-center gap-4 mt-1">
                      {r.organismo && <span className="text-xs text-slate-400">Organismo: {r.organismo}</span>}
                      {r.fecha_emision && (
                        <span className="text-xs text-slate-400">
                          Emisión: {new Date(r.fecha_emision).toLocaleDateString('es-AR')}
                        </span>
                      )}
                      {r.fecha_vencimiento && (
                        <span className={`text-xs font-medium ${
                          new Date(r.fecha_vencimiento) < new Date() ? 'text-red-600' : 'text-slate-400'
                        }`}>
                          Vence: {new Date(r.fecha_vencimiento).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </div>
                    {r.notas && <p className="text-xs text-slate-400 mt-1">{r.notas}</p>}
                  </div>
                </div>
                <button onClick={() => handleDeleteRegistro(r.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tramites del cliente */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Trámites ({tramites.length})</h2>
          <button
            onClick={() => onNavigate({ type: 'nuevo-tramite', clienteId })}
            className="flex items-center gap-1 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" /> Nuevo Trámite
          </button>
        </div>

        {tramites.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Este cliente no tiene trámites</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {tramites.map((t) => (
              <button
                key={t.id}
                onClick={() => onNavigate({ type: 'tramite', id: t.id })}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{t.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 capitalize">{t.tipo}</span>
                    {t.organismo && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t.organismo}</span>}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${ESTADO_COLORS[t.estado] || 'bg-slate-100'}`}>
                  {ESTADO_LABELS[t.estado] || t.estado}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal nuevo registro */}
      {showRegistroForm && (
        <NuevoRegistroModal
          clienteId={clienteId}
          onClose={() => setShowRegistroForm(false)}
          onCreated={() => { setShowRegistroForm(false); loadData(); }}
        />
      )}
    </div>
  );
}

function NuevoRegistroModal({ clienteId, onClose, onCreated }: { clienteId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    tipo: 'RNE', numero: '', organismo: '', descripcion: '',
    fecha_emision: '', fecha_vencimiento: '', estado: 'vigente', notas: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('registros_cliente').insert({
      cliente_id: clienteId,
      tipo: form.tipo,
      numero: form.numero || null,
      organismo: form.organismo || null,
      descripcion: form.descripcion || null,
      fecha_emision: form.fecha_emision || null,
      fecha_vencimiento: form.fecha_vencimiento || null,
      estado: form.estado,
      notas: form.notas || null,
    });
    if (!error) onCreated();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Nuevo Registro / Habilitación</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
              <select required value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                {REGISTRO_TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                {REGISTRO_ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
              <input value={form.numero} onChange={e => setForm({...form, numero: e.target.value})}
                placeholder="N° de registro"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organismo</label>
              <input value={form.organismo} onChange={e => setForm({...form, organismo: e.target.value})}
                placeholder="Ej: ANMAT, SENASA..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <input value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
              placeholder="Ej: Habilitación para importar cosméticos"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Emisión</label>
              <input type="date" value={form.fecha_emision} onChange={e => setForm({...form, fecha_emision: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento</label>
              <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({...form, fecha_vencimiento: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} rows={2}
              placeholder="Observaciones adicionales..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="text-sm text-slate-700">{value || '—'}</p>
    </div>
  );
}
