import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";

const HAMMER_URL = "http://127.0.0.1:18792";

// POST = Execute automation task
export async function POST(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { expedienteId, tipo, params: taskParams } = await req.json();

  // Create tracking record
  const accion = await prisma.organismoAccion.create({
    data: {
      organismo: tipo.split("_")[0].toUpperCase(),
      tipo,
      estado: "pendiente",
      expedienteId,
    },
  });

  // Try to send to Hammer agent
  try {
    const res = await fetch(`${HAMMER_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: accion.id, tipo, params: taskParams }),
    });

    if (res.ok) {
      const data = await res.json();
      await prisma.organismoAccion.update({
        where: { id: accion.id },
        data: {
          hammerId: data.id,
          estado: "ejecutando",
          pasosTotales: data.totalSteps || 0,
        },
      });
    } else {
      await prisma.organismoAccion.update({
        where: { id: accion.id },
        data: { estado: "fallido", resultado: { error: "Hammer no respondió correctamente" } },
      });
    }
  } catch {
    // Hammer not running — mark as pending for manual execution
    await prisma.organismoAccion.update({
      where: { id: accion.id },
      data: { estado: "pendiente", resultado: { error: "Hammer agent no disponible" } },
    });
  }

  return NextResponse.json(accion, { status: 201 });
}

// GET = Check status of automation tasks
export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const expedienteId = searchParams.get("expedienteId");

  const where: Record<string, unknown> = {};
  if (expedienteId) where.expedienteId = expedienteId;

  const acciones = await prisma.organismoAccion.findMany({
    where,
    include: { expediente: { select: { codigo: true } } },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return NextResponse.json(acciones);
}
