/**
 * api.ts — Central HTTP client for SGRT backend (FastAPI)
 *
 * Replaces Supabase entirely. All data goes through localhost:8500/api/v2/
 * Uses JWT tokens stored in localStorage.
 */

const API_BASE = 'http://localhost:8500/api/v2';

// ─── Token management ───

const TOKEN_KEY = 'sgrt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Base fetch ───

async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Error: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ───

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  cliente_id: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const auth = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    storeToken(res.token);
    return res;
  },

  async signup(email: string, password: string, nombre: string, rol?: string): Promise<LoginResponse> {
    const res = await apiFetch<LoginResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, nombre, rol: rol || 'gestor' }),
    });
    storeToken(res.token);
    return res;
  },

  async me(): Promise<User> {
    return apiFetch<User>('/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiFetch('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  },

  logout(): void {
    clearToken();
  },

  isAuthenticated(): boolean {
    return !!getStoredToken();
  },
};

// ─── Usuarios (admin) ───

export interface UsuarioRow extends User {
  activo: boolean;
  created_at: string;
  cliente_razon_social?: string;
}

export const usuarios = {
  async list(): Promise<UsuarioRow[]> {
    return apiFetch('/usuarios');
  },

  async get(id: string): Promise<UsuarioRow> {
    return apiFetch(`/usuarios/${id}`);
  },

  async create(data: { email: string; password: string; nombre: string; rol: string; cliente_id?: string }): Promise<UsuarioRow> {
    return apiFetch('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: { nombre?: string; rol?: string; cliente_id?: string; activo?: boolean }): Promise<void> {
    await apiFetch(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async setPassword(id: string, newPassword: string): Promise<void> {
    await apiFetch(`/usuarios/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password: newPassword }),
    });
  },

  async delete(id: string): Promise<void> {
    await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
  },
};

// ─── Client Modules ───

export interface ClienteModulo {
  modulo: string;
  agente_activo: number;
}

export const clienteModulos = {
  async get(clienteId: string): Promise<ClienteModulo[]> {
    return apiFetch(`/clientes/${clienteId}/modulos`);
  },

  async set(clienteId: string, modulos: string[], agenteActivo = true): Promise<void> {
    await apiFetch(`/clientes/${clienteId}/modulos`, {
      method: 'PUT',
      body: JSON.stringify({ modulos, agente_activo: agenteActivo }),
    });
  },
};

// ─── Alertas Regulatorias ───

export interface AlertaRegulatoria {
  id: string;
  modulo: string;
  titulo: string;
  resumen: string;
  detalle: string;
  fuente: string;
  impacto: string;
  tipo_cambio: string;
  acciones_requeridas: string;
  leida: number;
  created_at: string;
  cliente_leida?: number;
  clientes_afectados?: { cliente_id: string; razon_social: string; leida: number }[];
}

export const alertas = {
  async list(modulo?: string): Promise<AlertaRegulatoria[]> {
    const q = modulo ? `?modulo=${modulo}` : '';
    return apiFetch(`/alertas${q}`);
  },

  async get(id: string): Promise<AlertaRegulatoria> {
    return apiFetch(`/alertas/${id}`);
  },

  async create(data: {
    modulo: string; titulo: string; resumen?: string; detalle?: string;
    fuente?: string; impacto?: string; tipo_cambio?: string; acciones_requeridas?: string;
  }): Promise<AlertaRegulatoria> {
    return apiFetch('/alertas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateWithAI(data: {
    modulo: string; titulo: string; resumen?: string; fuente?: string;
  }): Promise<AlertaRegulatoria> {
    return apiFetch('/alertas/generar', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async forClient(clienteId: string, soloNoLeidas = false): Promise<AlertaRegulatoria[]> {
    const q = soloNoLeidas ? '?solo_no_leidas=true' : '';
    return apiFetch(`/clientes/${clienteId}/alertas${q}`);
  },

  async markRead(clienteId: string, alertaId: string): Promise<void> {
    await apiFetch(`/clientes/${clienteId}/alertas/${alertaId}/leer`, { method: 'PUT' });
  },
};

// ─── Export grouped API ───

const api = { auth, usuarios, clienteModulos, alertas };
export default api;
