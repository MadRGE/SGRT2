import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import catalogoData from "../../../../CATALOGO_COMPLETO_TRAMITES_2025.json";

const ORGANISMOS_MAP: Record<string, string> = {
  INAL: "Instituto Nacional de Alimentos",
  ANMAT_PM: "ANMAT - Productos Médicos",
  ANMAT_COSM: "ANMAT - Cosméticos e Higiene Personal",
  ANMAT_DOM: "ANMAT - Domisanitarios",
  SENASA: "Servicio Nacional de Sanidad y Calidad Agroalimentaria",
  INTI: "Instituto Nacional de Tecnología Industrial",
  SEDRONAR: "SEDRONAR - RENPRE (Precursores Químicos)",
  FAUNA_CITES: "Dirección de Fauna - CITES",
  SIC: "Secretaría de Industria y Comercio",
  ENACOM: "Ente Nacional de Comunicaciones",
};

export async function GET() {
  try {
    // 1. Studio
    const studio = await prisma.studio.upsert({
      where: { mckeinNodeId: "sgrt2-gestor" },
      update: {},
      create: {
        nombre: "RGE",
        mckeinNodeId: "sgrt2-gestor",
        email: "maximiliano@riosglobalexperts.com",
      },
    });

    // 2. Admin user
    const hashedPw = await hashPassword("sgrt2026");
    await prisma.user.upsert({
      where: { email_studioId: { email: "maximiliano@riosglobalexperts.com", studioId: studio.id } },
      update: {},
      create: {
        email: "maximiliano@riosglobalexperts.com",
        nombre: "Maximiliano Ezequiel Rios",
        password: hashedPw,
        role: "admin",
        studioId: studio.id,
      },
    });

    // 3. Organismos
    const organismoIds: Record<string, string> = {};
    for (const [key, nombre] of Object.entries(ORGANISMOS_MAP)) {
      const org = await prisma.organismo.upsert({
        where: { nombre },
        update: {},
        create: { nombre },
      });
      organismoIds[key] = org.id;
    }

    // 4. TramiteTipos from catalog
    const tramites = (catalogoData as Record<string, unknown>).tramites as Record<string, Array<{
      id: string;
      codigo_oficial: string;
      nombre: string;
      organismo: string;
      categoria: string;
      subcategoria: string;
      costo_noviembre_2025: number | null;
      moneda: string;
      plataforma: string;
      plazo_dias: number;
      documentacion_obligatoria: string[];
      observaciones: string;
      activo: boolean;
      prioridad: string;
    }>>;

    let tramiteCount = 0;
    for (const [orgKey, items] of Object.entries(tramites)) {
      const organismoId = organismoIds[orgKey];
      if (!organismoId) continue;

      for (const t of items) {
        await prisma.tramiteTipo.upsert({
          where: { codigo: t.id },
          update: {
            nombre: t.nombre,
            categoria: t.categoria,
            subcategoria: t.subcategoria,
            plazoDias: t.plazo_dias,
            costoOrganismo: t.costo_noviembre_2025,
            moneda: t.moneda || "ARS",
            plataforma: t.plataforma,
            documentacionObligatoria: t.documentacion_obligatoria || [],
            observaciones: t.observaciones,
            prioridad: t.prioridad || "media",
            activo: t.activo !== false,
          },
          create: {
            codigo: t.id,
            nombre: t.nombre,
            categoria: t.categoria,
            subcategoria: t.subcategoria,
            plazoDias: t.plazo_dias,
            costoOrganismo: t.costo_noviembre_2025,
            moneda: t.moneda || "ARS",
            plataforma: t.plataforma,
            documentacionObligatoria: t.documentacion_obligatoria || [],
            observaciones: t.observaciones,
            prioridad: t.prioridad || "media",
            activo: t.activo !== false,
            organismoId,
          },
        });
        tramiteCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      seeded: {
        studio: studio.nombre,
        organismos: Object.keys(organismoIds).length,
        tramiteTipos: tramiteCount,
      },
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
