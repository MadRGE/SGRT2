"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, Plus, Search, ChevronRight } from "lucide-react";
import { GESTION_ESTADOS, GESTION_LABELS, GESTION_COLORS } from "@/lib/state-machines";

interface Gestion {
  id: string;
  nombre: string;
  estado: string;
  prioridad: string;
  createdAt: string;
  updatedAt: string;
  cliente: { razonSocial: string };
  _count: { expedientes: number };
  expedientes: Array<{ estado: string; semaforo: string; tramiteTipo: { nombre: string; organismo: { nombre: string } } }>;
}

export default function GestionesPage() {
  const [gestiones, setGestiones] = useState<Gestion[]>([]);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    if (filtroEstado) params.set("estado", filtroEstado);
    fetch(`/api/gestiones?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setGestiones)
      .catch(console.error);
  }, [filtroEstado]);

  const filtered = gestiones.filter((g) =>
    g.nombre.toLowerCase().includes(search.toLowerCase()) ||
    g.cliente.razonSocial.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-regulatorio" />
          <h1 className="text-xl font-bold">Gestiones</h1>
          <span className="text-sm text-text-secondary">({gestiones.length})</span>
        </div>
        <Link
          href="/gestiones/nueva"
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-regulatorio font-semibold rounded-lg text-sm transition"
        >
          <Plus className="w-4 h-4" />
          Nueva Gestión
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar gestión o cliente..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-regulatorio outline-none"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2.5 border border-border rounded-lg text-sm bg-white"
        >
          <option value="">Todos los estados</option>
          {GESTION_ESTADOS.map((e) => (
            <option key={e} value={e}>{GESTION_LABELS[e]}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((g) => (
          <Link key={g.id} href={`/gestiones/${g.id}`} className="block bg-bg-card rounded-xl border border-border p-5 hover:border-regulatorio/30 transition">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">{g.nombre}</p>
                <p className="text-xs text-text-secondary">{g.cliente.razonSocial}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${GESTION_COLORS[g.estado] || ""}`}>
                  {GESTION_LABELS[g.estado] || g.estado}
                </span>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {g.expedientes.slice(0, 4).map((exp, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-hover rounded text-[11px] text-text-secondary">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    exp.semaforo === "verde" ? "bg-success" : exp.semaforo === "amarillo" ? "bg-warning" : "bg-danger"
                  }`} />
                  {exp.tramiteTipo.organismo.nombre} · {exp.tramiteTipo.nombre.slice(0, 30)}
                </span>
              ))}
              {g.expedientes.length > 4 && (
                <span className="text-[11px] text-text-secondary">+{g.expedientes.length - 4} más</span>
              )}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-secondary text-sm">
            {gestiones.length === 0 ? "Sin gestiones. Creá la primera." : "Sin resultados."}
          </div>
        )}
      </div>
    </div>
  );
}
