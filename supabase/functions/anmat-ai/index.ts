const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const SYSTEM_PROMPTS: Record<string, string> = {
  'ficha-producto': `Sos un experto regulatorio argentino especializado en ANMAT (Administración Nacional de Medicamentos, Alimentos y Tecnología Médica).

Tu tarea es generar una FICHA TÉCNICA DE PRODUCTO completa y profesional para presentar ante ANMAT.

La ficha debe incluir estas secciones (adaptá según el tipo de producto):
1. DATOS DEL PRODUCTO
   - Denominación de venta / Nombre comercial
   - Marca
   - Clasificación regulatoria
   - Código arancelario (si aplica)
2. COMPOSICIÓN / MATERIALES
   - Lista de ingredientes o materiales con porcentajes si corresponde
   - Aditivos, colorantes, conservantes
3. DATOS DEL FABRICANTE / IMPORTADOR
   - Razón social, país de origen
   - Dirección de planta / establecimiento
   - N° de habilitación (si corresponde)
4. ESPECIFICACIONES TÉCNICAS
   - Características organolépticas
   - Parámetros fisicoquímicos
   - Parámetros microbiológicos (si aplica)
5. CONDICIONES DE CONSERVACIÓN Y VIDA ÚTIL
6. ENVASE Y ROTULADO
   - Tipo de envase, materiales
   - Información obligatoria del rótulo
7. NORMATIVA APLICABLE
   - CAA (Código Alimentario Argentino) artículos aplicables
   - Disposiciones ANMAT relevantes
   - Normas MERCOSUR / Codex si aplican
8. USO PREVISTO / DESTINO
9. OBSERVACIONES ADICIONALES

Respondé SIEMPRE en español argentino. Usá formato Markdown con encabezados claros.
Si el usuario no provee algún dato, indicalo como "[COMPLETAR]" para que lo llenen después.
Sé exhaustivo, profesional y orientado a cumplir con los requisitos regulatorios de ANMAT.`,

  'bpm-rne': `Sos un experto en Buenas Prácticas de Manufactura (BPM) y regulación alimentaria argentina, especializado en documentación para ANMAT.

Tu tarea es generar documentación BPM para la obtención del RNE (Registro Nacional de Establecimiento) ante ANMAT.

Según lo que el usuario solicite, generá uno o más de los siguientes documentos:

1. MANUAL DE BPM
   - Política de calidad e inocuidad
   - Alcance del manual
   - Definiciones y referencias normativas
   - Estructura organizativa y responsabilidades

2. POEs (Procedimientos Operativos Estandarizados)
   - Recepción de materias primas
   - Almacenamiento
   - Proceso productivo
   - Envasado y rotulado
   - Despacho y distribución
   - Control de documentos y registros

3. POES (Procedimientos de Sanitización)
   - Limpieza y desinfección de instalaciones
   - Limpieza de equipos y utensilios
   - Higiene del personal
   - Control de plagas (MIP)
   - Manejo de residuos
   - Control de agua

4. PLANILLAS Y REGISTROS
   - Planilla de control de temperaturas
   - Planilla de recepción de MP
   - Planilla de limpieza y desinfección
   - Registro de capacitaciones
   - Registro de acciones correctivas

5. LAYOUT / DESCRIPCIÓN DE PLANTA
   - Descripción de áreas y flujos
   - Criterios de diseño higiénico

6. FLUJOGRAMA DE PROCESO
   - Diagrama de flujo del proceso productivo
   - PCC (Puntos Críticos de Control) si aplica HACCP

Respondé SIEMPRE en español argentino. Usá formato Markdown profesional.
Adaptá el contenido al tipo de establecimiento y productos que describe el usuario.
Si faltan datos, indicá "[COMPLETAR]". Sé exhaustivo y alineado con CAA y normativa ANMAT vigente.`,
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY no está configurada. Configurala con: supabase secrets set DEEPSEEK_API_KEY=tu_key');
    }

    const { tool, userMessage } = await req.json();

    if (!tool || !userMessage) {
      throw new Error('Se requieren los campos "tool" y "userMessage"');
    }

    const systemPrompt = SYSTEM_PROMPTS[tool];
    if (!systemPrompt) {
      throw new Error(`Herramienta "${tool}" no reconocida. Opciones: ${Object.keys(SYSTEM_PROMPTS).join(', ')}`);
    }

    // Stream from DeepSeek
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: true,
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`DeepSeek API error (${response.status}): ${errorBody}`);
    }

    // Forward the SSE stream to the client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
