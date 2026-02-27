import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Building2, Plus, Ship } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { DespachoService, type Despacho } from '../../services/DespachoService';
import {
  DESPACHO_ESTADO_LABELS,
  DESPACHO_ESTADO_COLORS,
  DESPACHO_TIPO_LABELS,
  DESPACHO_TIPO_COLORS,
} from '../../lib/constants/despacho';

interface Props {
  clienteId: string;
  onBack: () => void;
  onNavigate: (view: any) => void;
  onNewDespacho: (clienteId: string) => void;
}

interface Cliente {
  id: string;
  razon_social: string;
  cuit: string;
  domicilio?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export default function DespachanteClienteDetail({ clienteId, onBack, onNavigate, onNewDespacho }: Props) {
  const { user } = useAuth();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id, clienteId]);

  const loadData = async () => {
    setLoading(true);
    const [clienteRes, despachosData] = await Promise.all([
      supabase.from('clientes').select('id, razon_social, cuit, domicilio, telefono, email').eq('id', clienteId).single(),
      DespachoService.getDespachosByCliente(user!.id, clienteId),
    ]);

    setCliente(clienteRes.data);
    setDespachos(despachosData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Cliente no encontrado</p>
        <button onClick={onBack} className="text-amber-600 font-medium mt-2 hover:underline">Volver</button>
      </div>
    );
  }

  const activos = despachos.filter((d) => !['liberado', 'rechazado'].includes(d.estado));
  const finalizados = despachos.filter((d) => ['liberado', 'rechazado'].includes(d.estado));

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> Volver a clientes
      </button>

      {/* Client info */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{cliente.razon_social}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                {cliente.cuit && <span className="font-mono">CUIT: {cliente.cuit}</span>}
                {cliente.telefono && <span>Tel: {cliente.telefono}</span>}
              </div>
              {cliente.domicilio && <p className="text-xs text-slate-400 mt-1">{cliente.domicilio}</p>}
            </div>
          </div>
          <button
            onClick={() => onNewDespacho(clienteId)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-amber-500/25 font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo Despacho
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800">{despachos.length}</p>
            <p className="text-xs text-slate-500">Total Despachos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{activos.length}</p>
            <p className="text-xs text-slate-500">Activos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{finalizados.length}</p>
            <p className="text-xs text-slate-500">Finalizados</p>
          </div>
        </div>
      </div>

      {/* Despachos list */}
      {despachos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center">
          <Ship className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-slate-500 text-sm">No hay despachos para este cliente</p>
          <button onClick={() => onNewDespacho(clienteId)} className="text-sm text-amber-600 font-medium mt-2 hover:underline">
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Despachos ({despachos.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {despachos.map((d) => (
              <button
                key={d.id}
                onClick={() => onNavigate({ type: 'despacho', id: d.id })}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-800">{d.numero_despacho}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${DESPACHO_TIPO_COLORS[d.tipo]}`}>
                      {DESPACHO_TIPO_LABELS[d.tipo]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${DESPACHO_ESTADO_COLORS[d.estado]}`}>
                      {DESPACHO_ESTADO_LABELS[d.estado]}
                    </span>
                  </div>
                  {d.descripcion && <p className="text-xs text-slate-400 mt-0.5 truncate">{d.descripcion}</p>}
                </div>
                <div className="text-right">
                  {d.valor_fob && <p className="text-sm font-medium text-slate-700">{DespachoService.formatMonto(d.valor_fob, d.moneda)}</p>}
                  <p className="text-xs text-slate-400">{new Date(d.created_at).toLocaleDateString('es-AR')}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
