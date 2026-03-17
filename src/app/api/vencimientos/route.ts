import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const now = new Date();
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const in60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const [expedientesVencidos, expedientesPorVencer, docsVencidos, docsPorVencer] = await Promise.all([
    // Expedientes ya vencidos
    prisma.expediente.findMany({
      where: {
        gestion: { studioId: payload.studioId },
        deletedAt: null,
        fechaLimite: { lt: now },
        estado: { notIn: ["aprobado", "rechazado", "archivado"] },
      },
      include: {
        tramiteTipo: { include: { organismo: { select: { nombre: true } } } },
        gestion: { select: { nombre: true, cliente: { select: { razonSocial: true } } } },
      },
      orderBy: { fechaLimite: "asc" },
    }),
    // Expedientes por vencer (próximos 60 días)
    prisma.expediente.findMany({
      where: {
        gestion: { studioId: payload.studioId },
        deletedAt: null,
        fechaLimite: { gte: now, lte: in60 },
        estado: { notIn: ["aprobado", "rechazado", "archivado"] },
      },
      include: {
        tramiteTipo: { include: { organismo: { select: { nombre: true } } } },
        gestion: { select: { nombre: true, cliente: { select: { razonSocial: true } } } },
      },
      orderBy: { fechaLimite: "asc" },
    }),
    // Documentos vencidos
    prisma.documento.findMany({
      where: {
        OR: [
          { expediente: { gestion: { studioId: payload.studioId } } },
          { cliente: { studioId: payload.studioId } },
          { studioId: payload.studioId },
        ],
        vencimiento: { lt: now },
        estado: { not: "aprobado" },
      },
      orderBy: { vencimiento: "asc" },
      take: 50,
    }),
    // Documentos por vencer
    prisma.documento.findMany({
      where: {
        OR: [
          { expediente: { gestion: { studioId: payload.studioId } } },
          { cliente: { studioId: payload.studioId } },
          { studioId: payload.studioId },
        ],
        vencimiento: { gte: now, lte: in60 },
      },
      orderBy: { vencimiento: "asc" },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    expedientes: {
      vencidos: expedientesVencidos,
      porVencer: expedientesPorVencer,
      urgentes: expedientesPorVencer.filter((e) => e.fechaLimite && new Date(e.fechaLimite) <= in30),
    },
    documentos: { vencidos: docsVencidos, porVencer: docsPorVencer },
  });
}
