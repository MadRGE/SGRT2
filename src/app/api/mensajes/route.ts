import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clienteId = searchParams.get("clienteId");
  if (!clienteId) return NextResponse.json({ error: "clienteId requerido" }, { status: 400 });

  const mensajes = await prisma.mensaje.findMany({
    where: { clienteId },
    include: { user: { select: { nombre: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(mensajes);
}

export async function POST(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { texto, clienteId } = await req.json();
  const mensaje = await prisma.mensaje.create({
    data: { texto, origen: "staff", clienteId, userId: payload.userId },
  });

  return NextResponse.json(mensaje, { status: 201 });
}
