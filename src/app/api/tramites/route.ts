import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organismo = searchParams.get("organismo");
  const categoria = searchParams.get("categoria");
  const q = searchParams.get("q");

  const where: Record<string, unknown> = { activo: true };
  if (organismo) where.organismo = { nombre: organismo };
  if (categoria) where.categoria = categoria;
  if (q) where.nombre = { contains: q, mode: "insensitive" };

  const tramites = await prisma.tramiteTipo.findMany({
    where,
    include: { organismo: { select: { nombre: true } } },
    orderBy: [{ organismo: { nombre: "asc" } }, { categoria: "asc" }, { nombre: "asc" }],
  });

  return NextResponse.json(tramites);
}
