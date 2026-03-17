import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "sgrt2-dev-secret-change-me";

export interface StaffTokenPayload {
  userId: string;
  studioId: string;
  email: string;
  role: string;
  type: "staff";
}

export interface ClienteTokenPayload {
  clienteUserId: string;
  clienteId: string;
  studioId: string;
  email: string;
  type: "cliente";
}

export type TokenPayload = StaffTokenPayload | ClienteTokenPayload;

export function signStaffToken(payload: Omit<StaffTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "staff" }, SECRET, { expiresIn: "7d" });
}

export function signClienteToken(payload: Omit<ClienteTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "cliente" }, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeaders(headers: Headers): TokenPayload | null {
  const auth = headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

export function isStaff(payload: TokenPayload): payload is StaffTokenPayload {
  return payload.type === "staff";
}

export function isCliente(payload: TokenPayload): payload is ClienteTokenPayload {
  return payload.type === "cliente";
}
