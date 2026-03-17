import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [casos, divisiones, tramitesAnmat] = await Promise.all([
    prisma.anmatCaso.findMany({
      include: {
        cliente: { select: { razonSocial: true } },
        requisitos: { include: { division: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.anmatDivision.findMany({ orderBy: { nombre: "asc" } }),
    prisma.expediente.findMany({
      where: {
        gestion: { studioId: payload.studioId },
        deletedAt: null,
        tramiteTipo: { organismo: { nombre: { contains: "ANMAT" } } },
      },
      include: {
        tramiteTipo: { include: { organismo: { select: { nombre: true } } } },
        gestion: { select: { nombre: true, cliente: { select: { razonSocial: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ casos, divisiones, tramitesAnmat });
}

export async function POST(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const caso = await prisma.anmatCaso.create({
    data: {
      nombre: body.nombre,
      descripcion: body.descripcion,
      clienteId: body.clienteId,
    },
  });

  return NextResponse.json(caso, { status: 201 });
}
