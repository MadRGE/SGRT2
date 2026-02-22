// Centralized estado (status) constants for trámites, gestiones, documentos, and prioridades.

// ── Trámite estados ─────────────────────────────────────────────────────────

export const TRAMITE_ESTADOS = [
  'consulta', 'presupuestado', 'en_curso', 'esperando_cliente',
  'esperando_organismo', 'observado', 'aprobado', 'rechazado', 'vencido',
] as const;

export const TRAMITE_ESTADO_LABELS: Record<string, string> = {
  consulta: 'Consulta',
  presupuestado: 'Presupuestado',
  en_curso: 'En Curso',
  esperando_cliente: 'Esperando Cliente',
  esperando_organismo: 'Esperando Organismo',
  observado: 'Observado',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  vencido: 'Vencido',
};

export const TRAMITE_ESTADO_LABELS_SHORT: Record<string, string> = {
  consulta: 'Consulta',
  presupuestado: 'Presupuestado',
  en_curso: 'En Curso',
  esperando_cliente: 'Esp. Cliente',
  esperando_organismo: 'Esp. Organismo',
  observado: 'Observado',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  vencido: 'Vencido',
};

export const TRAMITE_ESTADO_COLORS: Record<string, string> = {
  consulta: 'bg-slate-100 text-slate-600',
  presupuestado: 'bg-purple-100 text-purple-700',
  en_curso: 'bg-blue-100 text-blue-700',
  esperando_cliente: 'bg-yellow-100 text-yellow-700',
  esperando_organismo: 'bg-orange-100 text-orange-700',
  observado: 'bg-red-100 text-red-700',
  aprobado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700',
  vencido: 'bg-red-100 text-red-700',
};

export const TRAMITE_ESTADO_COLORS_BORDER: Record<string, string> = {
  consulta: 'bg-slate-100 text-slate-700 border-slate-300',
  presupuestado: 'bg-purple-100 text-purple-700 border-purple-300',
  en_curso: 'bg-blue-100 text-blue-700 border-blue-300',
  esperando_cliente: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  esperando_organismo: 'bg-orange-100 text-orange-700 border-orange-300',
  observado: 'bg-red-100 text-red-700 border-red-300',
  aprobado: 'bg-green-100 text-green-700 border-green-300',
  rechazado: 'bg-red-100 text-red-700 border-red-300',
  vencido: 'bg-red-100 text-red-700 border-red-300',
};

// ── Gestión estados ─────────────────────────────────────────────────────────

export const GESTION_ESTADOS = [
  'relevamiento', 'en_curso', 'en_espera', 'finalizado', 'archivado',
] as const;

export const GESTION_ESTADO_LABELS: Record<string, string> = {
  relevamiento: 'Relevamiento',
  en_curso: 'En Curso',
  en_espera: 'En Espera',
  finalizado: 'Finalizado',
  archivado: 'Archivado',
};

export const GESTION_ESTADO_COLORS: Record<string, string> = {
  relevamiento: 'bg-purple-100 text-purple-700',
  en_curso: 'bg-blue-100 text-blue-700',
  en_espera: 'bg-yellow-100 text-yellow-700',
  finalizado: 'bg-green-100 text-green-700',
  archivado: 'bg-slate-100 text-slate-500',
};

export const GESTION_ESTADO_COLORS_BORDER: Record<string, string> = {
  relevamiento: 'bg-purple-100 text-purple-700 border-purple-300',
  en_curso: 'bg-blue-100 text-blue-700 border-blue-300',
  en_espera: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  finalizado: 'bg-green-100 text-green-700 border-green-300',
  archivado: 'bg-slate-100 text-slate-700 border-slate-300',
};

export const GESTION_ESTADO_FILTER_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'relevamiento', label: 'Relevamiento' },
  { value: 'en_curso', label: 'En Curso' },
  { value: 'en_espera', label: 'En Espera' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'archivado', label: 'Archivado' },
];

// ── Documento (trámite) estados ─────────────────────────────────────────────

export const DOC_ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  presentado: 'Presentado',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  vencido: 'Vencido',
};

export const DOC_ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-slate-100 text-slate-600',
  presentado: 'bg-blue-100 text-blue-700',
  aprobado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700',
  vencido: 'bg-orange-100 text-orange-700',
};

export const DOC_ESTADO_NEXT: Record<string, string> = {
  pendiente: 'presentado',
  presentado: 'aprobado',
  aprobado: 'pendiente',
  rechazado: 'pendiente',
  vencido: 'pendiente',
};

// ── Documento cliente estados ───────────────────────────────────────────────

export const DOC_CLIENTE_ESTADOS = [
  { value: 'vigente', label: 'Vigente', color: 'bg-green-100 text-green-700' },
  { value: 'vencido', label: 'Vencido', color: 'bg-red-100 text-red-700' },
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
];

export const DOC_CLIENTE_CATEGORIAS = [
  { value: 'general', label: 'General' },
  { value: 'societario', label: 'Societario' },
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'comercio_exterior', label: 'Comercio Exterior' },
  { value: 'tecnico', label: 'Tecnico' },
];

// ── Prioridad ───────────────────────────────────────────────────────────────

export const PRIORIDADES = ['baja', 'normal', 'alta', 'urgente'] as const;

export const PRIORIDAD_COLORS: Record<string, string> = {
  urgente: 'bg-red-500',
  alta: 'bg-orange-400',
  normal: 'bg-blue-400',
  baja: 'bg-slate-300',
};

// ── Semáforo ────────────────────────────────────────────────────────────────

export const SEMAFORO_OPTIONS = [
  { value: 'verde', color: 'bg-green-500', ring: 'ring-green-300' },
  { value: 'amarillo', color: 'bg-yellow-400', ring: 'ring-yellow-300' },
  { value: 'rojo', color: 'bg-red-500', ring: 'ring-red-300' },
];

export const SEMAFORO_COLORS: Record<string, string> = {
  verde: 'bg-green-500',
  amarillo: 'bg-yellow-400',
  rojo: 'bg-red-500',
};
