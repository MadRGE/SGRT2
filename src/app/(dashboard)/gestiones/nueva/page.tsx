"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Search, Check, ArrowLeft, Loader2 } from "lucide-react";
import { PRIORIDADES } from "@/lib/state-machines";

interface Cliente { id: string; razonSocial: string; cuit: string | null }
interface TramiteTipo {
  id: string; codigo: string; nombre: string; categoria: string | null;
  plazoDias: number | null; costoOrganismo: number | null; honorarios: number | null;
  plataforma: string | null; documentacionObligatoria: string[] | null;
  organismo: { nombre: string };
}

export default function NuevaGestionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tramiteTipos, setTramiteTipos] = useState<TramiteTipo[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedTramites, setSelectedTramites] = useState<TramiteTipo[]>([]);
  const [nombre, setNombre] = useState("");
  const [prioridad, setPrioridad] = useState("normal");
  const [descripcion, setDescripcion] = useState("");
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/clientes", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setClientes);
    fetch("/api/tramites", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setTramiteTipos);
  }, []);

  const organismos = [...new Set(tramiteTipos.map((t) => t.organismo.nombre))].sort();

  const filteredTramites = tramiteTipos.filter((t) => {
    if (orgFilter && t.organismo.nombre !== orgFilter) return false;
    if (search && !t.nombre.toLowerCase().includes(search.toLowerCase()) && !t.codigo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function toggleTramite(t: TramiteTipo) {
    setSelectedTramites((prev) =>
      prev.find((s) => s.id === t.id) ? prev.filter((s) => s.id !== t.id) : [...prev, t]
    );
  }

  async function handleSubmit() {
    if (!selectedCliente || selectedTramites.length === 0) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("/api/gestiones", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        clienteId: selectedCliente.id,
        nombre,
        prioridad,
        descripcion,
        tramiteTipoIds: selectedTramites.map((t) => t.id),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) router.push(`/gestiones/${data.gestion.id}`);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="flex items-center gap-3 mb-6">
        <FolderOpen className="w-6 h-6 text-regulatorio" />
        <h1 className="text-xl font-bold">Nueva Gestión</h1>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2 mb-6">
        {["Cliente", "Trámites", "Datos"].map((label, i) => (
          <div key={label} className={`flex-1 h-1.5 rounded-full ${step > i ? "bg-regulatorio" : "bg-border"}`} />
        ))}
      </div>

      {/* Step 1: Select Client */}
      {step === 1 && (
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-4">1. Seleccioná el cliente</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {clientes.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedCliente(c); setStep(2); }}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedCliente?.id === c.id ? "border-regulatorio bg-regulatorio/5" : "border-border hover:border-regulatorio/30"
                }`}
              >
                <p className="font-medium text-sm">{c.razonSocial}</p>
                {c.cuit && <p className="text-xs text-text-secondary">CUIT: {c.cuit}</p>}
              </button>
            ))}
            {clientes.length === 0 && (
              <p className="text-sm text-text-secondary text-center py-4">Sin clientes. Creá uno primero en /clientes.</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Tramites */}
      {step === 2 && (
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-1">2. Seleccioná los trámites</h2>
          <p className="text-xs text-text-secondary mb-4">Para: {selectedCliente?.razonSocial}</p>

          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar trámite..."
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-regulatorio" />
            </div>
            <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-white">
              <option value="">Todos</option>
              {organismos.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {selectedTramites.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {selectedTramites.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1 px-2 py-1 bg-regulatorio/10 text-regulatorio text-xs rounded-lg">
                  {t.codigo} <button onClick={() => toggleTramite(t)} className="hover:text-danger">&times;</button>
                </span>
              ))}
            </div>
          )}

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {filteredTramites.map((t) => {
              const selected = selectedTramites.some((s) => s.id === t.id);
              return (
                <button key={t.id} onClick={() => toggleTramite(t)}
                  className={`w-full text-left p-3 rounded-lg border transition text-sm ${
                    selected ? "border-regulatorio bg-regulatorio/5" : "border-border-light hover:border-regulatorio/30"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-text-secondary">{t.codigo} · {t.organismo.nombre}</span>
                      <p className="font-medium text-sm">{t.nombre}</p>
                      <div className="flex gap-3 mt-0.5 text-[11px] text-text-secondary">
                        {t.plazoDias && <span>{t.plazoDias}d</span>}
                        {t.plataforma && <span>{t.plataforma}</span>}
                        {t.documentacionObligatoria && <span>{(t.documentacionObligatoria as string[]).length} docs</span>}
                      </div>
                    </div>
                    {selected && <Check className="w-5 h-5 text-regulatorio" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-4">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg">Atrás</button>
            <button onClick={() => setStep(3)} disabled={selectedTramites.length === 0}
              className="px-4 py-2 bg-regulatorio text-white text-sm font-medium rounded-lg hover:bg-regulatorio-light disabled:opacity-50">
              Siguiente ({selectedTramites.length})
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-4">3. Datos de la gestión</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary">Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder={selectedTramites.length === 1 ? selectedTramites[0].nombre : `${selectedTramites.length} trámites - ${selectedCliente?.razonSocial}`}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-regulatorio" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Prioridad</label>
              <div className="flex gap-2 mt-1">
                {PRIORIDADES.map((p) => (
                  <button key={p} onClick={() => setPrioridad(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm capitalize ${prioridad === p ? "bg-regulatorio text-white" : "bg-bg-hover text-text-secondary"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Descripción (opcional)</label>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-regulatorio" />
            </div>

            <div className="bg-bg-hover rounded-lg p-3">
              <p className="text-xs font-medium text-text-secondary mb-2">Resumen</p>
              <p className="text-sm">Cliente: <strong>{selectedCliente?.razonSocial}</strong></p>
              <p className="text-sm">{selectedTramites.length} trámites seleccionados</p>
              <p className="text-sm">Documentos auto-generados: {selectedTramites.reduce((acc, t) => acc + ((t.documentacionObligatoria as string[])?.length || 0), 0)}</p>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg">Atrás</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-regulatorio font-semibold rounded-lg text-sm disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
              Crear Gestión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
