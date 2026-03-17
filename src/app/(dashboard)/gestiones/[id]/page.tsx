"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, ChevronDown, ChevronUp, Circle } from "lucide-react";
import {
  GESTION_LABELS, GESTION_COLORS, GESTION_TRANSITIONS,
  EXPEDIENTE_LABELS, EXPEDIENTE_COLORS, EXPEDIENTE_TRANSITIONS,
} from "@/lib/state-machines";

interface Gestion {
  id: string; nombre: string; estado: string; prioridad: string; descripcion: string | null;
  fechaInicio: string; fechaCierre: string | null;
  cliente: { razonSocial: string; cuit: string | null };
  expedientes: Array<{
    id: string; estado: string; semaforo: string; progreso: number; fechaLimite: string | null;
    tramiteTipo: { nombre: string; codigo: string; organismo: { nombre: string } };
    documentos: Array<{ id: string; nombre: string; estado: string; obligatorio: boolean }>;
    _count: { documentos: number };
  }>;
}

export default function GestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [gestion, setGestion] = useState<Gestion | null>(null);
  const [openExp, setOpenExp] = useState<string | null>(null);

  function load() {
    const token = localStorage.getItem("token");
    fetch(`/api/gestiones/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setGestion);
  }

  useEffect(() => { load(); }, [id]);

  async function changeGestionEstado(nuevoEstado: string) {
    const token = localStorage.getItem("token");
    await fetch(`/api/gestiones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    load();
  }

  async function changeExpedienteEstado(expedienteId: string, nuevoEstado: string) {
    const token = localStorage.getItem("token");
    await fetch(`/api/gestiones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ expedienteId, estado: nuevoEstado }),
    });
    load();
  }

  if (!gestion) return <div className="p-6 text-center text-text-secondary">Cargando...</div>;

  const transitions = GESTION_TRANSITIONS[gestion.estado] || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => router.push("/gestiones")} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Gestiones
      </button>

      {/* Header */}
      <div className="bg-bg-card rounded-xl border border-border p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold">{gestion.nombre}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${GESTION_COLORS[gestion.estado]}`}>
            {GESTION_LABELS[gestion.estado]}
          </span>
        </div>
        <p className="text-sm text-text-secondary">{gestion.cliente.razonSocial} {gestion.cliente.cuit && `· ${gestion.cliente.cuit}`}</p>
        {gestion.descripcion && <p className="text-sm text-text-secondary mt-1">{gestion.descripcion}</p>}

        {transitions.length > 0 && (
          <div className="flex gap-2 mt-4">
            {transitions.map((t) => (
              <button key={t} onClick={() => changeGestionEstado(t)}
                className="px-3 py-1.5 bg-bg-hover hover:bg-border rounded-lg text-xs font-medium capitalize transition">
                → {GESTION_LABELS[t] || t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expedientes */}
      <h2 className="font-semibold text-sm text-text-secondary mb-3">
        Expedientes ({gestion.expedientes.length})
      </h2>

      <div className="space-y-3">
        {gestion.expedientes.map((exp) => {
          const isOpen = openExp === exp.id;
          const expTransitions = EXPEDIENTE_TRANSITIONS[exp.estado] || [];
          return (
            <div key={exp.id} className="bg-bg-card rounded-xl border border-border overflow-hidden">
              <button onClick={() => setOpenExp(isOpen ? null : exp.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-bg-hover transition">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    exp.semaforo === "verde" ? "bg-success" : exp.semaforo === "amarillo" ? "bg-warning" : "bg-danger"
                  }`} />
                  <div className="text-left">
                    <p className="text-sm font-medium">{exp.tramiteTipo.nombre}</p>
                    <p className="text-[11px] text-text-secondary">
                      {exp.tramiteTipo.codigo} · {exp.tramiteTipo.organismo.nombre}
                      {exp.fechaLimite && ` · Vence: ${new Date(exp.fechaLimite).toLocaleDateString("es-AR")}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${EXPEDIENTE_COLORS[exp.estado]}`}>
                    {EXPEDIENTE_LABELS[exp.estado]}
                  </span>
                  <span className="text-xs text-text-secondary">{exp.progreso}%</span>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border-light p-4">
                  {/* Progress bar */}
                  <div className="w-full bg-border rounded-full h-1.5 mb-4">
                    <div className={`h-1.5 rounded-full ${
                      exp.semaforo === "verde" ? "bg-success" : exp.semaforo === "amarillo" ? "bg-warning" : "bg-danger"
                    }`} style={{ width: `${exp.progreso}%` }} />
                  </div>

                  {/* State transitions */}
                  {expTransitions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs text-text-secondary">Cambiar a:</span>
                      {expTransitions.map((t) => (
                        <button key={t} onClick={() => changeExpedienteEstado(exp.id, t)}
                          className="px-2.5 py-1 bg-bg-hover hover:bg-border rounded text-[11px] font-medium capitalize transition">
                          {EXPEDIENTE_LABELS[t] || t}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Documents */}
                  <h3 className="text-xs font-medium text-text-secondary mb-2">Documentos ({exp.documentos.length})</h3>
                  <div className="space-y-1">
                    {exp.documentos.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 text-xs">
                        <Circle className={`w-2.5 h-2.5 ${
                          doc.estado === "cargado" ? "text-success fill-success" :
                          doc.estado === "aprobado" ? "text-success fill-success" :
                          "text-text-secondary"
                        }`} />
                        <span className={doc.obligatorio ? "font-medium" : ""}>{doc.nombre}</span>
                        <span className="text-text-secondary">({doc.estado})</span>
                      </div>
                    ))}
                    {exp.documentos.length === 0 && <p className="text-xs text-text-secondary">Sin documentos</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
