import { useState, useCallback, useRef } from 'react';
import { getApiKey } from '../lib/apiKeys';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const API_VERSION = '2023-06-01';

const SYSTEM_PROMPTS: Record<string, string> = {
  'ficha-producto': `Sos un especialista en regulación sanitaria argentina (ANMAT/INAL/SENASA). Tu tarea es generar una Ficha Técnica de Producto / Declaración del Fabricante completa y profesional para presentar ante ANMAT.

Seguí EXACTAMENTE esta estructura, adaptando las secciones según el tipo de producto. Usá como referencia estos ejemplos reales aprobados por ANMAT:

---

**FICHA TÉCNICA – ENVASES Y UTENSILIOS EN CONTACTO CON ALIMENTOS**

**1. Datos del Producto**
- Marca: [marca comercial]
- Modelo: [modelo/nombre del producto]
- Códigos: [códigos internos, SKU, modelo del fabricante]
- Origen: [país de fabricación]

**2. Descripción del Producto**
[Párrafo profesional describiendo el producto, sus características, diseño, forma de uso. Incluir detalles como: materiales principales, acabados, sistemas de cierre, indicaciones del fabricante si las hay.]

**3. Tabla de Partes, Clasificación de Materiales y Contacto con Alimentos**
| Parte / Pieza | Color | Clasificación del Material | Material Constitutivo | Contacto con Alimento |
|---|---|---|---|---|
[Completar cada fila con cada componente del producto]

**4. Condiciones de Uso**
- Temperatura ambiente: [Sí/No]
- Uso en refrigeración: [Sí/No]
- Uso en calor: [Sí/No/Hasta X°C]
- Apto lavavajillas: [Sí/No/Lavado a mano]
- Apto microondas: [Sí/No]
- Reutilizable: [Sí/No]

**5. Tipos de Alimentos en Contacto**
Marcar los que apliquen:
- [ ] Alimentos acuosos no ácidos (pH > 4.5)
- [ ] Alimentos acuosos ácidos (pH < 4.5)
- [ ] Alimentos grasos o aceitosos
- [ ] Alimentos alcohólicos (≤ 20% v/v)
- [ ] Otros: [especificar]

**6. Modelos Comprendidos**
La presente ficha técnica comprende envases de distintos tamaños y diseños, incluyendo de forma enunciativa y no limitativa:
[Lista de modelos, variantes, capacidades, colores]

**7. Aptitud para Contacto con Alimentos**
[Declaración de que el producto cumple con la normativa vigente para materiales en contacto con alimentos. Indicar que el material es virgen, grado alimentario, apto para contacto con alimentos.]

**8. Declaración**
El fabricante/importador declara que el producto cumple con los materiales, condiciones de uso y normativas aplicables para contacto con alimentos.

**Fecha de emisión:** [fecha actual]
**Firma y sello:** _________________________________
**Importador / Fabricante:** [COMPLETAR]

---

Reglas importantes:
- Usá lenguaje técnico-regulatorio argentino, profesional y conciso.
- La tabla de partes y materiales es OBLIGATORIA: detallá cada pieza del producto con su material y si tiene contacto con alimento.
- Si el usuario no provee un dato, indicá "[COMPLETAR]".
- Usá formato Markdown con encabezados, negritas y tablas.
- La ficha debe ser presentable directamente ante ANMAT sin modificaciones.
- Para productos alimenticios (no envases), adaptá las secciones: reemplazá "Materiales" por "Composición/Ingredientes", agregá "Información Nutricional", "Condiciones de Conservación", "Vida Útil", "Rotulado" según corresponda.`,

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
