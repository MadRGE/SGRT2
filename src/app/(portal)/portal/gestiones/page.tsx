"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, ChevronRight } from "lucide-react";
import { GESTION_LABELS, GESTION_COLORS } from "@/lib/state-machines";

interface Gestion {
  id: string; nombre: string; estado: string;
  _count: { expedientes: number };
  expedientes: Array<{ semaforo: string; tramiteTipo: { nombre: string; organismo: { nombre: string } } }>;
}

export default function PortalGestionesPage() {
  const [gestiones, setGestiones] = useState<Gestion[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/portal/gestiones", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setGestiones);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FolderOpen className="w-5 h-5 text-regulatorio" />
        <h1 className="text-lg font-bold">Mis Gestiones</h1>
      </div>

      <div className="space-y-3">
        {gestiones.map((g) => (
          <Link key={g.id} href={`/portal/gestiones/${g.id}`}
            className="block bg-bg-card rounded-xl border border-border p-4 hover:border-regulatorio/30 transition">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">{g.nombre}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${GESTION_COLORS[g.estado]}`}>
                  {GESTION_LABELS[g.estado]}
                </span>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {g.expedientes.map((exp, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-bg-hover rounded text-[11px] text-text-secondary">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    exp.semaforo === "verde" ? "bg-success" : exp.semaforo === "amarillo" ? "bg-warning" : "bg-danger"
                  }`} />
                  {exp.tramiteTipo.nombre.slice(0, 40)}
                </span>
              ))}
            </div>
          </Link>
        ))}
        {gestiones.length === 0 && (
          <p className="text-center py-12 text-text-secondary text-sm">No tenés gestiones activas.</p>
        )}
      </div>
    </div>
  );
}
