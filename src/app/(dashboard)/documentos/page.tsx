"use client";

import { useEffect, useState } from "react";
import { FileText, Search, Circle } from "lucide-react";

interface Documento {
  id: string; nombre: string; estado: string; obligatorio: boolean;
  archivoUrl: string | null; vencimiento: string | null; responsable: string | null;
  expediente: { codigo: string; tramiteTipo: { nombre: string } } | null;
  cliente: { razonSocial: string } | null;
}

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    if (filtroEstado) params.set("estado", filtroEstado);
    fetch(`/api/documentos?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setDocs);
  }, [filtroEstado]);

  const filtered = docs.filter((d) => d.nombre.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    pendiente: docs.filter((d) => d.estado === "pendiente").length,
    cargado: docs.filter((d) => d.estado === "cargado").length,
    aprobado: docs.filter((d) => d.estado === "aprobado").length,
    vencido: docs.filter((d) => d.estado === "vencido").length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-regulatorio" />
        <h1 className="text-xl font-bold">Documentos</h1>
        <span className="text-sm text-text-secondary">({docs.length})</span>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Pendientes", count: stats.pendiente, color: "text-amber-600 bg-amber-50" },
          { label: "Cargados", count: stats.cargado, color: "text-blue-600 bg-blue-50" },
          { label: "Aprobados", count: stats.aprobado, color: "text-green-600 bg-green-50" },
          { label: "Vencidos", count: stats.vencido, color: "text-red-600 bg-red-50" },
        ].map((s) => (
          <button key={s.label} onClick={() => setFiltroEstado(filtroEstado === s.label.toLowerCase().slice(0, -1) ? "" : s.label.toLowerCase().slice(0, -1) + (s.label === "Pendientes" ? "e" : s.label === "Cargados" ? "o" : s.label === "Aprobados" ? "o" : "o"))}
            className={`rounded-xl border border-border p-3 text-center transition hover:border-regulatorio/30 ${s.color.split(" ")[1]}`}>
            <p className={`text-xl font-bold ${s.color.split(" ")[0]}`}>{s.count}</p>
            <p className="text-[11px] text-text-secondary">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar documento..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-regulatorio" />
        </div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2.5 border border-border rounded-lg text-sm bg-white">
          <option value="">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="cargado">Cargado</option>
          <option value="aprobado">Aprobado</option>
          <option value="vencido">Vencido</option>
        </select>
      </div>

      <div className="bg-bg-card rounded-xl border border-border divide-y divide-border-light">
        {filtered.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Circle className={`w-2.5 h-2.5 ${
                d.estado === "aprobado" ? "text-success fill-success" :
                d.estado === "cargado" ? "text-blue-500 fill-blue-500" :
                d.estado === "vencido" ? "text-danger fill-danger" :
                "text-text-secondary"
              }`} />
              <div>
                <p className="text-sm font-medium">{d.nombre} {d.obligatorio && <span className="text-danger">*</span>}</p>
                <p className="text-[11px] text-text-secondary">
                  {d.expediente ? `${d.expediente.tramiteTipo.nombre}` : d.cliente?.razonSocial || "General"}
                  {d.responsable && ` · ${d.responsable}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                d.estado === "aprobado" ? "bg-green-50 text-green-700" :
                d.estado === "cargado" ? "bg-blue-50 text-blue-700" :
                d.estado === "vencido" ? "bg-red-50 text-red-700" :
                "bg-slate-50 text-slate-600"
              }`}>{d.estado}</span>
              {d.vencimiento && (
                <span className="text-[11px] text-text-secondary">
                  {new Date(d.vencimiento).toLocaleDateString("es-AR")}
                </span>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="p-6 text-center text-text-secondary text-sm">Sin documentos</p>}
      </div>
    </div>
  );
}
