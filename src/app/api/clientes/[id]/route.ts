import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const cliente = await prisma.cliente.findFirst({
    where: { id, studioId: payload.studioId, deletedAt: null },
    include: {
      productos: true,
      gestiones: {
        where: { deletedAt: null },
        include: {
          expedientes: { include: { tramiteTipo: true } },
          _count: { select: { expedientes: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      documentos: { orderBy: { createdAt: "desc" }, take: 20 },
      _count: { select: { gestiones: true, productos: true } },
    },
  });

  if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  return NextResponse.json(cliente);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      razonSocial: body.razonSocial,
      cuit: body.cuit,
      email: body.email,
      telefono: body.telefono,
      direccion: body.direccion,
      rne: body.rne,
      notas: body.notas,
    },
  });

  return NextResponse.json(cliente);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  await prisma.cliente.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
