const STORAGE_KEY = 'sgrt_api_keys';
const OLLAMA_STORAGE_KEY = 'sgrt_ollama_config';
const PROVIDER_STORAGE_KEY = 'sgrt_chat_provider';

type ApiKeyName = 'GEMINI' | 'ANTHROPIC';

export type ChatProvider = 'anthropic' | 'ollama';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

function getStoredKeys(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getApiKey(name: ApiKeyName): string {
  const stored = getStoredKeys()[name];
  if (stored) return stored;
  // Vite requiere acceso estático a import.meta.env
  if (name === 'GEMINI') return import.meta.env.VITE_GEMINI_API_KEY || '';
  if (name === 'ANTHROPIC') return import.meta.env.VITE_ANTHROPIC_API_KEY || '';
  return '';
}

export function setApiKey(name: ApiKeyName, value: string): void {
  const keys = getStoredKeys();
  if (value.trim()) {
    keys[name] = value.trim();
  } else {
    delete keys[name];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function getAllApiKeys(): Record<ApiKeyName, string> {
  return {
    GEMINI: getApiKey('GEMINI'),
    ANTHROPIC: getApiKey('ANTHROPIC'),
  };
}

const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: 'http://localhost:11434',
  model: 'llama3.2:latest',
};

export function getOllamaConfig(): OllamaConfig {
  try {
    const raw = localStorage.getItem(OLLAMA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_OLLAMA_CONFIG, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_OLLAMA_CONFIG };
}

export function setOllamaConfig(config: Partial<OllamaConfig>): void {
  const current = getOllamaConfig();
  localStorage.setItem(OLLAMA_STORAGE_KEY, JSON.stringify({ ...current, ...config }));
}

export function getChatProvider(): ChatProvider {
  const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
  if (stored === 'ollama') return 'ollama';
  return 'anthropic';
}

export function setChatProvider(provider: ChatProvider): void {
  localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
}
