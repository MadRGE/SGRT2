import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getTokenFromHeaders, isStaff, isCliente } from "@/lib/auth/jwt";

export async function GET(req: Request) {
  const payload = getTokenFromHeaders(req.headers);
  if (!payload) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (isStaff(payload)) {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { studio: true },
    });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json({
      user: { id: user.id, email: user.email, nombre: user.nombre, role: user.role, type: "staff" },
      studio: { id: user.studio.id, nombre: user.studio.nombre },
    });
  }

  if (isCliente(payload)) {
    const clienteUser = await prisma.clienteUser.findUnique({
      where: { id: payload.clienteUserId },
      include: { cliente: true },
    });
    if (!clienteUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    return NextResponse.json({
      user: { id: clienteUser.id, email: clienteUser.email, nombre: clienteUser.nombre, type: "cliente" },
      cliente: { id: clienteUser.cliente.id, razonSocial: clienteUser.cliente.razonSocial },
    });
  }

  return NextResponse.json({ error: "Token inválido" }, { status: 401 });
}
