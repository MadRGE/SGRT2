import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado");
  const clienteId = searchParams.get("clienteId");

  const where: Record<string, unknown> = { studioId: payload.studioId, deletedAt: null };
  if (estado) where.estado = estado;
  if (clienteId) where.clienteId = clienteId;

  const gestiones = await prisma.gestion.findMany({
    where,
    include: {
      cliente: { select: { razonSocial: true, cuit: true } },
      expedientes: {
        where: { deletedAt: null },
        include: { tramiteTipo: { select: { nombre: true, organismo: { select: { nombre: true } } } } },
      },
      _count: { select: { expedientes: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(gestiones);
}

// POST = Wizard de Nueva Gestión (transaccional)
export async function POST(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { clienteId, nombre, prioridad, descripcion, tramiteTipoIds } = body as {
    clienteId: string;
    nombre: string;
    prioridad?: string;
    descripcion?: string;
    tramiteTipoIds: string[];
  };

  if (!clienteId || !tramiteTipoIds?.length) {
    return NextResponse.json({ error: "clienteId y tramiteTipoIds son requeridos" }, { status: 400 });
  }

  // Fetch tramite tipos for auto-doc generation
  const tramiteTipos = await prisma.tramiteTipo.findMany({
    where: { id: { in: tramiteTipoIds } },
    include: { organismo: { select: { nombre: true } } },
  });

  // Auto-generate name if not provided
  const autoNombre = nombre || (
    tramiteTipos.length === 1
      ? tramiteTipos[0].nombre
      : `${tramiteTipos.length} trámites`
  );

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create gestión
      const gestion = await tx.gestion.create({
        data: {
          nombre: autoNombre,
          estado: "relevamiento",
          prioridad: prioridad || "normal",
          descripcion,
          clienteId,
          studioId: payload.studioId,
        },
      });

      // 2. Create expedientes + auto-docs
      const expedientes = [];
      for (const tipo of tramiteTipos) {
        const expediente = await tx.expediente.create({
          data: {
            estado: "consulta",
            semaforo: "verde",
            progreso: 0,
            plataforma: tipo.plataforma,
            fechaLimite: tipo.plazoDias
              ? new Date(Date.now() + tipo.plazoDias * 24 * 60 * 60 * 1000)
              : null,
            gestionId: gestion.id,
            tramiteTipoId: tipo.id,
          },
        });

        // 3. Auto-create required documents
        const docs = (tipo.documentacionObligatoria as string[]) || [];
        if (docs.length > 0) {
          await tx.documento.createMany({
            data: docs.map((docName) => ({
              nombre: docName,
              estado: "pendiente",
              obligatorio: true,
              responsable: "Cliente",
              expedienteId: expediente.id,
              gestionId: gestion.id,
            })),
          });
        }

        expedientes.push(expediente);
      }

      return { gestion, expedientes };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Create gestion error:", err);
    return NextResponse.json({ error: "Error al crear gestión" }, { status: 500 });
  }
}
