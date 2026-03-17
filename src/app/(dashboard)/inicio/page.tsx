"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Scale, FileText, Users, AlertTriangle, FolderOpen, ChevronRight, Plus,
} from "lucide-react";
import { GESTION_LABELS, GESTION_COLORS } from "@/lib/state-machines";

interface DashboardData {
  kpis: {
    totalClientes: number;
    gestionesActivas: number;
    expedientesEnCurso: number;
    expedientesObservados: number;
    expedientesAprobados: number;
    vencimientosProximos: number;
  };
  recentGestiones: Array<{
    id: string;
    nombre: string;
    estado: string;
    updatedAt: string;
    cliente: { razonSocial: string };
    _count: { expedientes: number };
  }>;
}

export default function InicioPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const kpis = data?.kpis;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-regulatorio rounded-xl flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Panel de Control</h1>
            <p className="text-sm text-text-secondary">Sistema de Gestión de Trámites Regulatorios</p>
          </div>
        </div>
        <Link
          href="/gestiones/nueva"
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-regulatorio font-semibold rounded-lg text-sm transition"
        >
          <Plus className="w-4 h-4" />
          Nueva Gestión
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Clientes", value: kpis?.totalClientes, icon: Users, color: "bg-indigo-50 text-indigo-600" },
          { label: "Gestiones Activas", value: kpis?.gestionesActivas, icon: FolderOpen, color: "bg-emerald-50 text-emerald-600" },
          { label: "Trámites en Curso", value: kpis?.expedientesEnCurso, icon: FileText, color: "bg-blue-50 text-blue-600" },
          { label: "Vencimientos (<30d)", value: kpis?.vencimientosProximos, icon: AlertTriangle, color: "bg-amber-50 text-amber-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-text-secondary">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold">{kpi.value ?? "—"}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-3xl font-bold text-danger">{kpis?.expedientesObservados ?? 0}</p>
          <p className="text-xs text-text-secondary mt-1">Observados</p>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-3xl font-bold text-success">{kpis?.expedientesAprobados ?? 0}</p>
          <p className="text-xs text-text-secondary mt-1">Aprobados</p>
        </div>
        <div className="bg-bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-3xl font-bold text-regulatorio">{(kpis?.expedientesEnCurso ?? 0) + (kpis?.expedientesObservados ?? 0)}</p>
          <p className="text-xs text-text-secondary mt-1">En proceso total</p>
        </div>
      </div>

      <div className="bg-bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Gestiones Recientes</h2>
          <Link href="/gestiones" className="text-sm text-regulatorio-light hover:underline">Ver todas</Link>
        </div>
        <div className="divide-y divide-border-light">
          {data?.recentGestiones?.map((g) => (
            <Link key={g.id} href={`/gestiones/${g.id}`} className="flex items-center justify-between p-4 hover:bg-bg-hover transition">
              <div>
                <p className="font-medium text-sm">{g.nombre}</p>
                <p className="text-xs text-text-secondary">{g.cliente.razonSocial} · {g._count.expedientes} expedientes</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${GESTION_COLORS[g.estado] || ""}`}>
                  {GESTION_LABELS[g.estado] || g.estado}
                </span>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </div>
            </Link>
          )) || (
            <div className="p-8 text-center text-text-secondary text-sm">Sin gestiones aún. Creá la primera.</div>
          )}
        </div>
      </div>
    </div>
  );
}
