import { useState, useEffect } from 'react';
import {
  Shield, FlaskConical, Leaf, Briefcase, Users, DollarSign,
  type LucideIcon, Loader2, ChevronRight,
} from 'lucide-react';
import { supabase, filterActive } from '../../lib/supabase';
import type { Page } from '../Layout/Layout';

// ─── Module definitions ───

interface ModuleCard {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  gradient: string;       // icon background gradient
  iconColor: string;      // icon svg color
  borderHover: string;    // hover border accent
  page: Page;
  statQuery?: () => Promise<number>;
  statLabel?: string;
}

const MODULES: ModuleCard[] = [
  {
    id: 'anmat',
    label: 'ANMAT',
    description: 'Dispositivos médicos, cosméticos',
    icon: Shield,
    gradient: 'from-indigo-500 to-violet-600',
    iconColor: 'text-white',
    borderHover: 'hover:border-indigo-300',
    page: { type: 'anmat' },
    statLabel: 'trámites ANMAT',
    statQuery: async () => {
      const { count } = await filterActive(
        supabase
          .from('tramites')
          .select('*', { count: 'exact', head: true })
      ).eq('organismo', 'ANMAT').in('estado', ['en_curso', 'esperando_organismo', 'observado']);
      return count || 0;
    },
  },
  {
    id: 'inal',
    label: 'INAL',
    description: 'Alimentos, envases, RNE/RNPA',
    icon: FlaskConical,
    gradient: 'from-emerald-500 to-teal-600',
    iconColor: 'text-white',
    borderHover: 'hover:border-emerald-300',
    page: { type: 'inal' },
    statLabel: 'trámites INAL',
    statQuery: async () => {
      const { count } = await filterActive(
        supabase
          .from('tramites')
          .select('*', { count: 'exact', head: true })
      ).eq('organismo', 'INAL').in('estado', ['en_curso', 'esperando_organismo', 'observado']);
      return count || 0;
    },
  },
  {
    id: 'senasa',
    label: 'SENASA',
    description: 'Fitosanitarios, veterinarios',
    icon: Leaf,
    gradient: 'from-orange-500 to-amber-600',
    iconColor: 'text-white',
    borderHover: 'hover:border-orange-300',
    page: { type: 'senasa' },
    statLabel: 'trámites SENASA',
    statQuery: async () => {
      const { count } = await filterActive(
        supabase
          .from('tramites')
          .select('*', { count: 'exact', head: true })
      ).eq('organismo', 'SENASA').in('estado', ['en_curso', 'esperando_organismo', 'observado']);
      return count || 0;
    },
  },
  {
    id: 'gestiones',
    label: 'Gestiones',
    description: 'Proyectos y casos activos',
    icon: Briefcase,
    gradient: 'from-blue-500 to-blue-600',
    iconColor: 'text-white',
    borderHover: 'hover:border-blue-300',
    page: { type: 'gestiones' },
    statLabel: 'gestiones activas',
    statQuery: async () => {
      const { count } = await filterActive(
        supabase
          .from('gestiones')
          .select('*', { count: 'exact', head: true })
      ).in('estado', ['relevamiento', 'en_curso', 'en_espera']);
      return count || 0;
    },
  },
  {
    id: 'clientes',
    label: 'Clientes',
    description: 'Directorio de clientes',
    icon: Users,
    gradient: 'from-purple-500 to-purple-600',
    iconColor: 'text-white',
    borderHover: 'hover:border-purple-300',
    page: { type: 'clientes' },
    statLabel: 'clientes registrados',
    statQuery: async () => {
      const { count } = await filterActive(
        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
      );
      return count || 0;
    },
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    description: 'Facturación y contabilidad',
    icon: DollarSign,
    gradient: 'from-green-500 to-emerald-600',
    iconColor: 'text-white',
    borderHover: 'hover:border-green-300',
    page: { type: 'finanzas' },
    statLabel: 'cotizaciones activas',
    statQuery: async () => {
      const { count } = await supabase
        .from('cotizaciones')
        .select('*', { count: 'exact', head: true })
        .in('estado', ['enviada', 'negociacion']);
      return count || 0;
    },
  },
];

// ─── Component ───

interface Props {
  onNavigate: (page: any) => void;
}

export default function ModuleSelector({ onNavigate }: Props) {
  const [stats, setStats] = useState<Record<string, number | null>>({});
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      const results: Record<string, number | null> = {};

      await Promise.allSettled(
        MODULES.map(async (mod) => {
          if (!mod.statQuery) return;
          try {
            const count = await mod.statQuery();
            if (!cancelled) {
              results[mod.id] = count;
            }
          } catch {
            results[mod.id] = null;
          }
        })
      );

      if (!cancelled) {
        setStats(results);
        setLoadingStats(false);
      }
    };

    loadStats();
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <h2 className="font-semibold text-slate-800 text-[15px] mb-3 flex items-center gap-2">
        Módulos
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const stat = stats[mod.id];

          return (
            <button
              key={mod.id}
              onClick={() => onNavigate(mod.page)}
              className={`
                group relative bg-white rounded-2xl border border-slate-200/60
                shadow-sm shadow-slate-200/50 p-5
                text-left transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                ${mod.borderHover}
                focus:outline-none focus:ring-2 focus:ring-blue-500/30
              `}
            >
              {/* Icon */}
              <div
                className={`
                  w-10 h-10 rounded-xl bg-gradient-to-br ${mod.gradient}
                  flex items-center justify-center mb-3
                  shadow-sm
                `}
              >
                <Icon className={`w-5 h-5 ${mod.iconColor}`} />
              </div>

              {/* Text */}
              <div className="font-semibold text-slate-800 text-[15px] leading-tight">
                {mod.label}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                {mod.description}
              </div>

              {/* Stat badge */}
              {mod.statQuery && (
                <div className="mt-3 text-xs text-slate-500">
                  {loadingStats ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin text-slate-300" />
                      <span className="text-slate-300">Cargando...</span>
                    </span>
                  ) : stat !== null && stat !== undefined ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 font-medium">
                      {stat} {mod.statLabel}
                    </span>
                  ) : null}
                </div>
              )}

              {/* Arrow on hover */}
              <ChevronRight
                className="
                  absolute top-5 right-4 w-4 h-4 text-slate-300
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                "
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
