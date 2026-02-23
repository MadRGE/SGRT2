import { getApiKey } from './apiKeys';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function getKey(): string {
  const key = getApiKey('DEEPSEEK');
  if (!key) throw new Error('La clave de DeepSeek no está configurada. Andá a Configuración > API Keys para agregarla.');
  return key;
}

export function isDeepSeekAvailable(): boolean {
  return !!getApiKey('DEEPSEEK');
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

  const allMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ];

  // Use streaming if callback provided
  if (onChunk) {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: allMessages,
        stream: true,
        temperature: 0.4,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Error DeepSeek (${response.status}): ${err}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No se pudo leer la respuesta en streaming.');

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
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
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: allMessages,
      temperature: 0.4,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error DeepSeek (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No se obtuvo respuesta.';
}
