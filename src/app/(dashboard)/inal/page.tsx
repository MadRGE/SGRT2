"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { EXPEDIENTE_LABELS, EXPEDIENTE_COLORS } from "@/lib/state-machines";

interface Expediente {
  id: string; estado: string; semaforo: string;
  tramiteTipo: { nombre: string; categoria: string | null; organismo: { nombre: string } };
  gestion: { nombre: string; cliente: { razonSocial: string } };
}

export default function InalPage() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/tramites?organismo=Instituto Nacional de Alimentos", { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        // For now, get all gestiones and filter INAL expedientes
        fetch("/api/gestiones", { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((gestiones: Array<{ expedientes: Expediente[] }>) => {
            const inal = gestiones.flatMap((g: { expedientes: Expediente[] }) =>
              g.expedientes.filter((e: Expediente) => e.tramiteTipo.organismo.nombre.includes("INAL") || e.tramiteTipo.organismo.nombre.includes("Alimentos"))
            );
            setExpedientes(inal);
          });
      });
  }, []);

  const categorias = [...new Set(expedientes.map((e) => e.tramiteTipo.categoria).filter(Boolean))];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <UtensilsCrossed className="w-6 h-6 text-regulatorio" />
        <h1 className="text-xl font-bold">INAL</h1>
        <span className="text-sm text-text-secondary">RNE · RNPA · Envases · Importador</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {["RNE", "RNPA", "Importaciones", "Certificaciones"].map((cat) => {
          const count = expedientes.filter((e) => e.tramiteTipo.categoria === cat).length;
          return (
            <div key={cat} className="bg-bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-text-secondary">{cat}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm">Trámites INAL Activos ({expedientes.length})</h2>
        </div>
        <div className="divide-y divide-border-light">
          {expedientes.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  e.semaforo === "verde" ? "bg-success" : e.semaforo === "amarillo" ? "bg-warning" : "bg-danger"
                }`} />
                <div>
                  <p className="text-sm font-medium">{e.tramiteTipo.nombre}</p>
                  <p className="text-xs text-text-secondary">{e.gestion.cliente.razonSocial} · {e.tramiteTipo.categoria}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${EXPEDIENTE_COLORS[e.estado]}`}>
                {EXPEDIENTE_LABELS[e.estado]}
              </span>
            </div>
          ))}
          {expedientes.length === 0 && (
            <p className="p-6 text-center text-sm text-text-secondary">Sin trámites INAL activos</p>
          )}
        </div>
      </div>
    </div>
  );
}
