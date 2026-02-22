// Centralized shared enums and lookup lists used across multiple pages.

export const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
] as const;

export const ORGANISMOS = [
  'ANMAT', 'INAL', 'SENASA', 'CITES', 'RENPRE', 'ENACOM', 'ANMAC', 'SEDRONAR', 'Aduana', 'Otro',
] as const;

export const PLATAFORMAS = ['TAD', 'TADO', 'VUCE', 'SIGSA', 'Otro'] as const;

export const RESPONSABLES = ['Estudio', 'Cliente', 'Organismo'] as const;

export const REGISTRO_TIPOS = [
  { value: 'RNE', label: 'RNE' },
  { value: 'RNEE', label: 'RNEE' },
  { value: 'habilitacion_anmat', label: 'Habilitacion ANMAT' },
  { value: 'habilitacion_senasa', label: 'Habilitacion SENASA' },
  { value: 'habilitacion_inal', label: 'Habilitacion INAL' },
  { value: 'habilitacion_enacom', label: 'Habilitacion ENACOM' },
  { value: 'habilitacion_cites', label: 'Habilitacion CITES' },
  { value: 'habilitacion_renpre', label: 'Habilitacion RENPRE' },
  { value: 'habilitacion_sedronar', label: 'Habilitacion SEDRONAR' },
  { value: 'habilitacion_anmac', label: 'Habilitacion ANMAC' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'otro', label: 'Otro' },
];

export const REGISTRO_ESTADOS = [
  { value: 'vigente', label: 'Vigente', color: 'bg-green-100 text-green-700' },
  { value: 'en_tramite', label: 'En Tramite', color: 'bg-blue-100 text-blue-700' },
  { value: 'vencido', label: 'Vencido', color: 'bg-red-100 text-red-700' },
  { value: 'suspendido', label: 'Suspendido', color: 'bg-yellow-100 text-yellow-700' },
];

export const DOCS_COMUNES = [
  'Constancia de CUIT',
  'Constancia de Inscripcion AFIP',
  'Estatuto Social / Contrato Social',
  'Acta de Directorio',
  'Poder del representante',
  'DNI del firmante',
  'Ultimo balance',
  'Constancia de domicilio fiscal',
  'Habilitacion municipal',
  'Certificado de libre deuda AFIP',
];

export const TIPO_SEGUIMIENTO = [
  { value: 'nota', label: 'Nota' },
  { value: 'llamada', label: 'Llamada' },
  { value: 'email', label: 'Email' },
  { value: 'documento', label: 'Documento' },
];
