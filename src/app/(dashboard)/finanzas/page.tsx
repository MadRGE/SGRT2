"use client";

import { useEffect, useState } from "react";
import { DollarSign, FileText } from "lucide-react";

interface Gestion {
  id: string; nombre: string;
  cliente: { razonSocial: string };
  expedientes: Array<{
    tramiteTipo: { nombre: string; costoOrganismo: number | null; honorarios: number | null };
  }>;
}

export default function FinanzasPage() {
  const [gestiones, setGestiones] = useState<Gestion[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/gestiones", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setGestiones);
  }, []);

  const totales = gestiones.reduce(
    (acc, g) => {
      for (const exp of g.expedientes) {
        acc.aranceles += exp.tramiteTipo.costoOrganismo || 0;
        acc.honorarios += exp.tramiteTipo.honorarios || 0;
      }
      return acc;
    },
    { aranceles: 0, honorarios: 0 }
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-6 h-6 text-regulatorio" />
        <h1 className="text-xl font-bold">Finanzas Operativas</h1>
        <span className="text-sm text-text-secondary">(Estimaciones, no facturación)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-3xl font-bold text-regulatorio">${totales.aranceles.toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-1">Total Aranceles</p>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-3xl font-bold text-accent">${totales.honorarios.toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-1">Total Honorarios</p>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-3xl font-bold">${(totales.aranceles + totales.honorarios).toLocaleString()}</p>
          <p className="text-xs text-text-secondary mt-1">Total General</p>
        </div>
      </div>

      <div className="bg-bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm">Desglose por Gestión</h2>
        </div>
        <div className="divide-y divide-border-light">
          {gestiones.map((g) => {
            const gArancel = g.expedientes.reduce((s, e) => s + (e.tramiteTipo.costoOrganismo || 0), 0);
            const gHonorario = g.expedientes.reduce((s, e) => s + (e.tramiteTipo.honorarios || 0), 0);
            if (gArancel + gHonorario === 0) return null;
            return (
              <div key={g.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{g.nombre}</p>
                  <p className="text-xs text-text-secondary">{g.cliente.razonSocial} · {g.expedientes.length} exp.</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">${(gArancel + gHonorario).toLocaleString()}</p>
                  <p className="text-[11px] text-text-secondary">A: ${gArancel.toLocaleString()} · H: ${gHonorario.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
          {gestiones.length === 0 && <p className="p-6 text-center text-text-secondary text-sm">Sin gestiones</p>}
        </div>
      </div>
    </div>
  );
}
