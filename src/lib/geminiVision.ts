const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('VITE_GEMINI_API_KEY no está configurada en .env.local');
  return key;
}

export interface ProductData {
  nombre: string;
  marca: string;
  clasificacion: string;
  composicion: string;
  paisOrigen: string;
  fabricante: string;
  usoPrevisto: string;
  observaciones: string;
}

const EXTRACTION_PROMPT = `Analizá las imágenes del producto y extraé toda la información que puedas encontrar. Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin backticks) con esta estructura exacta:

{
  "nombre": "nombre o denominación de venta del producto",
  "marca": "marca comercial",
  "clasificacion": "una de: Alimento, Suplemento dietario, Envase / Material en contacto con alimentos, Cosmético, Producto de higiene, Producto médico, Otro",
  "composicion": "lista de ingredientes, materiales o composición",
  "paisOrigen": "país de origen o fabricación",
  "fabricante": "nombre del fabricante o elaborador",
  "usoPrevisto": "uso previsto o indicaciones de uso",
  "observaciones": "cualquier otro dato relevante: peso neto, conservación, lote, vencimiento, certificaciones, normativas mencionadas, alérgenos, etc."
}

Si no encontrás un dato, dejá el campo como string vacío "".
Extraé TODO lo que se pueda leer: etiquetas, rótulos, tablas nutricionales, certificados, textos en cualquier idioma. Si el texto está en otro idioma, traducilo al español.`;

export async function analyzeProductImages(files: File[]): Promise<ProductData> {
  const apiKey = getApiKey();

  const imageParts = await Promise.all(
    files.map(async (file) => {
      const base64 = await fileToBase64(file);
      return {
        inline_data: {
          mime_type: file.type,
          data: base64,
        },
      };
    })
  );

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: EXTRACTION_PROMPT },
            ...imageParts,
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error Gemini (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Clean markdown fences if present
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      nombre: parsed.nombre || '',
      marca: parsed.marca || '',
      clasificacion: parsed.clasificacion || '',
      composicion: parsed.composicion || '',
      paisOrigen: parsed.paisOrigen || '',
      fabricante: parsed.fabricante || '',
      usoPrevisto: parsed.usoPrevisto || '',
      observaciones: parsed.observaciones || '',
    };
  } catch {
    throw new Error('No se pudo interpretar la respuesta de Gemini. Intentá con otra imagen.');
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:mime;base64, prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
