"use client";

import { useEffect, useState } from "react";
import { BookOpen, Search, Clock, DollarSign, FileText } from "lucide-react";

interface TramiteTipo {
  id: string; codigo: string; nombre: string; categoria: string | null;
  subcategoria: string | null; plazoDias: number | null;
  costoOrganismo: number | null; honorarios: number | null;
  plataforma: string | null; documentacionObligatoria: unknown;
  observaciones: string | null; prioridad: string;
  organismo: { nombre: string };
}

export default function TramitesPage() {
  const [tramites, setTramites] = useState<TramiteTipo[]>([]);
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/tramites", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setTramites);
  }, []);

  const organismos = [...new Set(tramites.map((t) => t.organismo.nombre))].sort();

  const filtered = tramites.filter((t) => {
    if (orgFilter && t.organismo.nombre !== orgFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.nombre.toLowerCase().includes(q) || t.codigo.toLowerCase().includes(q) || t.categoria?.toLowerCase().includes(q);
    }
    return true;
  });

  const grouped = filtered.reduce<Record<string, TramiteTipo[]>>((acc, t) => {
    const org = t.organismo.nombre;
    if (!acc[org]) acc[org] = [];
    acc[org].push(t);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-regulatorio" />
        <h1 className="text-xl font-bold">Catálogo de Trámites</h1>
        <span className="text-sm text-text-secondary">({tramites.length} trámites)</span>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código o categoría..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-regulatorio outline-none" />
        </div>
        <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}
          className="px-3 py-2.5 border border-border rounded-lg text-sm bg-white">
          <option value="">Todos los organismos</option>
          {organismos.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Org pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setOrgFilter("")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!orgFilter ? "bg-regulatorio text-white" : "bg-bg-hover text-text-secondary hover:bg-border"}`}>
          Todos ({tramites.length})
        </button>
        {organismos.map((o) => (
          <button key={o} onClick={() => setOrgFilter(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${orgFilter === o ? "bg-regulatorio text-white" : "bg-bg-hover text-text-secondary hover:bg-border"}`}>
            {o} ({tramites.filter((t) => t.organismo.nombre === o).length})
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([org, items]) => (
        <div key={org} className="mb-6">
          <h2 className="font-semibold text-sm text-text-secondary mb-3">{org} ({items.length})</h2>
          <div className="space-y-2">
            {items.map((t) => {
              const docs = (t.documentacionObligatoria as string[]) || [];
              return (
                <div key={t.id} className="bg-bg-card rounded-xl border border-border p-4 hover:border-regulatorio/20 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-text-secondary bg-bg-hover px-1.5 py-0.5 rounded">{t.codigo}</span>
                        {t.categoria && <span className="text-[10px] text-text-secondary">{t.categoria}</span>}
                        {t.subcategoria && <span className="text-[10px] text-regulatorio-light">{t.subcategoria}</span>}
                      </div>
                      <p className="font-medium text-sm">{t.nombre}</p>
                      {t.observaciones && <p className="text-xs text-text-secondary mt-1">{t.observaciones}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      t.prioridad === "alta" ? "bg-orange-100 text-orange-700" :
                      t.prioridad === "baja" ? "bg-slate-100 text-slate-600" :
                      "bg-blue-50 text-blue-600"
                    }`}>{t.prioridad}</span>
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-text-secondary">
                    {t.plazoDias && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t.plazoDias} días</span>}
                    {t.costoOrganismo && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${t.costoOrganismo.toLocaleString()}</span>}
                    {t.plataforma && <span>{t.plataforma}</span>}
                    {docs.length > 0 && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {docs.length} docs</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-secondary text-sm">Sin resultados para esta búsqueda.</div>
      )}
    </div>
  );
}
