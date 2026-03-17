import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado");
  const expedienteId = searchParams.get("expedienteId");
  const clienteId = searchParams.get("clienteId");

  const where: Record<string, unknown> = {};
  if (estado) where.estado = estado;
  if (expedienteId) where.expedienteId = expedienteId;
  if (clienteId) where.clienteId = clienteId;

  // Filter to studio scope
  where.OR = [
    { expediente: { gestion: { studioId: payload.studioId } } },
    { cliente: { studioId: payload.studioId } },
    { studioId: payload.studioId },
  ];

  const documentos = await prisma.documento.findMany({
    where,
    include: {
      expediente: { select: { codigo: true, tramiteTipo: { select: { nombre: true } } } },
      cliente: { select: { razonSocial: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(documentos);
}

export async function PUT(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, estado, archivoUrl } = await req.json();

  const doc = await prisma.documento.update({
    where: { id },
    data: {
      ...(estado && { estado }),
      ...(archivoUrl && { archivoUrl }),
    },
  });

  return NextResponse.json(doc);
}
