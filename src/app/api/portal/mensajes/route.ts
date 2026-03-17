import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isCliente } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isCliente(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const mensajes = await prisma.mensaje.findMany({
    where: { clienteId: payload.clienteId },
    include: { user: { select: { nombre: true } } },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(mensajes);
}

export async function POST(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isCliente(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { texto } = await req.json();
  const mensaje = await prisma.mensaje.create({
    data: { texto, origen: "cliente", clienteId: payload.clienteId },
  });

  return NextResponse.json(mensaje, { status: 201 });
}
