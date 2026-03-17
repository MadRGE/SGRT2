"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, FileText, ChevronRight } from "lucide-react";

interface VencData {
  expedientes: {
    vencidos: Array<{ id: string; fechaLimite: string; estado: string; semaforo: string; tramiteTipo: { nombre: string; organismo: { nombre: string } }; gestion: { nombre: string; cliente: { razonSocial: string } } }>;
    porVencer: Array<{ id: string; fechaLimite: string; estado: string; semaforo: string; tramiteTipo: { nombre: string; organismo: { nombre: string } }; gestion: { nombre: string; cliente: { razonSocial: string } } }>;
    urgentes: Array<{ id: string }>;
  };
  documentos: {
    vencidos: Array<{ id: string; nombre: string; vencimiento: string; estado: string }>;
    porVencer: Array<{ id: string; nombre: string; vencimiento: string; estado: string }>;
  };
}

export default function VencimientosPage() {
  const [data, setData] = useState<VencData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/vencimientos", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setData);
  }, []);

  function diasHasta(fecha: string) {
    return Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-warning" />
        <h1 className="text-xl font-bold">Vencimientos</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-danger">{data?.expedientes.vencidos.length ?? 0}</p>
          <p className="text-xs text-red-600">Expedientes vencidos</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-warning">{data?.expedientes.urgentes.length ?? 0}</p>
          <p className="text-xs text-amber-600">Urgentes (&lt;30 días)</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">{data?.documentos.vencidos.length ?? 0}</p>
          <p className="text-xs text-orange-600">Documentos vencidos</p>
        </div>
      </div>

      {/* Expedientes vencidos */}
      {(data?.expedientes.vencidos.length ?? 0) > 0 && (
        <div className="bg-bg-card rounded-xl border border-danger/30 mb-6">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-danger" />
            <h2 className="font-semibold text-sm text-danger">Expedientes Vencidos</h2>
          </div>
          <div className="divide-y divide-border-light">
            {data?.expedientes.vencidos.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{e.tramiteTipo.nombre}</p>
                  <p className="text-xs text-text-secondary">{e.gestion.cliente.razonSocial} · {e.tramiteTipo.organismo.nombre}</p>
                </div>
                <span className="text-xs text-danger font-medium">Venció hace {Math.abs(diasHasta(e.fechaLimite))}d</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Por vencer */}
      <div className="bg-bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h2 className="font-semibold text-sm">Próximos a Vencer</h2>
        </div>
        <div className="divide-y divide-border-light">
          {data?.expedientes.porVencer.map((e) => {
            const dias = diasHasta(e.fechaLimite);
            return (
              <div key={e.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{e.tramiteTipo.nombre}</p>
                  <p className="text-xs text-text-secondary">{e.gestion.cliente.razonSocial} · {e.tramiteTipo.organismo.nombre}</p>
                </div>
                <span className={`text-xs font-medium ${dias <= 30 ? "text-danger" : "text-warning"}`}>
                  {dias}d restantes
                </span>
              </div>
            );
          })}
          {(data?.expedientes.porVencer.length ?? 0) === 0 && (
            <p className="p-6 text-center text-sm text-text-secondary">Sin vencimientos próximos</p>
          )}
        </div>
      </div>

      {/* Documentos */}
      {(data?.documentos.porVencer.length ?? 0) > 0 && (
        <div className="bg-bg-card rounded-xl border border-border mt-6">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-sm">Documentos por Vencer</h2>
          </div>
          <div className="divide-y divide-border-light">
            {data?.documentos.porVencer.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3">
                <p className="text-sm">{d.nombre}</p>
                <span className="text-xs text-warning">{diasHasta(d.vencimiento)}d</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
