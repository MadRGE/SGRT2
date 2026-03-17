"use client";

import { useEffect, useState } from "react";
import { FileText, Circle } from "lucide-react";

interface Documento {
  id: string; nombre: string; estado: string; obligatorio: boolean; vencimiento: string | null;
  expediente: { tramiteTipo: { nombre: string } } | null;
}

export default function PortalDocumentosPage() {
  const [docs, setDocs] = useState<Documento[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    // Get all gestiones and extract documents
    fetch("/api/portal/gestiones", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((gestiones: Array<{ expedientes: Array<{ tramiteTipo: { nombre: string }; documentos: Documento[] }> }>) => {
        const allDocs = gestiones.flatMap((g) =>
          g.expedientes.flatMap((e) =>
            e.documentos.map((d) => ({ ...d, expediente: { tramiteTipo: { nombre: e.tramiteTipo.nombre } } }))
          )
        );
        setDocs(allDocs);
      });
  }, []);

  const pendientes = docs.filter((d) => d.estado === "pendiente" && d.obligatorio);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-5 h-5 text-regulatorio" />
        <h1 className="text-lg font-bold">Mis Documentos</h1>
      </div>

      {pendientes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-amber-800">Tenés {pendientes.length} documentos pendientes de cargar</p>
        </div>
      )}

      <div className="bg-bg-card rounded-xl border border-border divide-y divide-border-light">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Circle className={`w-2.5 h-2.5 ${
                d.estado === "aprobado" ? "text-success fill-success" :
                d.estado === "cargado" ? "text-blue-500 fill-blue-500" :
                "text-warning"
              }`} />
              <div>
                <p className="text-sm font-medium">{d.nombre} {d.obligatorio && <span className="text-danger">*</span>}</p>
                {d.expediente && <p className="text-[11px] text-text-secondary">{d.expediente.tramiteTipo.nombre}</p>}
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
              d.estado === "aprobado" ? "bg-green-50 text-green-700" :
              d.estado === "cargado" ? "bg-blue-50 text-blue-700" :
              "bg-amber-50 text-amber-700"
            }`}>{d.estado}</span>
          </div>
        ))}
        {docs.length === 0 && <p className="p-6 text-center text-text-secondary text-sm">Sin documentos</p>}
      </div>
    </div>
  );
}
