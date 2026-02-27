// Centralized constants for the Despachante de Aduanas module.

// ── Despacho estados ───────────────────────────────────────────────────────

export const DESPACHO_ESTADOS = [
  'en_preparacion', 'presentado', 'canal_verde', 'canal_naranja', 'canal_rojo', 'liberado', 'rechazado',
] as const;

export const DESPACHO_ESTADO_LABELS: Record<string, string> = {
  en_preparacion: 'En Preparación',
  presentado: 'Presentado',
  canal_verde: 'Canal Verde',
  canal_naranja: 'Canal Naranja',
  canal_rojo: 'Canal Rojo',
  liberado: 'Liberado',
  rechazado: 'Rechazado',
};

export const DESPACHO_ESTADO_COLORS: Record<string, string> = {
  en_preparacion: 'bg-slate-100 text-slate-600',
  presentado: 'bg-blue-100 text-blue-700',
  canal_verde: 'bg-green-100 text-green-700',
  canal_naranja: 'bg-orange-100 text-orange-700',
  canal_rojo: 'bg-red-100 text-red-700',
  liberado: 'bg-emerald-100 text-emerald-700',
  rechazado: 'bg-red-200 text-red-800',
};

export const DESPACHO_ESTADO_COLORS_BORDER: Record<string, string> = {
  en_preparacion: 'bg-slate-100 text-slate-700 border-slate-300',
  presentado: 'bg-blue-100 text-blue-700 border-blue-300',
  canal_verde: 'bg-green-100 text-green-700 border-green-300',
  canal_naranja: 'bg-orange-100 text-orange-700 border-orange-300',
  canal_rojo: 'bg-red-100 text-red-700 border-red-300',
  liberado: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  rechazado: 'bg-red-200 text-red-800 border-red-400',
};

export const DESPACHO_CHART_COLORS: Record<string, string> = {
  en_preparacion: '#94a3b8',
  presentado: '#3b82f6',
  canal_verde: '#22c55e',
  canal_naranja: '#f97316',
  canal_rojo: '#ef4444',
  liberado: '#10b981',
  rechazado: '#dc2626',
};

export const DESPACHO_ESTADO_FILTER_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'en_preparacion', label: 'En Preparación' },
  { value: 'presentado', label: 'Presentado' },
  { value: 'canal_verde', label: 'Canal Verde' },
  { value: 'canal_naranja', label: 'Canal Naranja' },
  { value: 'canal_rojo', label: 'Canal Rojo' },
  { value: 'liberado', label: 'Liberado' },
  { value: 'rechazado', label: 'Rechazado' },
];

// State machine transitions: estado → allowed next states
export const DESPACHO_TRANSITIONS: Record<string, string[]> = {
  en_preparacion: ['presentado'],
  presentado: ['canal_verde', 'canal_naranja', 'canal_rojo', 'rechazado'],
  canal_verde: ['liberado'],
  canal_naranja: ['liberado', 'rechazado'],
  canal_rojo: ['liberado', 'rechazado'],
  liberado: [],
  rechazado: ['en_preparacion'],
};

// ── Carga estados ──────────────────────────────────────────────────────────

export const CARGA_ESTADOS = [
  'en_origen', 'en_transito', 'en_puerto', 'deposito_fiscal', 'en_verificacion', 'liberado',
] as const;

export const CARGA_ESTADO_LABELS: Record<string, string> = {
  en_origen: 'En Origen',
  en_transito: 'En Tránsito',
  en_puerto: 'En Puerto',
  deposito_fiscal: 'Depósito Fiscal',
  en_verificacion: 'En Verificación',
  liberado: 'Liberado',
};

export const CARGA_ESTADO_COLORS: Record<string, string> = {
  en_origen: 'bg-slate-100 text-slate-600',
  en_transito: 'bg-blue-100 text-blue-700',
  en_puerto: 'bg-indigo-100 text-indigo-700',
  deposito_fiscal: 'bg-amber-100 text-amber-700',
  en_verificacion: 'bg-purple-100 text-purple-700',
  liberado: 'bg-emerald-100 text-emerald-700',
};

export const CARGA_TRANSITIONS: Record<string, string[]> = {
  en_origen: ['en_transito'],
  en_transito: ['en_puerto'],
  en_puerto: ['deposito_fiscal'],
  deposito_fiscal: ['en_verificacion'],
  en_verificacion: ['liberado'],
  liberado: [],
};

// ── Tipos de documento aduanero ────────────────────────────────────────────

export const DESPACHO_DOC_TIPOS = [
  { value: 'dua', label: 'DUA (Declaración Única de Aduana)' },
  { value: 'permiso_embarque', label: 'Permiso de Embarque' },
  { value: 'certificado_origen', label: 'Certificado de Origen' },
  { value: 'factura_comercial', label: 'Factura Comercial' },
  { value: 'packing_list', label: 'Packing List' },
  { value: 'conocimiento_embarque', label: 'Conocimiento de Embarque (BL/AWB)' },
  { value: 'poliza_seguro', label: 'Póliza de Seguro' },
  { value: 'certificado_sanitario', label: 'Certificado Sanitario' },
  { value: 'licencia_importacion', label: 'Licencia de Importación' },
  { value: 'nota_pedido', label: 'Nota de Pedido' },
  { value: 'declaracion_valor', label: 'Declaración de Valor' },
  { value: 'otro', label: 'Otro' },
] as const;

export const DESPACHO_DOC_TIPO_LABELS: Record<string, string> = Object.fromEntries(
  DESPACHO_DOC_TIPOS.map(t => [t.value, t.label])
);

// ── Tipos de transporte ────────────────────────────────────────────────────

export const TRANSPORTE_TIPOS = [
  { value: 'maritimo', label: 'Marítimo' },
  { value: 'aereo', label: 'Aéreo' },
  { value: 'terrestre', label: 'Terrestre' },
  { value: 'multimodal', label: 'Multimodal' },
] as const;

export const TRANSPORTE_TIPO_LABELS: Record<string, string> = {
  maritimo: 'Marítimo',
  aereo: 'Aéreo',
  terrestre: 'Terrestre',
  multimodal: 'Multimodal',
};

// ── Tipo despacho ──────────────────────────────────────────────────────────

export const DESPACHO_TIPO_LABELS: Record<string, string> = {
  importacion: 'Importación',
  exportacion: 'Exportación',
};

export const DESPACHO_TIPO_COLORS: Record<string, string> = {
  importacion: 'bg-cyan-100 text-cyan-700',
  exportacion: 'bg-violet-100 text-violet-700',
};

// ── Liquidación estados ────────────────────────────────────────────────────

export const LIQUIDACION_ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  confirmado: 'Confirmado',
  pagado: 'Pagado',
};

export const LIQUIDACION_ESTADO_COLORS: Record<string, string> = {
  borrador: 'bg-slate-100 text-slate-600',
  confirmado: 'bg-blue-100 text-blue-700',
  pagado: 'bg-green-100 text-green-700',
};
