/**
 * GlobalSearch — Ctrl+K command palette for quick navigation.
 * Searches across clientes, gestiones, and tramites via Supabase.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Users, Briefcase, FileText, X, Loader2 } from 'lucide-react';
import { supabase, filterActive } from '../../lib/supabase';
import type { Page } from './Layout';

interface Props {
  onNavigate: (page: Page) => void;
}

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  type: 'cliente' | 'gestion' | 'tramite';
}

const TYPE_CONFIG = {
  cliente: { icon: Users, title: 'Clientes', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  gestion: { icon: Briefcase, title: 'Gestiones', color: 'text-blue-500', bg: 'bg-blue-50' },
  tramite: { icon: FileText, title: 'Trámites', color: 'text-violet-500', bg: 'bg-violet-50' },
} as const;

export default function GlobalSearch({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Open on Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
    }
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const navigateTo = useCallback((result: SearchResult) => {
    close();
    if (result.type === 'cliente') onNavigate({ type: 'cliente', id: result.id });
    else if (result.type === 'gestion') onNavigate({ type: 'gestion', id: result.id });
    else if (result.type === 'tramite') onNavigate({ type: 'tramite', id: result.id });
  }, [close, onNavigate]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const q = query.trim().toLowerCase();
      const allResults: SearchResult[] = [];

      try {
        // Search clientes
        const { data: clientes } = await filterActive(
          supabase
            .from('clientes')
            .select('id, razon_social, cuit')
            .or(`razon_social.ilike.%${q}%,cuit.ilike.%${q}%`)
        ).limit(5);

        if (clientes) {
          for (const c of clientes) {
            allResults.push({
              id: c.id,
              label: c.razon_social,
              sublabel: c.cuit || 'Sin CUIT',
              type: 'cliente',
            });
          }
        }

        // Search gestiones
        const { data: gestiones } = await filterActive(
          supabase
            .from('gestiones')
            .select('id, nombre, clientes(razon_social)')
            .ilike('nombre', `%${q}%`)
        ).limit(5);

        if (gestiones) {
          for (const g of gestiones) {
            allResults.push({
              id: g.id,
              label: g.nombre,
              sublabel: (g.clientes as any)?.razon_social || '',
              type: 'gestion',
            });
          }
        }

        // Search tramites
        const { data: tramites } = await filterActive(
          supabase
            .from('tramites')
            .select('id, titulo, numero_expediente, gestiones(nombre)')
            .or(`titulo.ilike.%${q}%,numero_expediente.ilike.%${q}%`)
        ).limit(5);

        if (tramites) {
          for (const t of tramites) {
            allResults.push({
              id: t.id,
              label: t.titulo,
              sublabel: t.numero_expediente || (t.gestiones as any)?.nombre || '',
              type: 'tramite',
            });
          }
        }
      } catch {
        // silently fail
      }

      setResults(allResults);
      setSelectedIdx(0);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      e.preventDefault();
      navigateTo(results[selectedIdx]);
    }
  };

  if (!open) return null;

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  // Flatten for index tracking
  let flatIdx = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar clientes, gestiones, trámites..."
            className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />}
          <button onClick={close} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.trim() && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Sin resultados para &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {(['cliente', 'gestion', 'tramite'] as const).map(type => {
            const items = grouped[type];
            if (!items?.length) return null;
            const cfg = TYPE_CONFIG[type];
            const Icon = cfg.icon;

            return (
              <div key={type}>
                <div className="px-4 pt-3 pb-1">
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${cfg.color}`}>
                    {cfg.title}
                  </span>
                </div>
                {items.map(item => {
                  const idx = flatIdx++;
                  const isSelected = idx === selectedIdx;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-xs text-slate-400 truncate">{item.sublabel}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4 text-[11px] text-slate-400">
          <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Enter</kbd> abrir</span>
          <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">Esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}
