import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sid = payload.studioId;

  const [
    totalClientes,
    gestionesActivas,
    expedientesEnCurso,
    expedientesObservados,
    expedientesAprobados,
    vencimientosProximos,
    recentGestiones,
  ] = await Promise.all([
    prisma.cliente.count({ where: { studioId: sid, deletedAt: null } }),
    prisma.gestion.count({
      where: { studioId: sid, deletedAt: null, estado: { in: ["relevamiento", "en_curso", "en_espera"] } },
    }),
    prisma.expediente.count({
      where: { gestion: { studioId: sid }, estado: "en_curso", deletedAt: null },
    }),
    prisma.expediente.count({
      where: { gestion: { studioId: sid }, estado: "observado", deletedAt: null },
    }),
    prisma.expediente.count({
      where: { gestion: { studioId: sid }, estado: "aprobado", deletedAt: null },
    }),
    prisma.expediente.count({
      where: {
        gestion: { studioId: sid },
        deletedAt: null,
        fechaLimite: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() },
      },
    }),
    prisma.gestion.findMany({
      where: { studioId: sid, deletedAt: null },
      include: {
        cliente: { select: { razonSocial: true } },
        _count: { select: { expedientes: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    kpis: {
      totalClientes,
      gestionesActivas,
      expedientesEnCurso,
      expedientesObservados,
      expedientesAprobados,
      vencimientosProximos,
    },
    recentGestiones,
  });
}
