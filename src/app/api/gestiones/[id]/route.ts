import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";
import { canTransitionGestion, canTransitionExpediente, calcularSemaforo } from "@/lib/state-machines";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const gestion = await prisma.gestion.findFirst({
    where: { id, studioId: payload.studioId, deletedAt: null },
    include: {
      cliente: true,
      expedientes: {
        where: { deletedAt: null },
        include: {
          tramiteTipo: { include: { organismo: { select: { nombre: true } } } },
          documentos: { orderBy: { createdAt: "desc" } },
          productos: { include: { producto: true } },
          _count: { select: { documentos: true, acciones: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      presupuesto: { include: { items: true } },
      documentos: { where: { expedienteId: null }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!gestion) return NextResponse.json({ error: "Gestión no encontrada" }, { status: 404 });
  return NextResponse.json(gestion);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // State transition validation
  if (body.estado) {
    const current = await prisma.gestion.findUnique({ where: { id }, select: { estado: true } });
    if (current && !canTransitionGestion(current.estado, body.estado)) {
      return NextResponse.json({ error: `No se puede pasar de ${current.estado} a ${body.estado}` }, { status: 400 });
    }
  }

  const gestion = await prisma.gestion.update({
    where: { id },
    data: {
      nombre: body.nombre,
      estado: body.estado,
      prioridad: body.prioridad,
      descripcion: body.descripcion,
      fechaCierre: body.estado === "finalizado" ? new Date() : undefined,
    },
  });

  return NextResponse.json(gestion);
}

// PATCH = Update expediente estado within gestión
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await params; // consume params
  const body = await req.json();
  const { expedienteId, estado, progreso } = body;

  if (!expedienteId) return NextResponse.json({ error: "expedienteId requerido" }, { status: 400 });

  const expediente = await prisma.expediente.findUnique({ where: { id: expedienteId } });
  if (!expediente) return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404 });

  if (estado && !canTransitionExpediente(expediente.estado, estado)) {
    return NextResponse.json({ error: `No se puede pasar de ${expediente.estado} a ${estado}` }, { status: 400 });
  }

  const newProgreso = progreso ?? expediente.progreso;
  const newEstado = estado ?? expediente.estado;
  const semaforo = calcularSemaforo({
    estado: newEstado,
    fechaLimite: expediente.fechaLimite,
    progreso: newProgreso,
  });

  const updated = await prisma.expediente.update({
    where: { id: expedienteId },
    data: { estado: newEstado, progreso: newProgreso, semaforo },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  await prisma.gestion.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
