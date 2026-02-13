import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader2, Briefcase, FileText, Clock, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';

interface Props {
  clienteId: string;
  onNavigate: (page: any) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
  cuit: string | null;
}

interface Gestion {
  id: string;
  nombre: string;
  estado: string;
  fecha_inicio: string | null;
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

const ESTADO_LABELS: Record<string, string> = {
  consulta: 'Consulta inicial', presupuestado: 'Presupuestado', en_curso: 'En curso',
  esperando_cliente: 'Esperando documentacion', esperando_organismo: 'Presentado ante organismo',
  observado: 'Observado por organismo', aprobado: 'Aprobado', rechazado: 'Rechazado', vencido: 'Vencido',
};

const ESTADO_ICONS: Record<string, string> = {
  consulta: 'bg-slate-100 text-slate-600',
  presupuestado: 'bg-purple-100 text-purple-700',
  en_curso: 'bg-blue-100 text-blue-700',
  esperando_cliente: 'bg-yellow-100 text-yellow-800',
  esperando_organismo: 'bg-orange-100 text-orange-700',
  observado: 'bg-red-100 text-red-700',
  aprobado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700',
  vencido: 'bg-red-100 text-red-700',
};

const GESTION_LABELS: Record<string, string> = {
  relevamiento: 'En relevamiento', en_curso: 'En curso', en_espera: 'En espera',
  finalizado: 'Finalizado', archivado: 'Archivado',
};

export default function PortalClienteV2({ clienteId, onNavigate }: Props) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [docsTramite, setDocsTramite] = useState<DocTramite[]>([]);
  const [docsCliente, setDocsCliente] = useState<DocCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGestion, setExpandedGestion] = useState<string[]>([]);

  useEffect(() => { loadData(); }, [clienteId]);

  const loadData = async () => {
    setLoading(true);
    const { data: c } = await supabase.from('clientes').select('id, razon_social, cuit').eq('id', clienteId).single();
    if (c) setCliente(c);

    const { data: g } = await supabase.from('gestiones').select('id, nombre, estado, fecha_inicio')
      .eq('cliente_id', clienteId).order('created_at', { ascending: false });
    setGestiones(g || []);
    // Auto-expand active gestiones
    if (g) setExpandedGestion(g.filter(x => x.estado !== 'archivado' && x.estado !== 'finalizado').map(x => x.id));

    const { data: t } = await supabase.from('tramites')
      .select('id, titulo, estado, organismo, progreso, semaforo, fecha_vencimiento, gestion_id')
      .eq('cliente_id', clienteId).order('created_at', { ascending: true });
    setTramites(t || []);

    // Load all document requirements for this client's tramites
    if (t && t.length > 0) {
      const tramiteIds = t.map(tr => tr.id);
      const { data: dt } = await supabase.from('documentos_tramite')
        .select('id, nombre, estado, obligatorio, tramite_id')
        .in('tramite_id', tramiteIds);
      setDocsTramite(dt || []);
    }

    const { data: dc } = await supabase.from('documentos_cliente')
      .select('id, nombre, estado, categoria, fecha_vencimiento')
      .eq('cliente_id', clienteId);
    setDocsCliente(dc || []);

    setLoading(false);
  };

  const toggleGestion = (id: string) => {
    setExpandedGestion(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!cliente) {
    return <div className="text-center py-20 text-slate-500">Cliente no encontrado</div>;
  }

  // Stats
  const tramitesActivos = tramites.filter(t => !['aprobado', 'rechazado', 'vencido'].includes(t.estado));
  const tramitesAprobados = tramites.filter(t => t.estado === 'aprobado');
  const docsPendientes = docsTramite.filter(d => d.estado === 'pendiente' && d.obligatorio);
  const docsClienteVencidos = docsCliente.filter(d => d.estado === 'vencido' || (d.fecha_vencimiento && new Date(d.fecha_vencimiento) < new Date()));
  const esperandoCliente = tramites.filter(t => t.estado === 'esperando_cliente');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button - only visible for the consultant */}
      <button onClick={() => onNavigate({ type: 'cliente', id: clienteId })} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 print:hidden">
        <ArrowLeft className="w-4 h-4" /> Volver al detalle
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-black text-xl">{cliente.razon_social.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{cliente.razon_social}</h1>
            {cliente.cuit && <p className="text-sm text-slate-400">CUIT: {cliente.cuit}</p>}
            <p className="text-xs text-slate-400 mt-0.5">Estado de gestiones y tramites regulatorios</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{tramitesActivos.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Tramites activos</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{tramitesAprobados.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Aprobados</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 text-center">
          <p className={`text-2xl font-bold ${esperandoCliente.length > 0 ? 'text-yellow-600' : 'text-slate-300'}`}>{esperandoCliente.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Requieren tu atencion</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 text-center">
          <p className={`text-2xl font-bold ${docsPendientes.length > 0 ? 'text-red-600' : 'text-slate-300'}`}>{docsPendientes.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Docs pendientes</p>
        </div>
      </div>

      {/* Alert: docs pending from client */}
      {(docsPendientes.length > 0 || esperandoCliente.length > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800 text-sm">Requiere tu atencion</h3>
          </div>
          {docsPendientes.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-yellow-700 font-medium mb-1">Documentacion pendiente de entrega:</p>
              <ul className="space-y-0.5">
                {docsPendientes.slice(0, 10).map(d => {
                  const tramite = tramites.find(t => t.id === d.tramite_id);
                  return (
                    <li key={d.id} className="text-xs text-yellow-800 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                      <span className="font-medium">{d.nombre}</span>
                      {tramite && <span className="text-yellow-600">({tramite.titulo})</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {esperandoCliente.length > 0 && (
            <div>
              <p className="text-xs text-yellow-700 font-medium mb-1">Tramites esperando respuesta:</p>
              <ul className="space-y-0.5">
                {esperandoCliente.map(t => (
                  <li key={t.id} className="text-xs text-yellow-800 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                    <span className="font-medium">{t.titulo}</span>
                    {t.organismo && <span className="text-yellow-600">({t.organismo})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Gestiones with tramites */}
      {gestiones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center text-slate-400">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay gestiones activas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {gestiones.map(g => {
            const gTramites = tramites.filter(t => t.gestion_id === g.id);
            const isExpanded = expandedGestion.includes(g.id);
            const completados = gTramites.filter(t => t.estado === 'aprobado').length;
            const total = gTramites.length;
            const progreso = total > 0 ? Math.round((completados / total) * 100) : 0;

            return (
              <div key={g.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                {/* Gestion header */}
                <button
                  onClick={() => toggleGestion(g.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{g.nombre}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400">{GESTION_LABELS[g.estado] || g.estado}</span>
                      <span className="text-xs text-slate-400">{total} tramites</span>
                      {total > 0 && <span className="text-xs text-slate-400">{progreso}% completado</span>}
                    </div>
                  </div>
                  {/* Mini progress bar */}
                  {total > 0 && (
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progreso}%` }} />
                    </div>
                  )}
                </button>

                {/* Tramites list */}
                {isExpanded && gTramites.length > 0 && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {gTramites.map(t => {
                      const tDocs = docsTramite.filter(d => d.tramite_id === t.id);
                      const docsOk = tDocs.filter(d => d.estado === 'aprobado').length;
                      const docsTotal = tDocs.length;

                      return (
                        <div key={t.id} onClick={() => onNavigate({ type: 'tramite', id: t.id })} className="px-4 py-3 pl-12 cursor-pointer hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            {/* Semaforo */}
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              t.semaforo === 'rojo' ? 'bg-red-500' :
                              t.semaforo === 'amarillo' ? 'bg-yellow-400' : 'bg-green-500'
                            }`} />

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800">{t.titulo}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                {t.organismo && <span className="text-xs text-slate-400">{t.organismo}</span>}
                                {t.fecha_vencimiento && (
                                  <span className={`text-xs ${new Date(t.fecha_vencimiento) < new Date() ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                                    Vence: {new Date(t.fecha_vencimiento).toLocaleDateString('es-AR')}
                                  </span>
                                )}
                                {docsTotal > 0 && (
                                  <span className="text-xs text-slate-400">{docsOk}/{docsTotal} docs</span>
                                )}
                              </div>
                            </div>

                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${ESTADO_ICONS[t.estado] || 'bg-slate-100 text-slate-600'}`}>
                              {ESTADO_LABELS[t.estado] || t.estado}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                          </div>

                          {/* Progress bar */}
                          {(t.progreso || 0) > 0 && (
                            <div className="ml-5.5 mt-2 flex items-center gap-2">
                              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${t.progreso}%` }} />
                              </div>
                              <span className="text-[10px] text-slate-400">{t.progreso}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isExpanded && gTramites.length === 0 && (
                  <div className="border-t border-slate-100 p-4 pl-12 text-xs text-slate-400">
                    Sin tramites en esta gestion
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Client documents status */}
      {docsCliente.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800">Documentos del cliente</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {docsCliente.map(doc => {
              const isVencido = doc.estado === 'vencido' || (doc.fecha_vencimiento && new Date(doc.fecha_vencimiento) < new Date());
              return (
                <div key={doc.id} className="px-4 py-2.5 flex items-center gap-3">
                  {isVencido ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  ) : doc.estado === 'vigente' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                  )}
                  <span className="text-sm text-slate-700 flex-1">{doc.nombre}</span>
                  {doc.fecha_vencimiento && (
                    <span className={`text-xs ${isVencido ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                      {isVencido ? 'Vencido' : `Vence: ${new Date(doc.fecha_vencimiento).toLocaleDateString('es-AR')}`}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isVencido ? 'bg-red-100 text-red-700' :
                    doc.estado === 'vigente' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {isVencido ? 'Vencido' : doc.estado === 'vigente' ? 'Vigente' : 'Pendiente'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-4 text-xs text-slate-300">
        SGT - Sistema de Gestion de Tramites
      </div>
    </div>
  );
}
