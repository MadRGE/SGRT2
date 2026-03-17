"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EXPEDIENTE_LABELS, EXPEDIENTE_COLORS, GESTION_LABELS } from "@/lib/state-machines";
import { Circle } from "lucide-react";

interface Gestion {
  id: string; nombre: string; estado: string;
  expedientes: Array<{
    id: string; estado: string; semaforo: string; progreso: number;
    tramiteTipo: { nombre: string; organismo: { nombre: string } };
    documentos: Array<{ id: string; nombre: string; estado: string; obligatorio: boolean }>;
  }>;
}

export default function PortalGestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [gestion, setGestion] = useState<Gestion | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/portal/gestiones", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((gs: Gestion[]) => setGestion(gs.find((g) => g.id === id) || null));
  }, [id]);

  if (!gestion) return <p className="text-center py-8 text-text-secondary">Cargando...</p>;

  return (
    <div>
      <h1 className="text-lg font-bold mb-1">{gestion.nombre}</h1>
      <p className="text-sm text-text-secondary mb-6">{GESTION_LABELS[gestion.estado]}</p>

      <div className="space-y-3">
        {gestion.expedientes.map((exp) => (
          <div key={exp.id} className="bg-bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  exp.semaforo === "verde" ? "bg-success" : exp.semaforo === "amarillo" ? "bg-warning" : "bg-danger"
                }`} />
                <p className="text-sm font-medium">{exp.tramiteTipo.nombre}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${EXPEDIENTE_COLORS[exp.estado]}`}>
                {EXPEDIENTE_LABELS[exp.estado]}
              </span>
            </div>

            <div className="w-full bg-border rounded-full h-1.5 mb-3">
              <div className={`h-1.5 rounded-full ${
                exp.semaforo === "verde" ? "bg-success" : exp.semaforo === "amarillo" ? "bg-warning" : "bg-danger"
              }`} style={{ width: `${exp.progreso}%` }} />
            </div>

            {exp.documentos.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-text-secondary">Documentos requeridos:</p>
                {exp.documentos.filter((d) => d.obligatorio).map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-xs">
                    <Circle className={`w-2 h-2 ${d.estado === "pendiente" ? "text-warning" : "text-success fill-success"}`} />
                    <span>{d.nombre}</span>
                    <span className="text-text-secondary">({d.estado})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
