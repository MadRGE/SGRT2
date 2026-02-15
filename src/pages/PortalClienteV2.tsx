import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader2, ChevronRight, CheckCircle2, AlertTriangle, Clock, FileText, Upload, MessageCircle, Phone } from 'lucide-react';

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
}

interface Gestion {
  id: string;
  nombre: string;
  estado: string;
}

interface Tramite {
  id: string;
  titulo: string;
  estado: string;
  organismo: string | null;
  progreso: number | null;
  semaforo: string | null;
  fecha_vencimiento: string | null;
  gestion_id: string | null;
}

interface DocTramite {
  id: string;
  nombre: string;
  estado: string;
  obligatorio: boolean;
  tramite_id: string;
}

interface DocCliente {
  id: string;
  nombre: string;
  estado: string;
  categoria: string;
  fecha_vencimiento: string | null;
}

interface Seguimiento {
  id: string;
  descripcion: string;
  tramite_id: string;
  created_at: string;
}

// States in the process flow, in order
const PASOS_TRAMITE = [
  { key: 'consulta', label: 'Consulta' },
  { key: 'presupuestado', label: 'Presupuesto' },
  { key: 'en_curso', label: 'En trabajo' },
  { key: 'esperando_cliente', label: 'Te necesitamos' },
  { key: 'esperando_organismo', label: 'Presentado' },
  { key: 'observado', label: 'Observado' },
  { key: 'aprobado', label: 'Aprobado' },
];

const ESTADO_SIMPLE: Record<string, { label: string; color: string; bg: string }> = {
  consulta:             { label: 'Consulta inicial',            color: 'text-slate-600',  bg: 'bg-slate-100' },
  presupuestado:        { label: 'Presupuesto enviado',         color: 'text-purple-700', bg: 'bg-purple-50' },
  en_curso:             { label: 'Estamos trabajando',          color: 'text-blue-700',   bg: 'bg-blue-50' },
  esperando_cliente:    { label: 'Necesitamos tu respuesta',    color: 'text-yellow-800', bg: 'bg-yellow-50' },
  esperando_organismo:  { label: 'Presentado ante organismo',   color: 'text-orange-700', bg: 'bg-orange-50' },
  observado:            { label: 'Observado - en revision',     color: 'text-red-700',    bg: 'bg-red-50' },
  aprobado:             { label: 'Aprobado',                    color: 'text-green-700',  bg: 'bg-green-50' },
  rechazado:            { label: 'Rechazado',                   color: 'text-red-700',    bg: 'bg-red-50' },
  vencido:              { label: 'Vencido',                     color: 'text-red-700',    bg: 'bg-red-50' },
};

type Tab = 'pendientes' | 'tramites' | 'documentos';

