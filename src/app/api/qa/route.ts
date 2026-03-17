import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const [organismos, tramiteTipos, users, studios] = await Promise.all([
      prisma.organismo.count(),
      prisma.tramiteTipo.count(),
      prisma.user.count(),
      prisma.studio.count(),
    ]);

    return NextResponse.json({
      status: "ok",
      counts: { organismos, tramiteTipos, users, studios },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("QA error:", err);
    return NextResponse.json({ error: "DB connection failed" }, { status: 500 });
  }
}
