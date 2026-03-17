import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { comparePassword } from "@/lib/auth/password";
import { signStaffToken, signClienteToken } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  try {
    const { email, password, type } = await req.json();

    if (type === "cliente") {
      const clienteUser = await prisma.clienteUser.findFirst({
        where: { email, activo: true },
        include: { cliente: { include: { studio: true } } },
      });
      if (!clienteUser) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

      const valid = await comparePassword(password, clienteUser.password);
      if (!valid) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

      const token = signClienteToken({
        clienteUserId: clienteUser.id,
        clienteId: clienteUser.clienteId,
        studioId: clienteUser.cliente.studioId,
        email: clienteUser.email,
      });

      return NextResponse.json({
        token,
        user: { id: clienteUser.id, email: clienteUser.email, nombre: clienteUser.nombre, type: "cliente" },
        cliente: { id: clienteUser.cliente.id, razonSocial: clienteUser.cliente.razonSocial },
      });
    }

    // Staff login
    const user = await prisma.user.findFirst({
      where: { email, activo: true },
      include: { studio: true },
    });
    if (!user) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    const valid = await comparePassword(password, user.password);
    if (!valid) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

    const token = signStaffToken({
      userId: user.id,
      studioId: user.studioId,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, nombre: user.nombre, role: user.role, type: "staff" },
      studio: { id: user.studio.id, nombre: user.studio.nombre },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