export default function PortalClienteV2({ clienteId, onNavigate }: Props) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [docsTramite, setDocsTramite] = useState<DocTramite[]>([]);
  const [docsCliente, setDocsCliente] = useState<DocCliente[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('pendientes');
  const [expandedTramite, setExpandedTramite] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [clienteId]);

  const loadData = async () => {
    setLoading(true);
    const { data: c } = await supabase.from('clientes').select('id, razon_social, cuit, email, telefono').eq('id', clienteId).single();
    if (c) setCliente(c);

    const { data: g } = await supabase.from('gestiones').select('id, nombre, estado')
      .eq('cliente_id', clienteId).is('deleted_at', null).order('created_at', { ascending: false });
    setGestiones(g || []);

    const { data: t } = await supabase.from('tramites')
      .select('id, titulo, estado, organismo, progreso, semaforo, fecha_vencimiento, gestion_id')
      .eq('cliente_id', clienteId).is('deleted_at', null).order('created_at', { ascending: false });
    setTramites(t || []);

    if (t && t.length > 0) {
      const ids = t.map(tr => tr.id);
      const { data: dt } = await supabase.from('documentos_tramite')
        .select('id, nombre, estado, obligatorio, tramite_id')
        .in('tramite_id', ids);
      setDocsTramite(dt || []);

      const { data: seg } = await supabase.from('seguimientos')
        .select('id, descripcion, tramite_id, created_at')
        .in('tramite_id', ids)
        .order('created_at', { ascending: false })
        .limit(50);
      setSeguimientos(seg || []);
    }

    const { data: dc } = await supabase.from('documentos_cliente')
      .select('id, nombre, estado, categoria, fecha_vencimiento')
      .eq('cliente_id', clienteId);
    setDocsCliente(dc || []);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-400 text-sm">Cargando informacion...</p>
      </div>
    );
  }

  if (!cliente) {
    return <div className="text-center py-20 text-slate-500 text-lg">Cliente no encontrado</div>;
  }

  // Computed
  const tramitesActivos = tramites.filter(t => !['aprobado', 'rechazado', 'vencido'].includes(t.estado));
  const esperandoCliente = tramites.filter(t => t.estado === 'esperando_cliente');
  const docsPendientes = docsTramite.filter(d => d.estado === 'pendiente' && d.obligatorio);
  const docsVencidos = docsCliente.filter(d => d.estado === 'vencido' || (d.fecha_vencimiento && new Date(d.fecha_vencimiento) < new Date()));
  const pendientesCount = esperandoCliente.length + docsPendientes.length + docsVencidos.length;

  // Auto-select tab if nothing pending
  const activeTab = tab === 'pendientes' && pendientesCount === 0 ? 'tramites' : tab;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* Back button - consultant only */}
      <button onClick={() => onNavigate({ type: 'cliente', id: clienteId })} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 print:hidden">
        <ArrowLeft className="w-4 h-4" /> Volver al detalle interno
      </button>

      {/* Header - big and clear */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
            <span className="font-black text-2xl">{cliente.razon_social.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{cliente.razon_social}</h1>
            {cliente.cuit && <p className="text-blue-100 text-sm mt-0.5">CUIT: {cliente.cuit}</p>}
          </div>
        </div>

        {/* Quick stats - big numbers */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-3xl font-bold">{tramitesActivos.length}</p>
            <p className="text-xs text-blue-100 mt-0.5">En proceso</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
            <p className="text-3xl font-bold">{tramites.filter(t => t.estado === 'aprobado').length}</p>
            <p className="text-xs text-blue-100 mt-0.5">Aprobados</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${pendientesCount > 0 ? 'bg-yellow-400/90 text-yellow-900' : 'bg-white/10 backdrop-blur'}`}>
            <p className="text-3xl font-bold">{pendientesCount}</p>
            <p className={`text-xs mt-0.5 ${pendientesCount > 0 ? 'text-yellow-800' : 'text-blue-100'}`}>Pendientes</p>
          </div>
        </div>
      </div>

      {/* Tab navigation - big buttons */}
      <div className="flex gap-2">
        {pendientesCount > 0 && (
          <TabButton active={activeTab === 'pendientes'} onClick={() => setTab('pendientes')} badge={pendientesCount} urgent>
            Pendientes
          </TabButton>
        )}
        <TabButton active={activeTab === 'tramites'} onClick={() => setTab('tramites')}>
          Mis Tramites
        </TabButton>
        <TabButton active={activeTab === 'documentos'} onClick={() => setTab('documentos')} badge={docsVencidos.length > 0 ? docsVencidos.length : undefined}>
          Documentos
        </TabButton>
      </div>

      {/* ===== TAB: PENDIENTES ===== */}
      {activeTab === 'pendientes' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 px-1">Estos items necesitan tu atencion:</p>

          {/* Tramites waiting for client */}
          {esperandoCliente.map(t => {
            const tDocs = docsTramite.filter(d => d.tramite_id === t.id && d.estado === 'pendiente' && d.obligatorio);
            return (
              <div
                key={t.id}
                onClick={() => onNavigate({ type: 'tramite', id: t.id })}
                className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 cursor-pointer hover:border-yellow-300 active:bg-yellow-100 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-yellow-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-yellow-900 text-base">{t.titulo}</p>
                    <p className="text-sm text-yellow-700 mt-1">Necesitamos tu respuesta para avanzar</p>
                    {tDocs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {tDocs.map(d => (
                          <div key={d.id} className="flex items-center gap-2 text-sm text-yellow-800">
                            <Upload className="w-4 h-4 flex-shrink-0" />
                            <span>{d.nombre}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                </div>
              </div>
            );
          })}

          {/* Pending docs not linked to esperando_cliente tramites */}
          {docsPendientes.filter(d => !esperandoCliente.find(t => t.id === d.tramite_id)).length > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-orange-700" />
                </div>
                <div>
                  <p className="font-bold text-orange-900 text-base">Documentos pendientes</p>
                  <p className="text-sm text-orange-700">Necesitamos estos documentos para continuar</p>
                </div>
              </div>
              <div className="space-y-2 ml-15">
                {docsPendientes.filter(d => !esperandoCliente.find(t => t.id === d.tramite_id)).map(d => {
                  const tramite = tramites.find(t => t.id === d.tramite_id);
                  return (
                    <div
                      key={d.id}
                      onClick={() => tramite && onNavigate({ type: 'tramite', id: tramite.id })}
                      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-orange-100 cursor-pointer hover:border-orange-300 active:bg-orange-50 transition-all"
                    >
                      <Upload className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{d.nombre}</p>
                        {tramite && <p className="text-xs text-slate-500">Para: {tramite.titulo}</p>}
                      </div>
                      <ChevronRight className="w-5 h-5 text-orange-300 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expired client docs */}
          {docsVencidos.map(d => (
            <div key={d.id} className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-700" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-900 text-base">{d.nombre}</p>
                  <p className="text-sm text-red-700 mt-0.5">Este documento esta vencido. Necesitas renovarlo.</p>
                  {d.fecha_vencimiento && (
                    <p className="text-xs text-red-500 mt-1">Vencido el {new Date(d.fecha_vencimiento).toLocaleDateString('es-AR')}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== TAB: MIS TRAMITES ===== */}
      {activeTab === 'tramites' && (
        <div className="space-y-3">
          {tramites.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 text-lg">No hay tramites todavia</p>
            </div>
          ) : (
            tramites.map(t => {
              const gestion = gestiones.find(g => g.id === t.gestion_id);
              const estado = ESTADO_SIMPLE[t.estado] || { label: t.estado, color: 'text-slate-600', bg: 'bg-slate-50' };
              const isExpanded = expandedTramite === t.id;
              const tDocs = docsTramite.filter(d => d.tramite_id === t.id);
              const docsOk = tDocs.filter(d => d.estado === 'aprobado').length;
              const tSegs = seguimientos.filter(s => s.tramite_id === t.id).slice(0, 5);
              const needsAttention = t.estado === 'esperando_cliente';

              return (
                <div key={t.id} className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
                  needsAttention ? 'border-yellow-300 shadow-sm shadow-yellow-100' : 'border-slate-200'
                }`}>
                  {/* Tramite card - clickable */}
                  <button
                    onClick={() => setExpandedTramite(isExpanded ? null : t.id)}
                    className="w-full p-5 text-left hover:bg-slate-50/50 active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Status dot - big */}
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 ${
                        t.estado === 'aprobado' ? 'bg-green-500' :
                        t.estado === 'rechazado' || t.estado === 'vencido' ? 'bg-red-500' :
                        t.semaforo === 'rojo' ? 'bg-red-500' :
                        t.semaforo === 'amarillo' ? 'bg-yellow-400' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-base">{t.titulo}</p>
                        {gestion && <p className="text-xs text-slate-400 mt-0.5">{gestion.nombre}</p>}
                        {t.organismo && <span className="inline-block text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mt-1">{t.organismo}</span>}

                        {/* Estado badge - large and clear */}
                        <div className={`inline-block mt-2 px-3 py-1.5 rounded-xl text-sm font-semibold ${estado.bg} ${estado.color}`}>
                          {estado.label}
                        </div>
                      </div>
                      <ChevronRight className={`w-6 h-6 text-slate-300 flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t-2 border-slate-100">
                      {/* Step tracker - visual process */}
                      <div className="p-5 bg-slate-50/50">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Proceso del tramite</p>
                        <StepTracker currentEstado={t.estado} />
                      </div>

                      {/* Progress */}
                      {(t.progreso ?? 0) > 0 && (
                        <div className="px-5 py-3 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-slate-600">Avance general</span>
                            <span className="text-sm font-bold text-slate-800">{t.progreso}%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${t.progreso}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      {tDocs.length > 0 && (
                        <div className="px-5 py-3 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            Documentacion ({docsOk}/{tDocs.length} listos)
                          </p>
                          <div className="space-y-1.5">
                            {tDocs.map(d => (
                              <div key={d.id} className="flex items-center gap-3 py-1">
                                {d.estado === 'aprobado' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : d.estado === 'presentado' ? (
                                  <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                ) : d.estado === 'rechazado' ? (
                                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                                )}
                                <span className={`text-sm flex-1 ${d.estado === 'aprobado' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                  {d.nombre}
                                </span>
                                {d.estado === 'pendiente' && d.obligatorio && (
                                  <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                                    Pendiente
                                  </span>
                                )}
                                {d.estado === 'presentado' && (
                                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                    En revision
                                  </span>
                                )}
                                {d.estado === 'rechazado' && (
                                  <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                    Rechazado
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent activity */}
                      {tSegs.length > 0 && (
                        <div className="px-5 py-3 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ultimas novedades</p>
                          <div className="space-y-2">
                            {tSegs.map(s => (
                              <div key={s.id} className="flex gap-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-slate-700">{s.descripcion}</p>
                                  <p className="text-xs text-slate-400">{formatDate(s.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Vencimiento */}
                      {t.fecha_vencimiento && (
                        <div className="px-5 py-3 border-t border-slate-100">
                          <div className={`flex items-center gap-2 text-sm ${
                            new Date(t.fecha_vencimiento) < new Date() ? 'text-red-600 font-semibold' : 'text-slate-600'
                          }`}>
                            <Clock className="w-4 h-4" />
                            {new Date(t.fecha_vencimiento) < new Date()
                              ? `Vencido el ${new Date(t.fecha_vencimiento).toLocaleDateString('es-AR')}`
                              : `Vence: ${new Date(t.fecha_vencimiento).toLocaleDateString('es-AR')}`
                            }
                          </div>
                        </div>
                      )}

                      {/* Action button */}
                      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <button
                          onClick={() => onNavigate({ type: 'tramite', id: t.id })}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-sm transition-colors"
                        >
                          Ver detalle completo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===== TAB: DOCUMENTOS ===== */}
      {activeTab === 'documentos' && (
        <div className="space-y-3">
          {docsCliente.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 text-lg">Sin documentos cargados</p>
            </div>
          ) : (
            docsCliente.map(doc => {
              const isVencido = doc.estado === 'vencido' || (doc.fecha_vencimiento && new Date(doc.fecha_vencimiento) < new Date());
              const isVigente = doc.estado === 'vigente' && !isVencido;

              return (
                <div key={doc.id} className={`bg-white rounded-2xl border-2 p-5 flex items-center gap-4 ${
                  isVencido ? 'border-red-200 bg-red-50/50' : isVigente ? 'border-green-200' : 'border-slate-200'
                }`}>
                  {/* Status icon - big */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isVencido ? 'bg-red-100' : isVigente ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {isVencido ? (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    ) : isVigente ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Clock className="w-6 h-6 text-yellow-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{doc.nombre}</p>
                    {doc.categoria && <p className="text-xs text-slate-400 mt-0.5">{doc.categoria}</p>}
                    {doc.fecha_vencimiento && (
                      <p className={`text-xs mt-1 font-medium ${isVencido ? 'text-red-600' : 'text-slate-400'}`}>
                        {isVencido ? 'VENCIDO' : 'Vence'}: {new Date(doc.fecha_vencimiento).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0 ${
                    isVencido ? 'bg-red-100 text-red-700' :
                    isVigente ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {isVencido ? 'Vencido' : isVigente ? 'OK' : 'Pendiente'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Contact bar - always visible, big button */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
        <MessageCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <p className="text-sm text-slate-500 flex-1">Alguna duda o consulta?</p>
        <a href="tel:+54" className="flex items-center gap-2 py-2.5 px-5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl font-semibold text-sm transition-colors">
          <Phone className="w-4 h-4" /> Contactar
        </a>
      </div>

      {/* Footer */}
      <div className="text-center py-2 text-xs text-slate-300">
        SGT - Sistema de Gestion de Tramites
      </div>
    </div>
  );
}

// ======= Step Tracker Component =======
function StepTracker({ currentEstado }: { currentEstado: string }) {
  const pasoIndex = PASOS_TRAMITE.findIndex(p => p.key === currentEstado);
  const isTerminal = currentEstado === 'aprobado' || currentEstado === 'rechazado' || currentEstado === 'vencido';

  return (
    <div className="flex items-center gap-1">
      {PASOS_TRAMITE.map((paso, i) => {
        const isPast = pasoIndex > i;
        const isCurrent = pasoIndex === i;
        const isAprobado = paso.key === 'aprobado' && currentEstado === 'aprobado';

        return (
          <div key={paso.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isAprobado ? 'bg-green-500 text-white' :
                isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                isPast ? 'bg-blue-500 text-white' :
                'bg-slate-200 text-slate-400'
              }`}>
                {isPast || isAprobado ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {/* Label */}
              <p className={`text-[10px] mt-1 text-center leading-tight max-w-[60px] ${
                isCurrent ? 'font-bold text-blue-700' :
                isPast ? 'text-blue-500' :
                'text-slate-400'
              }`}>
                {paso.label}
              </p>
            </div>
            {/* Connector line */}
            {i < PASOS_TRAMITE.length - 1 && (
              <div className={`flex-1 h-1 rounded-full mx-1 mb-4 ${
                isPast ? 'bg-blue-400' : 'bg-slate-200'
              }`} />
            )}
          </div>
        );
      })}

      {/* Terminal states */}
      {(currentEstado === 'rechazado' || currentEstado === 'vencido') && (
        <div className="flex flex-col items-center ml-2">
          <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center ring-4 ring-red-100">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-[10px] mt-1 font-bold text-red-600">
            {currentEstado === 'rechazado' ? 'Rechazado' : 'Vencido'}
          </p>
        </div>
      )}
    </div>
  );
}

// ======= Tab Button Component =======
function TabButton({ active, onClick, children, badge, urgent }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
  urgent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all relative ${
        active
          ? 'bg-white text-slate-800 shadow-sm border-2 border-slate-200'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 active:bg-slate-200 border-2 border-transparent'
      }`}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className={`absolute -top-1.5 -right-1.5 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white ${
          urgent ? 'bg-red-500' : 'bg-yellow-500'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ======= Date formatter =======
function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = diff / (1000 * 60 * 60);
  const days = hours / 24;

  if (hours < 1) return 'Hace minutos';
  if (hours < 24) return `Hace ${Math.floor(hours)} horas`;
  if (days < 7) return `Hace ${Math.floor(days)} dias`;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}
