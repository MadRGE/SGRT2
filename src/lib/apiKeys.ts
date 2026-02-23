const STORAGE_KEY = 'sgrt_api_keys';

type ApiKeyName = 'GEMINI' | 'DEEPSEEK' | 'ANTHROPIC';

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
  if (name === 'DEEPSEEK') return import.meta.env.VITE_DEEPSEEK_API_KEY || '';
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
    DEEPSEEK: getApiKey('DEEPSEEK'),
    ANTHROPIC: getApiKey('ANTHROPIC'),
  };
}
