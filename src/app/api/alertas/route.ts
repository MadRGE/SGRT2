import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const alertas = await prisma.alertaRegulatoria.findMany({
    include: { organismo: { select: { nombre: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(alertas);
}

export async function POST(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const alerta = await prisma.alertaRegulatoria.create({
    data: {
      modulo: body.modulo,
      titulo: body.titulo,
      detalle: body.detalle,
      impacto: body.impacto,
      organismoId: body.organismoId,
    },
  });

  return NextResponse.json(alerta, { status: 201 });
}

export async function PUT(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await req.json();
  await prisma.alertaRegulatoria.update({ where: { id }, data: { leida: true } });
  return NextResponse.json({ ok: true });
}
