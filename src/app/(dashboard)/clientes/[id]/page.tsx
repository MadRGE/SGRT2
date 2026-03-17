"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, FolderOpen, Package, FileText, ChevronRight } from "lucide-react";
import { GESTION_LABELS, GESTION_COLORS } from "@/lib/state-machines";

interface ClienteDetail {
  id: string; razonSocial: string; cuit: string | null; email: string | null;
  telefono: string | null; direccion: string | null; rne: string | null; notas: string | null;
  productos: Array<{ id: string; nombre: string; marca: string | null; rubro: string | null }>;
  gestiones: Array<{
    id: string; nombre: string; estado: string;
    _count: { expedientes: number };
  }>;
  documentos: Array<{ id: string; nombre: string; estado: string; vencimiento: string | null }>;
  _count: { gestiones: number; productos: number };
}

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cliente, setCliente] = useState<ClienteDetail | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`/api/clientes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setCliente);
  }, [id]);

  if (!cliente) return <div className="p-6 text-center text-text-secondary">Cargando...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => router.push("/clientes")} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Clientes
      </button>

      {/* Header */}
      <div className="bg-bg-card rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Users className="w-5 h-5 text-regulatorio" />
          <h1 className="text-lg font-bold">{cliente.razonSocial}</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {cliente.cuit && <div><span className="text-text-secondary text-xs">CUIT</span><p>{cliente.cuit}</p></div>}
          {cliente.email && <div><span className="text-text-secondary text-xs">Email</span><p>{cliente.email}</p></div>}
          {cliente.telefono && <div><span className="text-text-secondary text-xs">Teléfono</span><p>{cliente.telefono}</p></div>}
          {cliente.rne && <div><span className="text-text-secondary text-xs">RNE</span><p>{cliente.rne}</p></div>}
        </div>
        {cliente.notas && <p className="text-sm text-text-secondary mt-3">{cliente.notas}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gestiones */}
        <div className="bg-bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-regulatorio" />
              <h2 className="font-semibold text-sm">Gestiones ({cliente._count.gestiones})</h2>
            </div>
            <Link href={`/gestiones/nueva`} className="text-xs text-regulatorio-light hover:underline">+ Nueva</Link>
          </div>
          <div className="divide-y divide-border-light">
            {cliente.gestiones.map((g) => (
              <Link key={g.id} href={`/gestiones/${g.id}`} className="flex items-center justify-between p-3 hover:bg-bg-hover transition">
                <div>
                  <p className="text-sm font-medium">{g.nombre}</p>
                  <p className="text-[11px] text-text-secondary">{g._count.expedientes} expedientes</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${GESTION_COLORS[g.estado]}`}>
                    {GESTION_LABELS[g.estado]}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
                </div>
              </Link>
            ))}
            {cliente.gestiones.length === 0 && <p className="p-4 text-xs text-text-secondary text-center">Sin gestiones</p>}
          </div>
        </div>

        {/* Productos */}
        <div className="bg-bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Package className="w-4 h-4 text-regulatorio" />
            <h2 className="font-semibold text-sm">Productos ({cliente._count.productos})</h2>
          </div>
          <div className="divide-y divide-border-light">
            {cliente.productos.map((p) => (
              <div key={p.id} className="p-3">
                <p className="text-sm font-medium">{p.nombre}</p>
                <div className="flex gap-2 text-[11px] text-text-secondary">
                  {p.marca && <span>{p.marca}</span>}
                  {p.rubro && <span>· {p.rubro}</span>}
                </div>
              </div>
            ))}
            {cliente.productos.length === 0 && <p className="p-4 text-xs text-text-secondary text-center">Sin productos</p>}
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-bg-card rounded-xl border border-border lg:col-span-2">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <FileText className="w-4 h-4 text-regulatorio" />
            <h2 className="font-semibold text-sm">Documentos del Cliente</h2>
          </div>
          <div className="divide-y divide-border-light">
            {cliente.documentos.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3">
                <p className="text-sm">{d.nombre}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${
                    d.estado === "cargado" ? "bg-green-50 text-green-700" :
                    d.estado === "vencido" ? "bg-red-50 text-red-700" :
                    "bg-slate-50 text-slate-600"
                  }`}>{d.estado}</span>
                  {d.vencimiento && <span className="text-text-secondary">Vence: {new Date(d.vencimiento).toLocaleDateString("es-AR")}</span>}
                </div>
              </div>
            ))}
            {cliente.documentos.length === 0 && <p className="p-4 text-xs text-text-secondary text-center">Sin documentos</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
