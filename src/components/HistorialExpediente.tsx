import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock } from 'lucide-react';

interface Props {
  expedienteId: string;
}

interface HistorialItem {
  id: string;
  fecha: string;
  accion: string;
  descripcion: string | null;
  usuarios: {
    nombre: string;
  } | null;
}

export function HistorialExpediente({ expedienteId }: Props) {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistorial();
  }, [expedienteId]);

  const loadHistorial = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('historial')
      .select(`
        *,
        usuarios (nombre)
      `)
      .eq('expediente_id', expedienteId)
      .order('fecha', { ascending: false });

    if (data) setHistorial(data as any);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p>No hay eventos registrados para este expediente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {historial.map((item) => (
        <div key={item.id} className="flex space-x-3 p-4 bg-slate-50 rounded-lg">
          <div className="flex-shrink-0">
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">{item.accion}</p>
            {item.descripcion && (
              <p className="text-sm text-slate-700 mt-1">{item.descripcion}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {new Date(item.fecha).toLocaleString('es-AR')}
              {item.usuarios && ` por ${item.usuarios.nombre}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
