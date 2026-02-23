const STORAGE_KEY = 'sgrt_api_keys';

type ApiKeyName = 'GEMINI' | 'DEEPSEEK';

const ENV_MAP: Record<ApiKeyName, string> = {
  GEMINI: 'VITE_GEMINI_API_KEY',
  DEEPSEEK: 'VITE_DEEPSEEK_API_KEY',
};

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
  return (import.meta.env[ENV_MAP[name]] as string) || '';
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
  };
}
