import { useState, useEffect } from 'react';
import { Loader2, Users, Search, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DespachoService } from '../../services/DespachoService';
import { supabase, filterActive } from '../../lib/supabase';

interface ClienteAsignado {
  id: string;
  cliente_id: string;
  notas?: string | null;
  clientes: {
    id: string;
    razon_social: string;
    cuit: string;
    domicilio?: string | null;
    telefono?: string | null;
    email?: string | null;
  } | null;
}

interface Props {
  onNavigate: (view: any) => void;
}

export default function DespachanteClientesPage({ onNavigate }: Props) {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<ClienteAsignado[]>([]);
  const [despachosCount, setDespachosCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    const data = await DespachoService.getClientesByDespachante(user!.id);
    setClientes(data);

    // Count active despachos per client
    const { data: despachos } = await filterActive(
      supabase
        .from('despachos')
        .select('cliente_id')
        .eq('despachante_id', user!.id)
        .not('estado', 'in', '("liberado","rechazado")')
    );

    const counts: Record<string, number> = {};
    (despachos || []).forEach((d: { cliente_id: string }) => {
      counts[d.cliente_id] = (counts[d.cliente_id] || 0) + 1;
    });
    setDespachosCount(counts);
    setLoading(false);
  };

  const filtered = search
    ? clientes.filter((c) => {
        const s = search.toLowerCase();
        return (
          c.clientes?.razon_social?.toLowerCase().includes(s) ||
          c.clientes?.cuit?.toLowerCase().includes(s)
        );
      })
    : clientes;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-amber-600" />
          Mis Clientes
        </h1>
        <p className="text-sm text-slate-500 mt-1">{filtered.length} cliente{filtered.length !== 1 ? 's' : ''} asignado{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por razón social o CUIT..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Client cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">
            {search ? 'No se encontraron clientes' : 'No tiene clientes asignados'}
          </p>
          {!search && <p className="text-xs text-slate-400 mt-1">Contacte al administrador para asignar clientes.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onNavigate({ type: 'cliente', id: c.cliente_id })}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 text-left hover:shadow-md hover:border-amber-200 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-amber-50 group-hover:to-amber-100 transition-colors">
                  <Building2 className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate group-hover:text-amber-700 transition-colors">
                    {c.clientes?.razon_social || 'Sin nombre'}
                  </p>
                  {c.clientes?.cuit && (
                    <p className="text-xs text-slate-400 font-mono mt-0.5">CUIT: {c.clientes.cuit}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                {despachosCount[c.cliente_id] ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                    {despachosCount[c.cliente_id]} activo{despachosCount[c.cliente_id] !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                    Sin despachos activos
                  </span>
                )}
              </div>

              {c.notas && (
                <p className="text-xs text-slate-400 mt-2 truncate">{c.notas}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
