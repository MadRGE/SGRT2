import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff } from "@/lib/auth/jwt";
import { calcularTotalGestion } from "@/lib/fee-calculator";

export async function POST(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload || !isStaff(payload)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { gestionId } = await req.json();

  const gestion = await prisma.gestion.findFirst({
    where: { id: gestionId, studioId: payload.studioId },
    include: {
      expedientes: {
        where: { deletedAt: null },
        include: { tramiteTipo: true },
      },
    },
  });

  if (!gestion) return NextResponse.json({ error: "Gestión no encontrada" }, { status: 404 });

  const totales = calcularTotalGestion(gestion.expedientes);

  const presupuesto = await prisma.presupuesto.upsert({
    where: { gestionId },
    update: {
      totalOrganismo: totales.totalOrganismo,
      totalHonorarios: totales.totalHonorarios,
    },
    create: {
      gestionId,
      totalOrganismo: totales.totalOrganismo,
      totalHonorarios: totales.totalHonorarios,
      items: {
        create: gestion.expedientes.flatMap((exp) => {
          const items = [];
          if (exp.tramiteTipo.costoOrganismo) {
            items.push({
              concepto: `Arancel: ${exp.tramiteTipo.nombre}`,
              tipo: "arancel",
              monto: exp.tramiteTipo.costoOrganismo,
              cantidad: 1,
              expedienteId: exp.id,
            });
          }
          if (exp.tramiteTipo.honorarios) {
            items.push({
              concepto: `Honorarios: ${exp.tramiteTipo.nombre}`,
              tipo: "honorario",
              monto: exp.tramiteTipo.honorarios,
              cantidad: 1,
              expedienteId: exp.id,
            });
          }
          return items;
        }),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(presupuesto);
}
