import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  MessageSquare,
  Mail,
  Phone,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Clock
} from 'lucide-react';

interface Props {
  casoId: string;
}

interface Comunicacion {
  id: string;
  canal: string;
  direccion: string;
  asunto: string | null;
  contenido: string;
  enviado: boolean;
  fecha_envio: string | null;
  created_at: string;
}

const CANALES = [
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
  { value: 'TELEFONO', label: 'Teléfono', icon: Phone },
  { value: 'TAD', label: 'TAD/ANMAT', icon: Send },
  { value: 'INTERNO', label: 'Nota Interna', icon: Clock }
];

export function ANMATTabComunicaciones({ casoId }: Props) {
  const [comunicaciones, setComunicaciones] = useState<Comunicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    canal: 'EMAIL',
    direccion: 'SALIDA',
    asunto: '',
    contenido: ''
  });

  useEffect(() => {
    loadComunicaciones();
  }, [casoId]);

  const loadComunicaciones = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('anmat_comunicaciones')
      .select('*')
      .eq('caso_id', casoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading comunicaciones:', error);
    } else {
      setComunicaciones(data as any);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: userData } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_id', user?.id)
      .maybeSingle();

    const { error } = await supabase
      .from('anmat_comunicaciones')
      .insert([{
        caso_id: casoId,
        canal: formData.canal,
        direccion: formData.direccion,
        asunto: formData.asunto || null,
        contenido: formData.contenido,
        enviado: formData.direccion === 'SALIDA',
        fecha_envio: formData.direccion === 'SALIDA' ? new Date().toISOString() : null,
        created_by: userData?.id
      }]);

    if (error) {
      toast.error('Error al guardar: ' + error.message);
    } else {
      resetForm();
      loadComunicaciones();
    }
  };

  const resetForm = () => {
    setFormData({
      canal: 'EMAIL',
      direccion: 'SALIDA',
      asunto: '',
      contenido: ''
    });
    setShowForm(false);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCanalConfig = (canal: string) => {
    return CANALES.find(c => c.value === canal) || CANALES[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Comunicaciones</h3>
          <p className="text-sm text-slate-600">
            Historial de comunicaciones con el cliente
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Comunicación
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <h4 className="font-semibold text-slate-800 mb-4">Registrar Comunicación</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Canal</label>
                <select
                  value={formData.canal}
                  onChange={(e) => setFormData({ ...formData, canal: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {CANALES.map(canal => (
                    <option key={canal.value} value={canal.value}>{canal.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <select
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="SALIDA">Enviado (salida)</option>
                  <option value="ENTRADA">Recibido (entrada)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asunto</label>
                <input
                  type="text"
                  value={formData.asunto}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Asunto del mensaje"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contenido *</label>
              <textarea
                required
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows={4}
                placeholder="Contenido del mensaje o resumen de la comunicación..."
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                Guardar
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Communications List */}
      {comunicaciones.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No hay comunicaciones registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comunicaciones.map(com => {
            const canalConfig = getCanalConfig(com.canal);
            const Icon = canalConfig.icon;
            const isEntrada = com.direccion === 'ENTRADA';

            return (
              <div
                key={com.id}
                className={`bg-white border rounded-lg p-4 ${
                  isEntrada ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isEntrada ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${isEntrada ? 'text-blue-600' : 'text-green-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">{canalConfig.label}</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                        isEntrada ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isEntrada ? (
                          <>
                            <ArrowDownLeft className="w-3 h-3" />
                            Recibido
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3" />
                            Enviado
                          </>
                        )}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDateTime(com.created_at)}
                      </span>
                    </div>
                    {com.asunto && (
                      <p className="font-medium text-slate-800 mb-1">{com.asunto}</p>
                    )}
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{com.contenido}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
