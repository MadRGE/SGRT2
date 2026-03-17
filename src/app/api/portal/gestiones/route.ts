import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isCliente } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isCliente(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const gestiones = await prisma.gestion.findMany({
    where: { clienteId: payload.clienteId, deletedAt: null },
    include: {
      expedientes: {
        where: { deletedAt: null },
        include: {
          tramiteTipo: { include: { organismo: { select: { nombre: true } } } },
          documentos: { select: { id: true, nombre: true, estado: true, obligatorio: true } },
        },
      },
      _count: { select: { expedientes: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(gestiones);
}
