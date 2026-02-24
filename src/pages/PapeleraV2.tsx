import { useState, useEffect } from 'react';
import { supabase, checkSoftDelete } from '../lib/supabase';
import { Trash2, RotateCcw, Loader2, Users, Briefcase, FileText, AlertTriangle, DollarSign } from 'lucide-react';

interface DeletedItem {
  id: string;
  type: 'cliente' | 'gestion' | 'tramite' | 'cotizacion';
  nombre: string;
  detalle: string;
  deleted_at: string;
  dias_restantes: number;
}

export default function PapeleraV2() {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notReady, setNotReady] = useState(false);

  useEffect(() => { loadPapelera(); }, []);

  const loadPapelera = async () => {
    setLoading(true);
    setNotReady(false);
    const supported = await checkSoftDelete();
    if (!supported) {
      setItems([]);
      setNotReady(true);
      setLoading(false);
      return;
    }
    const now = Date.now();

    const [{ data: clientes }, { data: gestiones }, { data: tramites }] = await Promise.all([
      supabase.from('clientes').select('id, razon_social, cuit, deleted_at').not('deleted_at', 'is', null),
      supabase.from('gestiones').select('id, nombre, clientes(razon_social), deleted_at').not('deleted_at', 'is', null),
      supabase.from('tramites').select('id, titulo, organismo, deleted_at').not('deleted_at', 'is', null),
    ]);

    // Cotizaciones via Edge Function (bypasea PostgREST cache)
    const cotizacionesRes = await supabase.functions.invoke('cotizacion-actions', {
      body: { action: 'list-deleted' },
    });

    const all: DeletedItem[] = [];

    (clientes || []).forEach((c: any) => {
      const dias = 30 - Math.floor((now - new Date(c.deleted_at).getTime()) / (1000 * 60 * 60 * 24));
      all.push({ id: c.id, type: 'cliente', nombre: c.razon_social, detalle: c.cuit || '', deleted_at: c.deleted_at, dias_restantes: dias });
    });

    (gestiones || []).forEach((g: any) => {
      const dias = 30 - Math.floor((now - new Date(g.deleted_at).getTime()) / (1000 * 60 * 60 * 24));
      all.push({ id: g.id, type: 'gestion', nombre: g.nombre, detalle: g.clientes?.razon_social || '', deleted_at: g.deleted_at, dias_restantes: dias });
    });

    (tramites || []).forEach((t: any) => {
      const dias = 30 - Math.floor((now - new Date(t.deleted_at).getTime()) / (1000 * 60 * 60 * 24));
      all.push({ id: t.id, type: 'tramite', nombre: t.titulo, detalle: t.organismo || '', deleted_at: t.deleted_at, dias_restantes: dias });
    });

    const cotizaciones = cotizacionesRes.data?.data || [];
    (cotizaciones).forEach((c: any) => {
      const dias = 30 - Math.floor((now - new Date(c.deleted_at).getTime()) / (1000 * 60 * 60 * 24));
      all.push({ id: c.id, type: 'cotizacion', nombre: c.numero_cotizacion, detalle: c.nombre_cliente || '', deleted_at: c.deleted_at, dias_restantes: dias });
    });

    all.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
    setItems(all);
    setLoading(false);
  };

  const getTable = (type: string) => {
    switch (type) {
      case 'cliente': return 'clientes';
      case 'gestion': return 'gestiones';
      case 'tramite': return 'tramites';
      case 'cotizacion': return 'cotizaciones';
      default: return type;
    }
  };

  const handleRestore = async (item: DeletedItem) => {
    if (item.type === 'cotizacion') {
      await supabase.functions.invoke('cotizacion-actions', {
        body: { action: 'restore', cotizacionId: item.id },
      });
    } else {
      const table = getTable(item.type);
      await supabase.from(table).update({ deleted_at: null }).eq('id', item.id);

      if (item.type === 'gestion') {
        await supabase.from('tramites').update({ deleted_at: null }).eq('gestion_id', item.id);
      }
      if (item.type === 'cliente') {
        await supabase.from('gestiones').update({ deleted_at: null }).eq('cliente_id', item.id);
        await supabase.from('tramites').update({ deleted_at: null }).eq('cliente_id', item.id);
      }
    }

    loadPapelera();
  };

  const handleDeletePermanent = async (item: DeletedItem) => {
    if (!confirm(`¿Eliminar "${item.nombre}" de forma PERMANENTE? No se puede recuperar.`)) return;

    if (item.type === 'cotizacion') {
      await supabase.functions.invoke('cotizacion-actions', {
        body: { action: 'hard-delete', cotizacionId: item.id },
      });
    } else {
      const table = getTable(item.type);
      await supabase.from(table).delete().eq('id', item.id);
    }

    loadPapelera();
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'cliente': return <Users className="w-4 h-4" />;
      case 'gestion': return <Briefcase className="w-4 h-4" />;
      case 'tramite': return <FileText className="w-4 h-4" />;
      case 'cotizacion': return <DollarSign className="w-4 h-4" />;
      default: return null;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case 'cliente': return 'Cliente';
      case 'gestion': return 'Gestión';
      case 'tramite': return 'Trámite';
      case 'cotizacion': return 'Cotización';
      default: return type;
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-[26px] tracking-tight font-bold text-slate-800 flex items-center gap-3">
          <Trash2 className="w-7 h-7 text-slate-400" /> Papelera
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Los elementos se eliminan permanentemente después de 30 días</p>
      </div>

      {notReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Papelera no disponible</p>
              <p className="text-sm text-amber-600 mt-1">
                Necesitás ejecutar la migración 64 en el SQL Editor de Supabase para habilitar la papelera.
                Copiá el contenido de <code className="bg-amber-100 px-1 rounded">supabase/migrations/64_soft_delete.sql</code> y ejecutalo.
              </p>
              <p className="text-sm text-amber-600 mt-1">
                Después ejecutá: <code className="bg-amber-100 px-1 rounded">NOTIFY pgrst, 'reload schema';</code>
              </p>
              <button onClick={loadPapelera} className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-900 underline">
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {!notReady && items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-12 text-center">
          <Trash2 className="w-12 h-12 mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400">La papelera está vacía</p>
        </div>
      ) : items.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm divide-y divide-slate-100/80">
          {items.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 p-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.type === 'cliente' ? 'bg-emerald-100 text-emerald-600' :
                item.type === 'gestion' ? 'bg-blue-100 text-blue-600' :
                item.type === 'cotizacion' ? 'bg-purple-100 text-purple-600' :
                'bg-violet-100 text-violet-600'
              }`}>
                {typeIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item.nombre}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{typeLabel(item.type)}</span>
                  {item.detalle && <span className="text-xs text-slate-400">{item.detalle}</span>}
                </div>
              </div>

              <div className="text-right flex-shrink-0 mr-2">
                {item.dias_restantes <= 5 ? (
                  <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {item.dias_restantes}d
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">{item.dias_restantes}d restantes</span>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleRestore(item)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                </button>
                <button
                  onClick={() => handleDeletePermanent(item)}
                  className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
