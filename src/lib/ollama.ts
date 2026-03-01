import { getOllamaConfig } from './apiKeys';
import type { ChatMessage } from './anthropic';

function getBaseUrl(): string {
  const config = getOllamaConfig();
  let url = config.baseUrl.replace(/\/+$/, '');

  // In dev mode, proxy through Vite to avoid CORS
  if (import.meta.env.DEV && (url === 'http://localhost:11434' || url === 'http://127.0.0.1:11434')) {
    return '/ollama-api';
  }
  return url;
}

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

export async function checkOllamaAvailable(): Promise<{ available: boolean; models: OllamaModel[] }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${getBaseUrl()}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return { available: false, models: [] };

    const data = await res.json();
    return { available: true, models: data.models || [] };
  } catch {
    return { available: false, models: [] };
  }
}

export function isOllamaConfigured(): boolean {
  const config = getOllamaConfig();
  return !!config.baseUrl && !!config.model;
}

export interface OllamaChatOptions {
  systemPrompt?: string;
  signal?: AbortSignal;
  temperature?: number;
}

export async function sendChat(
  messages: ChatMessage[],
  onChunk?: (text: string) => void,
  options?: OllamaChatOptions,
): Promise<string> {
  const config = getOllamaConfig();
  const baseUrl = getBaseUrl();

  const ollamaMessages: { role: string; content: string }[] = [];
  if (options?.systemPrompt) {
    ollamaMessages.push({ role: 'system', content: options.systemPrompt });
  }
  ollamaMessages.push(...messages.map(m => ({ role: m.role, content: m.content })));

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages: ollamaMessages,
      stream: !!onChunk,
      options: {
        temperature: options?.temperature ?? 0.4,
      },
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error Ollama (${response.status}): ${err}`);
  }

  // Non-streaming
  if (!onChunk) {
    const data = await response.json();
    return data.message?.content || 'No se obtuvo respuesta.';
  }

  // Streaming — NDJSON (one JSON object per line)
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No se pudo leer la respuesta en streaming.');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.message?.content) {
          fullText += parsed.message.content;
          onChunk(fullText);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullText;
}

/**
 * Extract JSON from model output that may contain markdown fences or extra text.
 * Useful for smaller models that don't always return clean JSON.
 */
export function extractJSON<T>(text: string, fallback: T): T {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {}

  // Remove markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {}
  }

  // Find first { ... } block
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {}
  }

  return fallback;
}
