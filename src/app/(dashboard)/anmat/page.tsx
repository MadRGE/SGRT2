"use client";

import { useEffect, useState } from "react";
import { Stethoscope, Plus, FileText, ChevronRight } from "lucide-react";
import { EXPEDIENTE_LABELS, EXPEDIENTE_COLORS } from "@/lib/state-machines";

interface AnmatData {
  casos: Array<{
    id: string; nombre: string; descripcion: string | null; estado: string;
    cliente: { razonSocial: string };
    requisitos: Array<{ documento: string; requerido: boolean; division: { nombre: string } }>;
  }>;
  divisiones: Array<{ id: string; nombre: string }>;
  tramitesAnmat: Array<{
    id: string; estado: string; semaforo: string;
    tramiteTipo: { nombre: string; organismo: { nombre: string } };
    gestion: { nombre: string; cliente: { razonSocial: string } };
  }>;
}

export default function AnmatPage() {
  const [data, setData] = useState<AnmatData | null>(null);
  const [tab, setTab] = useState<"tramites" | "casos">("tramites");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/anmat", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setData);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Stethoscope className="w-6 h-6 text-regulatorio" />
        <h1 className="text-xl font-bold">ANMAT</h1>
        <span className="text-sm text-text-secondary">Productos Médicos · Cosméticos · Domisanitarios</span>
      </div>

      <div className="flex gap-2 mb-6">
        {(["tramites", "casos"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              tab === t ? "bg-regulatorio text-white" : "bg-bg-hover text-text-secondary"
            }`}>
            {t === "tramites" ? `Trámites (${data?.tramitesAnmat.length ?? 0})` : `Casos (${data?.casos.length ?? 0})`}
          </button>
        ))}
      </div>

      {tab === "tramites" && (
        <div className="space-y-2">
          {data?.tramitesAnmat.map((t) => (
            <div key={t.id} className="bg-bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  t.semaforo === "verde" ? "bg-success" : t.semaforo === "amarillo" ? "bg-warning" : "bg-danger"
                }`} />
                <div>
                  <p className="text-sm font-medium">{t.tramiteTipo.nombre}</p>
                  <p className="text-xs text-text-secondary">{t.gestion.cliente.razonSocial} · {t.gestion.nombre}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${EXPEDIENTE_COLORS[t.estado]}`}>
                {EXPEDIENTE_LABELS[t.estado]}
              </span>
            </div>
          ))}
          {(data?.tramitesAnmat.length ?? 0) === 0 && (
            <p className="text-center py-8 text-text-secondary text-sm">Sin trámites ANMAT activos</p>
          )}
        </div>
      )}

      {tab === "casos" && (
        <div className="space-y-3">
          {data?.casos.map((c) => (
            <div key={c.id} className="bg-bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{c.nombre}</p>
                  <p className="text-xs text-text-secondary">{c.cliente.razonSocial}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{c.estado}</span>
              </div>
              {c.descripcion && <p className="text-xs text-text-secondary mb-2">{c.descripcion}</p>}
              {c.requisitos.length > 0 && (
                <div className="mt-2 space-y-1">
                  {c.requisitos.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <FileText className="w-3 h-3 text-text-secondary" />
                      <span>{r.documento}</span>
                      <span className="text-text-secondary">({r.division.nombre})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {(data?.casos.length ?? 0) === 0 && (
            <p className="text-center py-8 text-text-secondary text-sm">Sin casos ANMAT</p>
          )}
        </div>
      )}
    </div>
  );
}
