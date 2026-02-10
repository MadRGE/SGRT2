import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';

interface Props {
  gestionId: string;
  onNavigate: (page: any) => void;
}

interface GestionData {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  fecha_inicio: string | null;
  clientes: {
    razon_social: string;
    cuit: string | null;
    email: string | null;
    telefono: string | null;
    direccion: string | null;
    banda_precio: number | null;
  } | null;
}

interface TramiteRow {
  id: string;
  titulo: string;
  organismo: string | null;
  plataforma: string | null;
  monto_presupuesto: number | null;
  tramite_tipos: {
    costo_organismo: number | null;
    honorarios: number | null;
    precio_banda_1: number | null;
    precio_banda_2: number | null;
    precio_banda_3: number | null;
    plazo_dias: number | null;
  } | null;
}

export default function PresupuestoV2({ gestionId, onNavigate }: Props) {
  const [gestion, setGestion] = useState<GestionData | null>(null);
  const [tramites, setTramites] = useState<TramiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [condiciones, setCondiciones] = useState('Los presentes honorarios no incluyen tasas ni aranceles oficiales de los organismos intervinientes.\nForma de pago: 50% al inicio de la gestion, 50% a la presentacion ante el organismo.\nValidez de esta cotizacion: 15 dias.');
  const [editingCondiciones, setEditingCondiciones] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadData(); }, [gestionId]);

  const loadData = async () => {
    setLoading(true);
    const { data: g } = await supabase
      .from('gestiones')
      .select('id, nombre, descripcion, estado, fecha_inicio, clientes(razon_social, cuit, email, telefono, direccion, banda_precio)')
      .eq('id', gestionId)
      .single();
    if (g) setGestion(g as any);

    const { data: t } = await supabase
      .from('tramites')
      .select('id, titulo, organismo, plataforma, monto_presupuesto, tramite_tipos(costo_organismo, honorarios, precio_banda_1, precio_banda_2, precio_banda_3, plazo_dias)')
      .eq('gestion_id', gestionId)
      .order('created_at', { ascending: true });
    setTramites((t as any) || []);
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!gestion) {
    return <div className="text-center py-20 text-slate-500">Gestion no encontrada</div>;
  }

  const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  const numero = `PRES-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${gestionId.slice(0, 4).toUpperCase()}`;

  const cliente = gestion.clientes;

  // Calculate totals using band pricing
  const bandaCliente = cliente?.banda_precio || 1;
  const bandaLabel = bandaCliente === 3 ? 'Urgente' : bandaCliente === 2 ? 'Prioritario' : 'Estandar';

  const items = tramites.map(t => {
    // Priority: monto_presupuesto (manual override) > band price > honorarios
    let honorarios = t.monto_presupuesto || 0;
    if (!honorarios && t.tramite_tipos) {
      const tt = t.tramite_tipos;
      if (bandaCliente === 3 && (tt.precio_banda_3 || 0) > 0) honorarios = tt.precio_banda_3!;
      else if (bandaCliente === 2 && (tt.precio_banda_2 || 0) > 0) honorarios = tt.precio_banda_2!;
      else if ((tt.precio_banda_1 || 0) > 0) honorarios = tt.precio_banda_1!;
      else honorarios = tt.honorarios || 0;
    }
    const tasa = t.tramite_tipos?.costo_organismo || 0;
    return {
      titulo: t.titulo,
      organismo: t.organismo,
      plataforma: t.plataforma,
      plazo: t.tramite_tipos?.plazo_dias,
      honorarios,
      tasa,
      total: honorarios + tasa,
    };
  });

  const subtotalHonorarios = items.reduce((sum, i) => sum + i.honorarios, 0);
  const subtotalTasas = items.reduce((sum, i) => sum + i.tasa, 0);
  const totalGeneral = subtotalHonorarios + subtotalTasas;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Controls - hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => onNavigate({ type: 'gestion', id: gestionId })} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Volver a Gestion
        </button>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Presupuesto document */}
      <div ref={printRef} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/50 print:shadow-none print:border-none print:rounded-none">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-slate-200 print:border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-sm">SG</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">SGT - Gestion de Tramites</h1>
                  <p className="text-xs text-slate-400">Consultoria Regulatoria</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-slate-800">PRESUPUESTO</h2>
              <p className="text-sm text-slate-500 font-mono mt-1">{numero}</p>
              <p className="text-sm text-slate-500 mt-1">{today}</p>
            </div>
          </div>
        </div>

        {/* Client info */}
        <div className="px-8 py-5 border-b border-slate-100 print:border-slate-200 bg-slate-50/50 print:bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full print:hidden ${
              bandaCliente === 3 ? 'bg-red-100 text-red-700' : bandaCliente === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
            }`}>
              Banda {bandaCliente} - {bandaLabel}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <p className="text-sm font-semibold text-slate-800">{cliente?.razon_social || 'Sin cliente'}</p>
            {cliente?.cuit && <p className="text-sm text-slate-600">CUIT: {cliente.cuit}</p>}
            {cliente?.email && <p className="text-sm text-slate-600">{cliente.email}</p>}
            {cliente?.telefono && <p className="text-sm text-slate-600">{cliente.telefono}</p>}
            {cliente?.direccion && <p className="text-sm text-slate-600 col-span-2">{cliente.direccion}</p>}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gestion</p>
            <p className="text-sm font-medium text-slate-800">{gestion.nombre}</p>
            {gestion.descripcion && <p className="text-xs text-slate-500 mt-0.5">{gestion.descripcion}</p>}
          </div>
        </div>

        {/* Items table */}
        <div className="px-8 py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Tramite</th>
                <th className="text-left py-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Organismo</th>
                <th className="text-right py-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Honorarios</th>
                <th className="text-right py-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Tasa Oficial</th>
                <th className="text-right py-2 font-semibold text-slate-600 text-xs uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 print:border-slate-200">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-800">{item.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.plataforma && <span className="text-xs text-slate-400">{item.plataforma}</span>}
                      {item.plazo && <span className="text-xs text-slate-400">{item.plazo} dias</span>}
                    </div>
                  </td>
                  <td className="py-3 text-slate-600">{item.organismo || '-'}</td>
                  <td className="py-3 text-right font-medium text-slate-800">
                    {item.honorarios > 0 ? `$${item.honorarios.toLocaleString('es-AR')}` : '-'}
                  </td>
                  <td className="py-3 text-right text-slate-600">
                    {item.tasa > 0 ? `$${item.tasa.toLocaleString('es-AR')}` : '-'}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-800">
                    {item.total > 0 ? `$${item.total.toLocaleString('es-AR')}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-4 border-t-2 border-slate-200 pt-4">
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal Honorarios:</span>
                  <span className="font-medium text-slate-800">${subtotalHonorarios.toLocaleString('es-AR')}</span>
                </div>
                {subtotalTasas > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal Tasas Oficiales:</span>
                    <span className="font-medium text-slate-600">${subtotalTasas.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                  <span className="text-slate-800">TOTAL:</span>
                  <span className="text-slate-900">${totalGeneral.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="px-8 py-5 border-t border-slate-200 bg-slate-50/50 print:bg-slate-50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Condiciones</p>
          {editingCondiciones ? (
            <div className="print:hidden">
              <textarea
                value={condiciones}
                onChange={e => setCondiciones(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={() => setEditingCondiciones(false)} className="mt-1 text-xs text-blue-600 hover:text-blue-700">Listo</button>
            </div>
          ) : (
            <div
              onClick={() => setEditingCondiciones(true)}
              className="cursor-pointer hover:bg-slate-100 rounded-lg p-2 -m-2 transition-colors print:cursor-default print:hover:bg-transparent print:p-0 print:m-0"
            >
              {condiciones.split('\n').map((line, i) => (
                <p key={i} className="text-xs text-slate-600 leading-relaxed">{line}</p>
              ))}
            </div>
          )}
        </div>

        {/* Footer / signature area */}
        <div className="px-8 py-8 border-t border-slate-200">
          <div className="flex justify-between items-end">
            <div className="text-xs text-slate-400">
              <p>Presupuesto generado el {today}</p>
              <p className="mt-0.5">{numero}</p>
            </div>
            <div className="text-center">
              <div className="w-48 border-b border-slate-300 mb-1"></div>
              <p className="text-xs text-slate-500">Firma y Sello</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
