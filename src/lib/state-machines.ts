// ─── GESTIONES: 5 estados ────────────────────────────
export const GESTION_ESTADOS = [
  "relevamiento",
  "en_curso",
  "en_espera",
  "finalizado",
  "archivado",
] as const;

export type EstadoGestion = (typeof GESTION_ESTADOS)[number];

export const GESTION_TRANSITIONS: Record<string, string[]> = {
  relevamiento: ["en_curso", "archivado"],
  en_curso: ["en_espera", "finalizado", "archivado"],
  en_espera: ["en_curso", "archivado"],
  finalizado: ["archivado"],
  archivado: ["relevamiento"],
};

export const GESTION_LABELS: Record<string, string> = {
  relevamiento: "Relevamiento",
  en_curso: "En Curso",
  en_espera: "En Espera",
  finalizado: "Finalizado",
  archivado: "Archivado",
};

export const GESTION_COLORS: Record<string, string> = {
  relevamiento: "bg-blue-100 text-blue-800",
  en_curso: "bg-emerald-100 text-emerald-800",
  en_espera: "bg-amber-100 text-amber-800",
  finalizado: "bg-green-100 text-green-800",
  archivado: "bg-gray-100 text-gray-600",
};

// ─── EXPEDIENTES/TRÁMITES: 9 estados ────────────────
export const EXPEDIENTE_ESTADOS = [
  "consulta",
  "presupuestado",
  "en_curso",
  "esperando_cliente",
  "esperando_organismo",
  "observado",
  "aprobado",
  "rechazado",
  "vencido",
] as const;

export type EstadoExpediente = (typeof EXPEDIENTE_ESTADOS)[number];

export const EXPEDIENTE_TRANSITIONS: Record<string, string[]> = {
  consulta: ["presupuestado", "en_curso"],
  presupuestado: ["en_curso", "consulta"],
  en_curso: ["esperando_cliente", "esperando_organismo", "observado", "aprobado", "rechazado"],
  esperando_cliente: ["en_curso", "observado"],
  esperando_organismo: ["en_curso", "observado", "aprobado", "rechazado"],
  observado: ["en_curso", "esperando_cliente", "rechazado"],
  aprobado: ["vencido"],
  rechazado: ["consulta"],
  vencido: ["consulta"],
};

export const EXPEDIENTE_LABELS: Record<string, string> = {
  consulta: "Consulta",
  presupuestado: "Presupuestado",
  en_curso: "En Curso",
  esperando_cliente: "Esperando Cliente",
  esperando_organismo: "Esperando Organismo",
  observado: "Observado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  vencido: "Vencido",
};

export const EXPEDIENTE_COLORS: Record<string, string> = {
  consulta: "bg-slate-100 text-slate-700",
  presupuestado: "bg-indigo-100 text-indigo-800",
  en_curso: "bg-emerald-100 text-emerald-800",
  esperando_cliente: "bg-amber-100 text-amber-800",
  esperando_organismo: "bg-sky-100 text-sky-800",
  observado: "bg-orange-100 text-orange-800",
  aprobado: "bg-green-100 text-green-800",
  rechazado: "bg-red-100 text-red-800",
  vencido: "bg-red-50 text-red-600",
};

// ─── HELPERS ─────────────────────────────────────────
export function canTransitionGestion(from: string, to: string): boolean {
  return GESTION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionExpediente(from: string, to: string): boolean {
  return EXPEDIENTE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function calcularSemaforo(expediente: {
  estado: string;
  fechaLimite?: Date | null;
  progreso: number;
}): "verde" | "amarillo" | "rojo" {
  if (["observado", "rechazado", "vencido"].includes(expediente.estado)) return "rojo";

  if (expediente.fechaLimite) {
    const diasRestantes = Math.ceil(
      (new Date(expediente.fechaLimite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (diasRestantes < 0) return "rojo";
    if (diasRestantes < 30) return "amarillo";
  }

  if (expediente.progreso >= 50) return "amarillo";
  return "verde";
}

export const PRIORIDADES = ["baja", "normal", "alta", "urgente"] as const;
export type Prioridad = (typeof PRIORIDADES)[number];

export const PRIORIDAD_COLORS: Record<string, string> = {
  baja: "bg-slate-100 text-slate-600",
  normal: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};
