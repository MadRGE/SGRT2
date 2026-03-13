/**
 * ModuloVencimientos — Compact card showing upcoming expirations for a given organismo.
 * Fetches from vencimientos + tramites with fecha_vencimiento within 30 days.
 */
import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { supabase, filterActive } from '../../lib/supabase';

interface Props {
  organismo: string;
  color: string;       // gradient classes, e.g. 'from-emerald-500 to-teal-600'
  limit?: number;
}

interface VencimientoItem {
  id: string;
  descripcion: string;
  fecha: string;
  clienteNombre: string;
  source: 'vencimiento' | 'tramite';
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return 'text-red-600 bg-red-50';
  if (days <= 7) return 'text-amber-600 bg-amber-50';
  return 'text-emerald-600 bg-emerald-50';
}

function urgencyDot(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return 'bg-red-500';
  if (days <= 7) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

export default function ModuloVencimientos({ organismo, color, limit = 5 }: Props) {
  const [items, setItems] = useState<VencimientoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVencimientos();
  }, [organismo]);

  const loadVencimientos = async () => {
    setLoading(true);
    const allItems: VencimientoItem[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const future = new Date(today);
    future.setDate(future.getDate() + 30);
    const futureStr = future.toISOString().split('T')[0];

    try {
      // 1) vencimientos table — join through tramite to filter by organismo
      const { data: vencimientos } = await supabase
        .from('vencimientos')
        .select('id, descripcion, fecha_vencimiento, clientes(razon_social), tramite_id')
        .lte('fecha_vencimiento', futureStr)
        .gte('fecha_vencimiento', todayStr)
        .order('fecha_vencimiento', { ascending: true })
        .limit(20);

      if (vencimientos) {
        // We need to check if each vencimiento's tramite belongs to this organismo.
        // If tramite_id is null, we still include it (general vencimiento).
        const tramiteIds = vencimientos
          .map(v => v.tramite_id)
          .filter((id): id is string => !!id);

        let orgTramiteIds = new Set<string>();
        if (tramiteIds.length > 0) {
          const { data: tramitesOrg } = await supabase
            .from('tramites')
            .select('id')
            .in('id', tramiteIds)
            .eq('organismo', organismo);
          if (tramitesOrg) {
            orgTramiteIds = new Set(tramitesOrg.map(t => t.id));
          }
        }

        for (const v of vencimientos) {
          // Include if tramite belongs to organismo, or if no tramite (general)
          if (v.tramite_id && !orgTramiteIds.has(v.tramite_id)) continue;
          if (!v.tramite_id) continue; // skip orphan vencimientos without tramite for module view

          allItems.push({
            id: v.id,
            descripcion: v.descripcion,
            fecha: v.fecha_vencimiento,
            clienteNombre: (v.clientes as any)?.razon_social || '',
            source: 'vencimiento',
          });
        }
      }

      // 2) tramites with fecha_vencimiento for this organismo
      const { data: tramites } = await filterActive(
        supabase
          .from('tramites')
          .select('id, titulo, fecha_vencimiento, gestiones(clientes(razon_social))')
          .eq('organismo', organismo)
          .not('fecha_vencimiento', 'is', null)
          .lte('fecha_vencimiento', futureStr)
      ).order('fecha_vencimiento', { ascending: true }).limit(20);

      if (tramites) {
        for (const t of tramites) {
          if (!t.fecha_vencimiento) continue;
          // Avoid duplicates with vencimientos already added
          if (allItems.some(i => i.source === 'vencimiento' && i.descripcion === t.titulo)) continue;
          allItems.push({
            id: `t-${t.id}`,
            descripcion: t.titulo,
            fecha: t.fecha_vencimiento,
            clienteNombre: (t.gestiones as any)?.clientes?.razon_social || '',
            source: 'tramite',
          });
        }
      }

      // Sort by date
      allItems.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    } catch {
      // silently fail
    }

    setItems(allItems.slice(0, limit));
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2.5">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
          <Calendar className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">Vencimientos pr&oacute;ximos</h3>
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center">
            <CheckCircle className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400">Sin vencimientos pr&oacute;ximos</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {items.map(item => {
              const days = daysUntil(item.fecha);
              return (
                <li key={item.id} className="flex items-start gap-3 py-2.5">
                  {/* Urgency dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${urgencyDot(item.fecha)}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">{item.descripcion}</p>
                    {item.clienteNombre && (
                      <p className="text-xs text-slate-400 truncate">{item.clienteNombre}</p>
                    )}
                  </div>

                  {/* Date badge */}
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${urgencyColor(item.fecha)}`}>
                    {days < 0 ? `Vencido ${formatDate(item.fecha)}` :
                     days === 0 ? 'Hoy' :
                     days === 1 ? 'Mañana' :
                     formatDate(item.fecha)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
