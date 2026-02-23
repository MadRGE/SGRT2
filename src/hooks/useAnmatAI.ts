import { useState, useCallback, useRef } from 'react';
import { getApiKey } from '../lib/apiKeys';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const API_VERSION = '2023-06-01';

const SYSTEM_PROMPTS: Record<string, string> = {
  'ficha-producto': `Sos un especialista en regulación sanitaria argentina (ANMAT/INAL/SENASA). Tu tarea es generar una Ficha Técnica de Producto completa y profesional para presentar ante ANMAT.

La ficha debe incluir las siguientes secciones según corresponda al tipo de producto:

1. **DATOS DEL PRODUCTO** - Denominación de venta, Nombre comercial, Marca, Clasificación regulatoria, Código interno / SKU

2. **DATOS DEL ESTABLECIMIENTO** - Razón social del elaborador/importador, RNE, RNPA/RPE, Dirección de planta/depósito

3. **COMPOSICIÓN Y MATERIALES** - Lista de ingredientes / composición cualicuantitativa, Materiales de empaque primario y secundario, Materiales en contacto con el producto

4. **INFORMACIÓN TÉCNICA** - Uso previsto / indicaciones, Condiciones de conservación, Vida útil, Forma de presentación, Lote / codificación

5. **NORMATIVA APLICABLE** - CAA artículos aplicables, Disposiciones ANMAT relevantes, Normas IRAM/ISO si aplican, Resoluciones GMC/MERCOSUR

6. **ROTULADO** - Información obligatoria del rótulo, Declaración de alérgenos, Información nutricional (si aplica), Advertencias obligatorias

Generá la ficha en formato profesional, con lenguaje técnico-regulatorio argentino. Si faltan datos, indicá "[COMPLETAR]" en esos campos. Usá formato Markdown.`,

  'bpm-rne': `Sos un especialista en regulación sanitaria argentina (ANMAT/INAL) experto en Buenas Prácticas de Manufactura (BPM). Tu tarea es generar documentación BPM profesional y completa para la obtención del RNE (Registro Nacional de Establecimiento) ante ANMAT.

Según el tipo de documento solicitado, generá el contenido completo siguiendo la normativa vigente (CAA Cap. II, Resolución GMC 80/96).

Tipos de documentos que podés generar:
- **Manual de BPM**: Política de calidad, estructura organizativa, instalaciones, control de operaciones, higiene, materias primas, documentación, retiro de productos
- **POEs**: Recepción, almacenamiento, proceso productivo, envasado, despacho, trazabilidad y recall
- **POES**: Pre-operacional, operacional, superficies en contacto, contaminación cruzada, higiene del personal, agentes contaminantes, control de plagas, agua segura
- **Planillas y registros**: Control de temperaturas, limpieza y desinfección, recepción de materias primas, capacitaciones, control de plagas, trazabilidad
- **Layout/Flujograma**: Descripción de distribución de planta y flujo de proceso

Generá el documento en formato profesional con lenguaje técnico-regulatorio argentino. Donde falten datos específicos del establecimiento, indicá [COMPLETAR]. Usá formato Markdown.`,
};

const DEFAULT_SYSTEM = `Sos un especialista en regulación sanitaria argentina (ANMAT). Generá documentación técnica profesional en formato Markdown. Donde falten datos, indicá [COMPLETAR].`;

interface UseAnmatAIReturn {
  output: string;
  loading: boolean;
  error: string | null;
  generate: (tool: string, userMessage: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useAnmatAI(): UseAnmatAIReturn {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    setOutput('');
    setError(null);
    setLoading(false);
  }, []);

  const generate = useCallback(async (tool: string, userMessage: string) => {
    cancel();
    setOutput('');
    setError(null);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const apiKey = getApiKey('ANTHROPIC');
    if (!apiKey) {
      setError('La clave de Anthropic no está configurada. Andá a Configuración > API Keys.');
      setLoading(false);
      return;
    }

    const systemPrompt = SYSTEM_PROMPTS[tool] || DEFAULT_SYSTEM;

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': API_VERSION,
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userMessage },
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error Claude (${response.status}): ${errText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No se pudo leer la respuesta');

      const decoder = new TextDecoder();
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
              setOutput(prev => prev + parsed.delta.text);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Error al generar documento');
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [cancel]);

  return { output, loading, error, generate, cancel, reset };
}
