import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Bell, CheckCheck, AlertTriangle, FileText, CheckCircle, Clock, ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
  onNavigateToExpediente?: (expedienteId: string) => void;
  onNavigateToProyecto?: (proyectoId: string) => void;
}

interface Notificacion {
  id: string;
  usuario_id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  expediente_id: string | null;
  proyecto_id: string | null;
  leida: boolean;
  created_at: string;
  read_at: string | null;
}

export default function Notificaciones({ onBack, onNavigateToExpediente, onNavigateToProyecto }: Props) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas'>('todas');

  useEffect(() => {
    loadNotificaciones();
  }, []);

  const loadNotificaciones = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading notifications:', error);
    } else if (data) {
      setNotificaciones(data);
    }

    setLoading(false);
  };

  const handleMarcarLeida = async (id: string) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true, read_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true, read_at: new Date().toISOString() } : n))
    );
  };

  const handleMarcarTodasLeidas = async () => {
    const noLeidas = notificaciones.filter((n) => !n.leida).map((n) => n.id);

    if (noLeidas.length === 0) return;

    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true, read_at: new Date().toISOString() })
      .in('id', noLeidas);

    if (error) {
      console.error('Error marking all as read:', error);
      return;
    }

    setNotificaciones((prev) =>
      prev.map((n) => ({
        ...n,
        leida: true,
        read_at: n.leida ? n.read_at : new Date().toISOString()
      }))
    );
  };

  const handleNotificationClick = (notif: Notificacion) => {
    if (!notif.leida) {
      handleMarcarLeida(notif.id);
    }

    if (notif.expediente_id && onNavigateToExpediente) {
      onNavigateToExpediente(notif.expediente_id);
    } else if (notif.proyecto_id && onNavigateToProyecto) {
      onNavigateToProyecto(notif.proyecto_id);
    }
  };

  const getIconoTipo = (tipo: string) => {
    if (tipo.includes('VENCIMIENTO')) return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    if (tipo.includes('DOCUMENTO')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (tipo.includes('APROBADO') || tipo.includes('CAMBIO')) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (tipo.includes('OBSERVADO') || tipo.includes('RECHAZADO')) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    return <Bell className="w-5 h-5 text-slate-500" />;
  };

  const getBadgeTipo = (tipo: string) => {
    if (tipo.includes('VENCIMIENTO')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (tipo.includes('DOCUMENTO')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (tipo.includes('APROBADO')) return 'bg-green-100 text-green-800 border-green-200';
    if (tipo.includes('OBSERVADO') || tipo.includes('RECHAZADO')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const formatTiempo = (fecha: string) => {
    const ahora = new Date();
    const notifFecha = new Date(fecha);
    const diffMs = ahora.getTime() - notifFecha.getTime();
    const diffMinutos = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMinutos < 1) return 'Hace un momento';
    if (diffMinutos < 60) return `Hace ${diffMinutos} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    return notifFecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  const notificacionesFiltradas =
    filtro === 'no_leidas' ? notificaciones.filter((n) => !n.leida) : notificaciones;

  const noLeidasCount = notificaciones.filter((n) => !n.leida).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Centro de Notificaciones</h1>
          {noLeidasCount > 0 && (
            <p className="text-sm text-slate-600 mt-1">
              Tienes {noLeidasCount} notificación{noLeidasCount !== 1 ? 'es' : ''} sin leer
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setFiltro('todas')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filtro === 'todas'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltro('no_leidas')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filtro === 'no_leidas'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              No leídas {noLeidasCount > 0 && `(${noLeidasCount})`}
            </button>
          </div>

          {noLeidasCount > 0 && (
            <button
              onClick={handleMarcarTodasLeidas}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-slate-200">
        {notificacionesFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 mb-2">
              {filtro === 'no_leidas' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
            </p>
            <p className="text-sm text-slate-500">
              Las notificaciones sobre tus proyectos y expedientes aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {notificacionesFiltradas.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 flex gap-4 cursor-pointer transition-all hover:bg-slate-50 ${
                  !notif.leida ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  {!notif.leida && (
                    <span
                      className="w-2 h-2 bg-blue-500 rounded-full"
                      title="No leída"
                    ></span>
                  )}
                  {getIconoTipo(notif.tipo)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3
                      className={`font-semibold ${
                        !notif.leida ? 'text-slate-900' : 'text-slate-600'
                      }`}
                    >
                      {notif.titulo}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ${getBadgeTipo(
                        notif.tipo
                      )}`}
                    >
                      {notif.tipo.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p
                    className={`text-sm ${
                      !notif.leida ? 'text-slate-700' : 'text-slate-500'
                    }`}
                  >
                    {notif.mensaje}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTiempo(notif.created_at)}
                    </span>
                    {notif.read_at && (
                      <span>
                        • Leída el{' '}
                        {new Date(notif.read_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {!notif.leida && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarcarLeida(notif.id);
                    }}
                    className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Marcar como leída
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
