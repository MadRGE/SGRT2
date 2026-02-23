import { getApiKey } from './apiKeys';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const API_VERSION = '2023-06-01';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function getKey(): string {
  const key = getApiKey('ANTHROPIC');
  if (!key) throw new Error('La clave de Anthropic no está configurada. Andá a Configuración > API Keys para agregarla.');
  return key;
}

export function isAnthropicAvailable(): boolean {
  return !!getApiKey('ANTHROPIC');
}

const SYSTEM_PROMPT = `Sos un asistente experto en regulación sanitaria argentina, especializado en trámites ante ANMAT (Administración Nacional de Medicamentos, Alimentos y Tecnología Médica).

Tu conocimiento abarca:
- Registro de productos médicos, alimentos, cosméticos, suplementos dietarios y domisanitarios
- Normativas y disposiciones de ANMAT vigentes
- Procesos de habilitación de establecimientos
- Certificaciones de libre venta y exportación
- Buenas prácticas de manufactura (BPM/GMP)
- Rotulado y etiquetado según normativa argentina
- Clasificación de productos según riesgo
- Plazos y requisitos para cada tipo de trámite

Respondé siempre en español argentino, de forma clara, concisa y profesional. Si no estás seguro de algo, indicalo claramente. Cuando sea relevante, citá la normativa aplicable (disposiciones, resoluciones, leyes).`;

export async function sendChat(
  messages: ChatMessage[],
  onChunk?: (text: string) => void,
): Promise<string> {
  const apiKey = getKey();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': API_VERSION,
    'anthropic-dangerous-direct-browser-access': 'true',
  };

  if (onChunk) {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: MODEL,
        system: SYSTEM_PROMPT,
        messages,
        stream: true,
        max_tokens: 4096,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Error Claude (${response.status}): ${err}`);
    }

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
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            fullText += parsed.delta.text;
            onChunk(fullText);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    return fullText;
  }

  // Non-streaming fallback
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      system: SYSTEM_PROMPT,
      messages,
      max_tokens: 4096,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error Claude (${response.status}): ${err}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: any) => b.type === 'text');
  return textBlock?.text || 'No se obtuvo respuesta.';
}
