import { useState, useEffect } from 'react';
import { supabase, softDelete } from '../lib/supabase';
import { ArrowLeft, Plus, FileText, ChevronRight, Loader2, Pencil, Save, X, Shield, Trash2, Briefcase, FolderOpen, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';

interface Props {
  clienteId: string;
  onNavigate: (page: any) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
  cuit: string | null;
  email: string | null;
  telefono: string | null;
  contacto_nombre: string | null;
  origen: string;
  referido_por: string | null;
  notas: string | null;
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

interface TramiteResumen {
  estado: string;
}

interface Gestion {
  id: string;
  nombre: string;
  estado: string;
  prioridad: string;
  fecha_inicio: string | null;
  tramites: TramiteResumen[];
}

interface TramiteSuelto {
  id: string;
  titulo: string;
  estado: string;
  organismo: string | null;
  tipo: string;
  fecha_vencimiento: string | null;
}

interface DocumentoCliente {
  id: string;
  nombre: string;
  categoria: string;
  estado: string;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  created_at: string;
}

const TRAMITE_ESTADO_LABELS: Record<string, string> = {
  consulta: 'Consulta', presupuestado: 'Presupuestado', en_curso: 'En Curso',
  esperando_cliente: 'Esp. Cliente', esperando_organismo: 'Esp. Organismo',
  observado: 'Observado', aprobado: 'Aprobado', rechazado: 'Rechazado', vencido: 'Vencido',
};

const TRAMITE_ESTADO_COLORS: Record<string, string> = {
  consulta: 'bg-slate-100 text-slate-600', presupuestado: 'bg-purple-100 text-purple-700',
  en_curso: 'bg-blue-100 text-blue-700', esperando_cliente: 'bg-yellow-100 text-yellow-700',
  esperando_organismo: 'bg-orange-100 text-orange-700', observado: 'bg-red-100 text-red-700',
  aprobado: 'bg-green-100 text-green-700', rechazado: 'bg-red-100 text-red-700', vencido: 'bg-red-100 text-red-700',
};

const GESTION_ESTADO_LABELS: Record<string, string> = {
  relevamiento: 'Relevamiento',
  en_curso: 'En Curso',
  en_espera: 'En Espera',
  finalizado: 'Finalizado',
  archivado: 'Archivado',
};

const GESTION_ESTADO_COLORS: Record<string, string> = {
  relevamiento: 'bg-slate-100 text-slate-600',
  en_curso: 'bg-blue-100 text-blue-700',
  en_espera: 'bg-yellow-100 text-yellow-700',
  finalizado: 'bg-green-100 text-green-700',
  archivado: 'bg-slate-100 text-slate-500',
};

const PRIORIDAD_COLORS: Record<string, string> = {
  urgente: 'bg-red-500',
  alta: 'bg-orange-400',
  normal: 'bg-blue-400',
  baja: 'bg-slate-300',
};

const DOC_CATEGORIAS = [
  { value: 'general', label: 'General' },
  { value: 'societario', label: 'Societario' },
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'comercio_exterior', label: 'Comercio Exterior' },
  { value: 'tecnico', label: 'Tecnico' },
];

const DOC_ESTADOS = [
  { value: 'vigente', label: 'Vigente', color: 'bg-green-100 text-green-700' },
  { value: 'vencido', label: 'Vencido', color: 'bg-red-100 text-red-700' },
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
];

const DOCS_COMUNES = [
  'Constancia de CUIT',
  'Constancia de Inscripcion AFIP',
  'Estatuto Social / Contrato Social',
  'Acta de Directorio',
  'Poder del representante',
  'DNI del firmante',
  'Ultimo balance',
  'Constancia de domicilio fiscal',
  'Habilitacion municipal',
  'Certificado de libre deuda AFIP',
];

const REGISTRO_TIPOS = [
  { value: 'RNE', label: 'RNE' },
  { value: 'RNEE', label: 'RNEE' },
  { value: 'habilitacion_anmat', label: 'Habilitacion ANMAT' },
  { value: 'habilitacion_senasa', label: 'Habilitacion SENASA' },
  { value: 'habilitacion_inal', label: 'Habilitacion INAL' },
  { value: 'habilitacion_enacom', label: 'Habilitacion ENACOM' },
  { value: 'habilitacion_cites', label: 'Habilitacion CITES' },
  { value: 'habilitacion_renpre', label: 'Habilitacion RENPRE' },
  { value: 'habilitacion_sedronar', label: 'Habilitacion SEDRONAR' },
  { value: 'habilitacion_anmac', label: 'Habilitacion ANMAC' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'otro', label: 'Otro' },
];

const REGISTRO_ESTADOS = [
  { value: 'vigente', label: 'Vigente', color: 'bg-green-100 text-green-700' },
  { value: 'en_tramite', label: 'En Tramite', color: 'bg-blue-100 text-blue-700' },
  { value: 'vencido', label: 'Vencido', color: 'bg-red-100 text-red-700' },
  { value: 'suspendido', label: 'Suspendido', color: 'bg-yellow-100 text-yellow-700' },
];

export default function ClienteDetailV2({ clienteId, onNavigate }: Props) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [documentosCliente, setDocumentosCliente] = useState<DocumentoCliente[]>([]);
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [tramitesSueltos, setTramitesSueltos] = useState<TramiteSuelto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Cliente>>({});
  const [showRegistroForm, setShowRegistroForm] = useState(false);
  const [showDocClienteForm, setShowDocClienteForm] = useState(false);

  useEffect(() => { loadData(); }, [clienteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: c } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single();
      if (c) { setCliente(c); setEditForm(c); }

      const { data: r } = await supabase
        .from('registros_cliente')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('tipo', { ascending: true });
      setRegistros(r || []);

      const { data: dc } = await supabase
        .from('documentos_cliente')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('categoria', { ascending: true });
      setDocumentosCliente(dc || []);

      const { data: g } = await supabase
        .from('gestiones')
        .select('id, nombre, estado, prioridad, fecha_inicio, tramites(estado)')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      setGestiones((g as any) || []);

      const { data: ts } = await supabase
        .from('tramites')
        .select('id, titulo, estado, organismo, tipo, fecha_vencimiento')
        .eq('cliente_id', clienteId)
        .is('gestion_id', null)
        .order('created_at', { ascending: false });
      setTramitesSueltos(ts || []);
    } catch (e) {
      console.warn('Error:', e);
    }
    setLoading(false);
  };

  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    setSaveError('');
    const { error } = await supabase
      .from('clientes')
      .update({
        razon_social: editForm.razon_social,
        cuit: editForm.cuit || null,
        email: editForm.email || null,
        telefono: editForm.telefono || null,
        origen: editForm.origen || 'directo',
        notas: editForm.notas || null,
      })
      .eq('id', clienteId);

    if (error) {
      console.error('Error guardando cliente:', error);
      setSaveError(error.message || 'Error al guardar. Ejecutá la migración 69 en el SQL Editor.');
    } else {
      setEditing(false);
      loadData();
    }
  };

  const handleDeleteRegistro = async (id: string) => {
    if (!confirm('Eliminar este registro/habilitacion?')) return;
    await supabase.from('registros_cliente').delete().eq('id', id);
    loadData();
  };

  const handleDeleteDocCliente = async (id: string) => {
    if (!confirm('Eliminar este documento? Los tramites que lo referencian perderan el vinculo.')) return;
    await supabase.from('documentos_cliente').delete().eq('id', id);
    loadData();
  };

  const handleToggleDocEstado = async (doc: DocumentoCliente) => {
    const nextEstado = doc.estado === 'vigente' ? 'vencido' : doc.estado === 'vencido' ? 'pendiente' : 'vigente';
    await supabase.from('documentos_cliente').update({ estado: nextEstado, updated_at: new Date().toISOString() }).eq('id', doc.id);
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
      {/* Back button */}
      <button onClick={() => onNavigate({ type: 'clientes' })} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Volver a Clientes
      </button>

      {/* 1. Client info card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[26px] tracking-tight font-bold text-slate-800">{cliente.razon_social}</h1>
            <p className="text-sm text-slate-400 mt-0.5">Detalle del cliente</p>
          </div>
          {!editing ? (
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate({ type: 'portal-cliente', clienteId })} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50">
                <Eye className="w-4 h-4" /> Ver Portal
              </button>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                <Pencil className="w-4 h-4" /> Editar
              </button>
              <button
                onClick={async () => {
                  if (!confirm('¿Eliminar este cliente? Se enviará a la papelera.')) return;
                  await softDelete('tramites', 'cliente_id', clienteId);
                  await softDelete('gestiones', 'cliente_id', clienteId);
                  await softDelete('clientes', 'id', clienteId);
                  onNavigate({ type: 'clientes' });
                }}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
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
              <label className="block text-xs font-medium text-slate-500 mb-1">Razon Social</label>
              <input value={editForm.razon_social || ''} onChange={e => setEditForm({ ...editForm, razon_social: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">CUIT</label>
              <input value={editForm.cuit || ''} onChange={e => setEditForm({ ...editForm, cuit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
              <input value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Telefono</label>
              <input value={editForm.telefono || ''} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Origen</label>
              <select value={editForm.origen || 'directo'} onChange={e => setEditForm({ ...editForm, origen: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                <option value="directo">Directo</option>
                <option value="referido_cliente">Referido por cliente</option>
                <option value="referido_despachante">Referido por despachante</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Notas</label>
              <textarea value={editForm.notas || ''} onChange={e => setEditForm({ ...editForm, notas: e.target.value })} rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            {saveError && (
              <div className="col-span-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {saveError}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <InfoField label="CUIT" value={cliente.cuit} />
            <InfoField label="Email" value={cliente.email} />
            <InfoField label="Telefono" value={cliente.telefono} />
            <InfoField label="Contacto" value={cliente.contacto_nombre} />
            <InfoField label="Origen" value={cliente.origen === 'directo' ? 'Directo' : `Referido${cliente.referido_por ? ` por ${cliente.referido_por}` : ''}`} />
            {cliente.notas && <div className="col-span-2"><InfoField label="Notas" value={cliente.notas} /></div>}
          </div>
        )}
      </div>

      {/* 2. Registros y Habilitaciones */}
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
              Agregar RNE, RNEE o habilitacion
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
                    {r.numero && <p className="text-sm font-medium text-slate-800">N. {r.numero}</p>}
                    {r.descripcion && <p className="text-sm text-slate-600">{r.descripcion}</p>}
                    <div className="flex items-center gap-4 mt-1">
                      {r.organismo && <span className="text-xs text-slate-400">Organismo: {r.organismo}</span>}
                      {r.fecha_emision && (
                        <span className="text-xs text-slate-400">
                          Emision: {new Date(r.fecha_emision).toLocaleDateString('es-AR')}
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

      {/* 3. Documentos del Cliente (repositorio reutilizable) */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-400" />
            Documentos del Cliente ({documentosCliente.length})
          </h2>
          <button
            onClick={() => setShowDocClienteForm(true)}
            className="flex items-center gap-1 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {documentosCliente.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Sin documentos cargados</p>
            <p className="text-xs mt-1">Los documentos del cliente (CUIT, Estatuto, Poder, etc.) se cargan una vez y se reutilizan en todos sus tramites.</p>
            <button onClick={() => setShowDocClienteForm(true)} className="mt-3 text-xs text-blue-600 font-semibold hover:text-blue-700">
              Cargar primer documento
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {documentosCliente.map((doc) => {
              const isVencido = doc.estado === 'vencido' || (doc.fecha_vencimiento && new Date(doc.fecha_vencimiento) < new Date());
              return (
                <div key={doc.id} className="p-4 flex items-center gap-3">
                  {isVencido ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : doc.estado === 'vigente' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-yellow-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">{doc.nombre}</span>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {DOC_CATEGORIAS.find(c => c.value === doc.categoria)?.label || doc.categoria}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {doc.fecha_vencimiento && (
                        <span className={`text-xs ${isVencido ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                          Vence: {new Date(doc.fecha_vencimiento).toLocaleDateString('es-AR')}
                        </span>
                      )}
                      {doc.notas && <span className="text-xs text-slate-400 truncate">{doc.notas}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleDocEstado(doc)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all hover:opacity-80 ${
                      DOC_ESTADOS.find(e => e.value === doc.estado)?.color || 'bg-slate-100 text-slate-600'
                    }`}
                    title="Click para cambiar estado"
                  >
                    {DOC_ESTADOS.find(e => e.value === doc.estado)?.label || doc.estado}
                  </button>
                  <button onClick={() => handleDeleteDocCliente(doc.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Gestiones */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-slate-400" />
            Gestiones ({gestiones.length})
          </h2>
          <button
            onClick={() => onNavigate({ type: 'nueva-gestion', clienteId })}
            className="flex items-center gap-1 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="w-4 h-4" /> Nueva Gestion
          </button>
        </div>

        {gestiones.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Este cliente no tiene gestiones</p>
            <button
              onClick={() => onNavigate({ type: 'nueva-gestion', clienteId })}
              className="mt-2 text-xs text-blue-600 font-semibold hover:text-blue-700"
            >
              Crear primera gestion
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/80">
            {gestiones.map((g) => {
              const tramitesCount = g.tramites?.length || 0;

              return (
                <button
                  key={g.id}
                  onClick={() => onNavigate({ type: 'gestion', id: g.id })}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  {/* Priority dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORIDAD_COLORS[g.prioridad] || 'bg-slate-300'}`} />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{g.nombre}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {g.fecha_inicio && (
                        <span className="text-xs text-slate-400">
                          Inicio: {new Date(g.fecha_inicio).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {tramitesCount} {tramitesCount === 1 ? 'tramite' : 'tramites'}
                      </span>
                    </div>
                  </div>

                  <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${GESTION_ESTADO_COLORS[g.estado] || 'bg-slate-100 text-slate-600'}`}>
                    {GESTION_ESTADO_LABELS[g.estado] || g.estado}
                  </span>

                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Tramites sueltos (without gestion) */}
      {tramitesSueltos.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Tramites independientes ({tramitesSueltos.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-100/80">
            {tramitesSueltos.map((t) => (
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
                    {t.fecha_vencimiento && (
                      <span className={`text-xs ${new Date(t.fecha_vencimiento) < new Date() ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                        Vence: {new Date(t.fecha_vencimiento).toLocaleDateString('es-AR')}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${TRAMITE_ESTADO_COLORS[t.estado] || 'bg-slate-100'}`}>
                  {TRAMITE_ESTADO_LABELS[t.estado] || t.estado}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal nuevo registro */}
      {showRegistroForm && (
        <NuevoRegistroModal
          clienteId={clienteId}
          onClose={() => setShowRegistroForm(false)}
          onCreated={() => { setShowRegistroForm(false); loadData(); }}
        />
      )}

      {/* Modal nuevo documento cliente */}
      {showDocClienteForm && (
        <NuevoDocClienteModal
          clienteId={clienteId}
          existingDocs={documentosCliente}
          onClose={() => setShowDocClienteForm(false)}
          onCreated={() => { setShowDocClienteForm(false); loadData(); }}
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
          <h2 className="text-lg font-bold text-slate-800">Nuevo Registro / Habilitacion</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
              <select required value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                {REGISTRO_TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                {REGISTRO_ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Numero</label>
              <input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })}
                placeholder="N. de registro"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organismo</label>
              <input value={form.organismo} onChange={e => setForm({ ...form, organismo: e.target.value })}
                placeholder="Ej: ANMAT, SENASA..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripcion</label>
            <input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej: Habilitacion para importar cosmeticos"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Emision</label>
              <input type="date" value={form.fecha_emision} onChange={e => setForm({ ...form, fecha_emision: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento</label>
              <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2}
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

function NuevoDocClienteModal({ clienteId, existingDocs, onClose, onCreated }: {
  clienteId: string;
  existingDocs: DocumentoCliente[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    nombre: '', categoria: 'general', estado: 'vigente',
    fecha_emision: '', fecha_vencimiento: '', notas: '',
  });
  const [saving, setSaving] = useState(false);

  const existingNames = existingDocs.map(d => d.nombre.toLowerCase());
  const sugeridos = DOCS_COMUNES.filter(name => !existingNames.includes(name.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('documentos_cliente').insert({
      cliente_id: clienteId,
      nombre: form.nombre,
      categoria: form.categoria,
      estado: form.estado,
      fecha_emision: form.fecha_emision || null,
      fecha_vencimiento: form.fecha_vencimiento || null,
      notas: form.notas || null,
    });
    if (!error) onCreated();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Nuevo Documento del Cliente</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Sugeridos - docs comunes que aun no tiene */}
        {sugeridos.length > 0 && (
          <div className="px-5 pt-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Documentos comunes (click para agregar):</p>
            <div className="flex flex-wrap gap-1.5">
              {sugeridos.map(name => (
                <button
                  key={name}
                  onClick={() => setForm({ ...form, nombre: name })}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    form.nombre === name
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del documento *</label>
            <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Constancia de CUIT"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                {DOC_CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                {DOC_ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Emision</label>
              <input type="date" value={form.fecha_emision} onChange={e => setForm({ ...form, fecha_emision: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Vencimiento</label>
              <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2}
              placeholder="Observaciones..."
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
      <p className="text-sm text-slate-700">{value || '\u2014'}</p>
    </div>
  );
}
