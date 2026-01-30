import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Package, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import EnvaseForm from './EnvaseForm';

interface Props {
  empresaId: string;
}

interface Envase {
  id: string;
  codigo_interno: string | null;
  descripcion: string;
  marca_comercial: string | null;
  fabricante: string | null;
  categoria: string;
  material_principal: string;
  nivel_riesgo: string;
  numero_registro: string | null;
  estado: string;
  created_at: string;
}

const CATEGORIAS = [
  { value: 'todos', label: 'Todas las categorias' },
  { value: 'envase_primario', label: 'Envase Primario' },
  { value: 'tapa_cierre', label: 'Tapa/Cierre' },
  { value: 'film_flexible', label: 'Film Flexible' },
  { value: 'botella', label: 'Botella' },
  { value: 'frasco', label: 'Frasco' },
  { value: 'otro', label: 'Otro' }
];

const ESTADOS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'en_tramite', label: 'En Tramite' },
  { value: 'vigente', label: 'Vigente' },
  { value: 'vencido', label: 'Vencido' }
];

export default function EnvasesList({ empresaId }: Props) {
  const [envases, setEnvases] = useState<Envase[]>([]);
  const [filteredEnvases, setFilteredEnvases] = useState<Envase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingEnvase, setEditingEnvase] = useState<Envase | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => { loadEnvases(); }, [empresaId]);
  useEffect(() => { filterEnvases(); }, [envases, searchTerm, filtroCategoria, filtroEstado]);

  const loadEnvases = async () => {
    setLoading(true);
    const { data } = await supabase.from('envases').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false });
    if (data) setEnvases(data);
    setLoading(false);
  };

  const filterEnvases = () => {
    let filtered = [...envases];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => e.descripcion?.toLowerCase().includes(term) || e.codigo_interno?.toLowerCase().includes(term));
    }
    if (filtroCategoria !== 'todos') filtered = filtered.filter(e => e.categoria === filtroCategoria);
    if (filtroEstado !== 'todos') filtered = filtered.filter(e => e.estado === filtroEstado);
    setFilteredEnvases(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este envase?')) return;
    await supabase.from('envases').delete().eq('id', id);
    loadEnvases();
    setMenuOpen(null);
  };

  const getEstadoBadge = (estado: string) => {
    const estilos: Record<string, string> = { borrador: 'bg-slate-100 text-slate-700', en_tramite: 'bg-blue-100 text-blue-700', vigente: 'bg-emerald-100 text-emerald-700', vencido: 'bg-red-100 text-red-700' };
    return estilos[estado] || 'bg-slate-100 text-slate-700';
  };

  if (showForm) {
    return <EnvaseForm empresaId={empresaId} envase={editingEnvase} onClose={() => { setShowForm(false); setEditingEnvase(null); }} onSuccess={() => { setShowForm(false); setEditingEnvase(null); loadEnvases(); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg" />
          </div>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Nuevo Envase
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : filteredEnvases.length === 0 ? (
        <div className="text-center py-12 text-slate-500"><Package className="w-16 h-16 mx-auto mb-4 opacity-20" /><p>No hay envases registrados</p></div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Envase</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Material</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Riesgo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Estado</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnvases.map((envase) => (
                <tr key={envase.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3"><p className="font-medium text-slate-800">{envase.descripcion}</p>{envase.codigo_interno && <p className="text-xs text-slate-500">Cod: {envase.codigo_interno}</p>}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{envase.material_principal}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${envase.nivel_riesgo === 'I' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{envase.nivel_riesgo}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(envase.estado)}`}>{envase.estado}</span></td>
                  <td className="px-4 py-3 text-center relative">
                    <button onClick={() => setMenuOpen(menuOpen === envase.id ? null : envase.id)} className="p-1 text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></button>
                    {menuOpen === envase.id && (
                      <div className="absolute right-4 top-10 bg-white border rounded-lg shadow-lg z-10 py-1">
                        <button onClick={() => { setEditingEnvase(envase); setShowForm(true); setMenuOpen(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><Edit2 className="w-4 h-4" />Editar</button>
                        <button onClick={() => handleDelete(envase.id)} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4" />Eliminar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {menuOpen && <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
