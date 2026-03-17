"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, Eye, Plus } from "lucide-react";

interface Alerta {
  id: string; modulo: string; titulo: string; detalle: string | null;
  impacto: string | null; leida: boolean; createdAt: string;
  organismo: { nombre: string } | null;
}

export default function VigiaRegulatorioPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: "", detalle: "", modulo: "", impacto: "medio" });

  function load() {
    const token = localStorage.getItem("token");
    fetch("/api/alertas", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setAlertas);
  }

  useEffect(() => { load(); }, []);

  async function marcarLeida(id: string) {
    const token = localStorage.getItem("token");
    await fetch("/api/alertas", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function crearAlerta(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch("/api/alertas", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ titulo: "", detalle: "", modulo: "", impacto: "medio" });
    load();
  }

  const noLeidas = alertas.filter((a) => !a.leida);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-regulatorio" />
          <h1 className="text-xl font-bold">Vigía Regulatorio</h1>
          {noLeidas.length > 0 && (
            <span className="px-2 py-0.5 bg-danger text-white text-xs rounded-full">{noLeidas.length} nuevas</span>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-regulatorio font-semibold rounded-lg text-sm">
          <Plus className="w-4 h-4" /> Nueva Alerta
        </button>
      </div>

      {showForm && (
        <form onSubmit={crearAlerta} className="bg-bg-card rounded-xl border border-border p-5 mb-6 space-y-3">
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título de la alerta" required
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-regulatorio" />
          <textarea value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })}
            placeholder="Detalle..." rows={2}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-regulatorio" />
          <div className="flex gap-3">
            <input value={form.modulo} onChange={(e) => setForm({ ...form, modulo: e.target.value })}
              placeholder="Módulo (ej: INAL, ANMAT)" className="flex-1 px-3 py-2 border border-border rounded-lg text-sm outline-none" />
            <select value={form.impacto} onChange={(e) => setForm({ ...form, impacto: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-white">
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-regulatorio text-white rounded-lg text-sm font-medium">Crear</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {alertas.map((a) => (
          <div key={a.id} className={`bg-bg-card rounded-xl border p-4 flex items-start justify-between ${
            a.leida ? "border-border opacity-60" : "border-warning/30"
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                a.impacto === "alto" ? "text-danger" : a.impacto === "medio" ? "text-warning" : "text-text-secondary"
              }`} />
              <div>
                <p className="text-sm font-medium">{a.titulo}</p>
                {a.detalle && <p className="text-xs text-text-secondary mt-0.5">{a.detalle}</p>}
                <div className="flex gap-2 mt-1 text-[11px] text-text-secondary">
                  {a.modulo && <span>{a.modulo}</span>}
                  {a.organismo && <span>· {a.organismo.nombre}</span>}
                  <span>· {new Date(a.createdAt).toLocaleDateString("es-AR")}</span>
                </div>
              </div>
            </div>
            {!a.leida && (
              <button onClick={() => marcarLeida(a.id)} className="text-xs text-regulatorio-light hover:underline flex items-center gap-1">
                <Eye className="w-3 h-3" /> Leída
              </button>
            )}
          </div>
        ))}
        {alertas.length === 0 && <p className="text-center py-8 text-text-secondary text-sm">Sin alertas regulatorias</p>}
      </div>
    </div>
  );
}
