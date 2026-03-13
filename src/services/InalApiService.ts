/**
 * InalApiService — Central API client for INAL backend (FastAPI)
 *
 * Replaces Supabase for all envase registration, materials,
 * tramites, fichas, solicitudes, and Hammer operations.
 *
 * Backend runs at localhost:8500
 */

const API_BASE = 'http://localhost:8500/api';

async function api<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// ─── Materials ───

export interface Material {
  codigo: string;
  nombre: string;
  categoria: string;
  clasificacion_anmat: string;
  temp_min: number;
  temp_max: number;
  temp_ambiente: number;
  microondas: boolean;
  lavavajillas: boolean;
  bpa_free: boolean;
  alimentos: string[];
  riesgo: string;
  keywords: string[];
}

let _materialsCache: Record<string, Material> | null = null;

export async function getMaterials(): Promise<Record<string, Material>> {
  if (_materialsCache) return _materialsCache;
  _materialsCache = await api('/materials');
  return _materialsCache!;
}

export async function getMaterialsList(): Promise<Material[]> {
  const mats = await getMaterials();
  return Object.values(mats);
}

// ─── Upload & Parse ───

export interface ParsedProduct {
  id: string;
  item_no: string;
  name: string;
  description: string;
  material_code: string;
  material_name: string;
  hs_code: string;
  qty: string;
  brand: string;
  colors: string;
  parts: any[];
  sheet: string;
}

export async function uploadAndParse(file: File): Promise<{ filename: string; products: ParsedProduct[]; count: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Error al procesar archivo');
  return res.json();
}

// ─── Clients ───

export interface Client {
  id: string;
  cuit: string;
  razon_social: string;
  provincia: string;
  departamento?: string;
  localidad: string;
  calle: string;
  telefono: string;
  email: string;
}

export async function getClients(): Promise<Client[]> {
  return api('/clients');
}

export async function saveClient(data: Partial<Client>): Promise<Client> {
  return api('/clients', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteClient(id: string): Promise<void> {
  await api(`/clients/${id}`, { method: 'DELETE' });
}

// ─── Fichas ───

export interface FichaData {
  item_number: string;
  description: string;
  brand: string;
  colors: string;
  models: string;
  proportions?: string;
  origin: string;
  date?: string;
  manufacturer: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  temperatures: { min: string; max: string; ambient: string };
  food_types: string[];
  parts: { name: string; classification: string; material: string; food_contact: boolean }[];
  uses: string[];
}

export async function generateFicha(data: FichaData): Promise<{ id: string; pdf_path: string }> {
  return api('/ficha/generate', { method: 'POST', body: JSON.stringify(data) });
}

export async function listFichas(): Promise<any[]> {
  return api('/fichas');
}

export function getFichaPdfUrl(fichaId: string): string {
  return `${API_BASE}/ficha/${fichaId}/pdf`;
}

// ─── Tramites ───

export interface Tramite {
  id: string;
  tipo: string;
  estado: string;
  cliente: Client | null;
  fabricante: any;
  productos: any[];
  fichas: any[];
  solicitud: any;
  hammer_ejecuciones: any[];
  documentos: any[];
  historial: { fecha: string; accion: string; estado: string }[];
  created_at: string;
  updated_at: string;
}

export async function getTramites(): Promise<Tramite[]> {
  return api('/tramites');
}

export async function createTramite(data: Partial<Tramite>): Promise<Tramite> {
  return api('/tramites', { method: 'POST', body: JSON.stringify(data) });
}

export async function getTramite(id: string): Promise<Tramite> {
  return api(`/tramites/${id}`);
}

export async function updateTramite(id: string, data: Partial<Tramite>): Promise<Tramite> {
  return api(`/tramites/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function addProductosToTramite(id: string, productos: any[]): Promise<any> {
  return api(`/tramites/${id}/productos`, { method: 'POST', body: JSON.stringify({ productos }) });
}

export async function addFichaToTramite(id: string, fichaData: FichaData): Promise<{ id: string; pdf_path: string }> {
  return api(`/tramites/${id}/ficha`, { method: 'POST', body: JSON.stringify(fichaData) });
}

// ─── Solicitudes ───

export async function createSolicitud(data: any): Promise<any> {
  return api('/solicitudes', { method: 'POST', body: JSON.stringify(data) });
}

export async function getSolicitudes(): Promise<any[]> {
  return api('/solicitudes');
}

export async function updateSolicitud(id: string, data: any): Promise<any> {
  return api(`/solicitudes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// ─── Solicitud generation (existing endpoint) ───

export async function generateSolicitudData(data: {
  products: any[];
  client: any;
  manufacturer: any;
  riesgo?: string;
  tipo?: string;
}): Promise<any> {
  return api('/solicitud/generate', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Hammer ───

export interface HammerProcedure {
  id: string;
  nombre: string;
  dominio: string;
  pasos: string[];
  autoejecuteable: boolean;
}

export interface HammerEjecucion {
  id: string;
  tramite_id: string | null;
  procedimiento: string;
  procedimiento_nombre: string;
  estado: 'pendiente' | 'ejecutando' | 'completado' | 'fallido';
  pasos_ejecutados: number;
  pasos_totales: number;
  pasos: string[];
  resultado: any;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export async function getHammerProcedures(): Promise<Record<string, HammerProcedure>> {
  return api('/hammer/procedures');
}

export async function getHammerProceduresForOrganismo(organismo: string): Promise<HammerProcedure[]> {
  return api(`/hammer/procedures/${organismo}`);
}

export async function executeHammer(data: {
  tramite_id?: string;
  tipo_tramite?: string;
  procedimiento: string;
}): Promise<HammerEjecucion> {
  return api('/hammer/ejecutar', { method: 'POST', body: JSON.stringify(data) });
}

export async function getHammerEjecuciones(): Promise<HammerEjecucion[]> {
  return api('/hammer/ejecuciones');
}

export async function getHammerEjecucionesForTramite(tramiteId: string): Promise<HammerEjecucion[]> {
  return api(`/hammer/ejecuciones/${tramiteId}`);
}

export async function updateHammerEjecucion(id: string, data: Partial<HammerEjecucion>): Promise<HammerEjecucion> {
  return api(`/hammer/ejecuciones/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

// ─── Signature ───

export async function uploadSignature(file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  await fetch(`${API_BASE}/signature`, { method: 'POST', body: formData });
}

export function getSignatureUrl(): string {
  return `${API_BASE}/signature`;
}

// ─── Health check ───

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/materials`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
