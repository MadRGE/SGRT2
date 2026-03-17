"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, Search, FolderOpen, Package, ChevronRight } from "lucide-react";

interface Cliente {
  id: string;
  razonSocial: string;
  cuit: string | null;
  email: string | null;
  rne: string | null;
  _count: { gestiones: number; productos: number };
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ razonSocial: "", cuit: "", email: "", telefono: "", direccion: "", rne: "" });

  useEffect(() => {
    loadClientes();
  }, []);

  function loadClientes() {
    const token = localStorage.getItem("token");
    fetch("/api/clientes", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setClientes)
      .catch(console.error);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ razonSocial: "", cuit: "", email: "", telefono: "", direccion: "", rne: "" });
    loadClientes();
  }

  const filtered = clientes.filter((c) =>
    c.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
    c.cuit?.includes(search)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-regulatorio" />
          <h1 className="text-xl font-bold">Clientes</h1>
          <span className="text-sm text-text-secondary">({clientes.length})</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-regulatorio font-semibold rounded-lg text-sm transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-bg-card rounded-xl border border-border p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: "razonSocial", label: "Razón Social *", required: true },
            { key: "cuit", label: "CUIT" },
            { key: "email", label: "Email" },
            { key: "telefono", label: "Teléfono" },
            { key: "direccion", label: "Dirección" },
            { key: "rne", label: "RNE" },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium text-text-secondary">{f.label}</label>
              <input
                value={form[f.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                required={f.required}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-regulatorio outline-none"
              />
            </div>
          ))}
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-regulatorio text-white text-sm font-medium rounded-lg hover:bg-regulatorio-light">Guardar</button>
          </div>
        </form>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por razón social o CUIT..."
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-regulatorio outline-none"
        />
      </div>

      <div className="bg-bg-card rounded-xl border border-border divide-y divide-border-light">
        {filtered.map((c) => (
          <Link key={c.id} href={`/clientes/${c.id}`} className="flex items-center justify-between p-4 hover:bg-bg-hover transition">
            <div>
              <p className="font-medium text-sm">{c.razonSocial}</p>
              <div className="flex gap-3 mt-1 text-xs text-text-secondary">
                {c.cuit && <span>CUIT: {c.cuit}</span>}
                {c.rne && <span>RNE: {c.rne}</span>}
                {c.email && <span>{c.email}</span>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs text-text-secondary">
                <FolderOpen className="w-3.5 h-3.5" /> {c._count.gestiones}
              </div>
              <div className="flex items-center gap-1 text-xs text-text-secondary">
                <Package className="w-3.5 h-3.5" /> {c._count.productos}
              </div>
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-text-secondary text-sm">
            {clientes.length === 0 ? "Sin clientes. Creá el primero." : "Sin resultados."}
          </div>
        )}
      </div>
    </div>
  );
}
