import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const clientes = await prisma.cliente.findMany({
    where: { studioId: payload.studioId, deletedAt: null },
    include: {
      _count: { select: { gestiones: true, productos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const cliente = await prisma.cliente.create({
    data: {
      razonSocial: body.razonSocial,
      cuit: body.cuit,
      email: body.email,
      telefono: body.telefono,
      direccion: body.direccion,
      rne: body.rne,
      notas: body.notas,
      studioId: payload.studioId,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}
