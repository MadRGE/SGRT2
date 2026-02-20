// Tramite estado transitions
export const TRAMITE_TRANSITIONS: Record<string, string[]> = {
  consulta:              ['presupuestado', 'en_curso'],
  presupuestado:         ['en_curso', 'consulta'],
  en_curso:              ['esperando_cliente', 'esperando_organismo', 'observado', 'aprobado', 'rechazado'],
  esperando_cliente:     ['en_curso', 'observado'],
  esperando_organismo:   ['en_curso', 'observado', 'aprobado', 'rechazado'],
  observado:             ['en_curso', 'esperando_cliente', 'rechazado'],
  aprobado:              ['vencido'],
  rechazado:             ['consulta'],
  vencido:               ['consulta'],
};

// Gestion estado transitions
export const GESTION_TRANSITIONS: Record<string, string[]> = {
  relevamiento: ['en_curso', 'archivado'],
  en_curso:     ['en_espera', 'finalizado', 'archivado'],
  en_espera:    ['en_curso', 'archivado'],
  finalizado:   ['archivado'],
  archivado:    ['relevamiento'],
};

export function isTransitionAllowed(
  transitions: Record<string, string[]>,
  currentEstado: string,
  newEstado: string
): boolean {
  const allowed = transitions[currentEstado];
  if (!allowed) return false;
  return allowed.includes(newEstado);
}

export function getAllowedTransitions(
  transitions: Record<string, string[]>,
  currentEstado: string
): string[] {
  return transitions[currentEstado] || [];
}
