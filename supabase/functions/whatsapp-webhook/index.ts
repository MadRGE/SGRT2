import { createClient } from 'npm:@supabase/supabase-js@2';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const WHATSAPP_API_VERSION = 'v21.0';

// ─── Supabase client (service role) ─────────────────────────────────────────

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ─── Load WhatsApp config from DB ───────────────────────────────────────────

async function loadConfig(supabase: ReturnType<typeof getSupabase>) {
  const { data, error } = await supabase
    .from('whatsapp_config')
    .select('*')
    .limit(1)
    .single();
  if (error || !data) throw new Error('WhatsApp config not found in DB');
  return data;
}

// ─── HMAC-SHA256 signature verification ─────────────────────────────────────

async function verifySignature(body: string, signature: string, appSecret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256=${hex}` === signature;
}

// ─── Send WhatsApp message via Meta Cloud API ───────────────────────────────

async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('WhatsApp send error:', err);
  }
  return res;
}

// ─── Log message to DB ──────────────────────────────────────────────────────

async function logMessage(
  supabase: ReturnType<typeof getSupabase>,
  data: Record<string, unknown>
) {
  const { error } = await supabase.from('whatsapp_messages').insert(data);
  if (error) console.error('Error logging message:', error);
}

// ─── Claude AI System Prompt ────────────────────────────────────────────────

const SYSTEM_PROMPT = `Sos un asistente IA integrado al sistema de gestión regulatoria SGRT2 vía WhatsApp.
Tu trabajo es interpretar mensajes de texto del usuario y devolver SIEMPRE un JSON válido con la acción a ejecutar.

IMPORTANTE: Tu respuesta DEBE ser ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin markdown, sin backticks.

Estructura de respuesta:
{
  "action": "create_client|add_product|add_seguimiento|query_client|query_tramite|list_tramites|help|unknown|confirm_yes|confirm_no",
  "data": {},
  "requires_confirmation": true/false,
  "confirmation_message": "mensaje para pedir confirmación al usuario",
  "response_message": "mensaje de respuesta para el usuario"
}

ACCIONES DISPONIBLES:

1. create_client - Crear un nuevo cliente
   data: { "razon_social": "...", "cuit": "...", "email": "...", "telefono": "...", "contacto_nombre": "..." }
   requires_confirmation: true (SIEMPRE pedir confirmación para creación)

2. add_product - Agregar producto a un cliente
   data: { "cliente_nombre": "...", "nombre": "...", "marca": "...", "rubro": "...", "pais_origen": "..." }
   requires_confirmation: true

3. add_seguimiento - Agregar seguimiento a un trámite
   data: { "buscar_por": "expediente|titulo|cliente", "buscar_valor": "...", "descripcion": "...", "tipo": "nota|llamada|email|reunion" }
   requires_confirmation: true

4. query_client - Buscar clientes
   data: { "buscar": "texto de búsqueda" }
   requires_confirmation: false

5. query_tramite - Buscar trámites
   data: { "buscar": "texto de búsqueda", "buscar_por": "titulo|expediente|cliente" }
   requires_confirmation: false

6. list_tramites - Listar trámites activos
   data: { "estado": "en_curso|esperando_cliente|todos" }
   requires_confirmation: false

7. help - Mostrar ayuda
   data: {}
   requires_confirmation: false
   response_message: lista de comandos disponibles

8. unknown - No se entiende el mensaje
   data: {}
   requires_confirmation: false
   response_message: mensaje amigable pidiendo clarificación

REGLAS:
- Si el usuario dice "sí", "si", "dale", "confirmar", "ok", "correcto" → action: "confirm_yes"
- Si el usuario dice "no", "cancelar", "anular" → action: "confirm_no"
- Para crear cliente, extrae todos los datos posibles del mensaje. Los campos que no se mencionen, déjalos como null.
- El CUIT debe estar en formato XX-XXXXXXXX-X si se proporciona.
- Para búsquedas, sé flexible con el texto de búsqueda.
- SIEMPRE respondé en español argentino, tono profesional pero amigable.
- Cuando la acción requiere confirmación, el confirmation_message debe resumir la operación de forma clara.`;

// ─── Call Claude API ────────────────────────────────────────────────────────

async function callClaude(
  apiKey: string,
  userMessage: string,
  context: string
): Promise<{ action: string; data: Record<string, unknown>; requires_confirmation: boolean; confirmation_message: string; response_message: string }> {
  const messages = [];

  if (context) {
    messages.push({ role: 'user', content: context });
    messages.push({ role: 'assistant', content: 'Entendido, tengo el contexto.' });
  }

  messages.push({ role: 'user', content: userMessage });

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      system: SYSTEM_PROMPT,
      messages,
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error (${res.status}): ${err}`);
  }

  const result = await res.json();
  const text = result.content?.[0]?.text || '{}';

  try {
    return JSON.parse(text);
  } catch {
    return {
      action: 'unknown',
      data: {},
      requires_confirmation: false,
      confirmation_message: '',
      response_message: 'Disculpá, no pude procesar tu mensaje. Probá con "ayuda" para ver los comandos disponibles.',
    };
  }
}

// ─── Execute DB actions ─────────────────────────────────────────────────────

async function executeAction(
  supabase: ReturnType<typeof getSupabase>,
  action: string,
  data: Record<string, unknown>
): Promise<string> {
  switch (action) {
    case 'create_client': {
      const insertData: Record<string, unknown> = { razon_social: data.razon_social };
      if (data.cuit) insertData.cuit = data.cuit;
      if (data.email) insertData.email = data.email;
      if (data.telefono) insertData.telefono = data.telefono;
      if (data.contacto_nombre) insertData.contacto_nombre = data.contacto_nombre;

      const { data: client, error } = await supabase
        .from('clientes')
        .insert(insertData)
        .select()
        .single();

      if (error) return `Error al crear cliente: ${error.message}`;
      return `Cliente "${client.razon_social}" creado exitosamente (ID: ${client.id.slice(0, 8)}).`;
    }

    case 'add_product': {
      // Find client by name
      const { data: clients, error: searchErr } = await supabase
        .from('clientes')
        .select('id, razon_social')
        .ilike('razon_social', `%${data.cliente_nombre}%`)
        .is('deleted_at', null)
        .limit(1);

      if (searchErr || !clients?.length) {
        return `No encontré un cliente con nombre "${data.cliente_nombre}".`;
      }

      const cliente = clients[0];
      const productData: Record<string, unknown> = {
        cliente_id: cliente.id,
        nombre: data.nombre,
      };
      if (data.marca) productData.marca = data.marca;
      if (data.rubro) productData.rubro = data.rubro;
      if (data.pais_origen) productData.pais_origen = data.pais_origen;

      const { data: product, error } = await supabase
        .from('productos')
        .insert(productData)
        .select()
        .single();

      if (error) return `Error al agregar producto: ${error.message}`;
      return `Producto "${product.nombre}" agregado al cliente "${cliente.razon_social}".`;
    }

    case 'add_seguimiento': {
      let tramiteId: string | null = null;
      const buscarPor = data.buscar_por as string;
      const buscarValor = data.buscar_valor as string;

      if (buscarPor === 'expediente') {
        const { data: tramites } = await supabase
          .from('tramites')
          .select('id, titulo')
          .ilike('numero_expediente', `%${buscarValor}%`)
          .is('deleted_at', null)
          .limit(1);
        if (tramites?.length) tramiteId = tramites[0].id;
      } else if (buscarPor === 'titulo') {
        const { data: tramites } = await supabase
          .from('tramites')
          .select('id, titulo')
          .ilike('titulo', `%${buscarValor}%`)
          .is('deleted_at', null)
          .limit(1);
        if (tramites?.length) tramiteId = tramites[0].id;
      } else if (buscarPor === 'cliente') {
        const { data: tramites } = await supabase
          .from('tramites')
          .select('id, titulo, clientes!inner(razon_social)')
          .ilike('clientes.razon_social', `%${buscarValor}%`)
          .is('deleted_at', null)
          .limit(1);
        if (tramites?.length) tramiteId = tramites[0].id;
      }

      if (!tramiteId) {
        return `No encontré un trámite que coincida con "${buscarValor}".`;
      }

      const { error } = await supabase.from('seguimientos').insert({
        tramite_id: tramiteId,
        descripcion: data.descripcion,
        tipo: data.tipo || 'nota',
        usuario_nombre: 'WhatsApp Bot',
      });

      if (error) return `Error al agregar seguimiento: ${error.message}`;
      return `Seguimiento agregado exitosamente al trámite.`;
    }

    case 'query_client': {
      const { data: clients, error } = await supabase
        .from('clientes')
        .select('razon_social, cuit, email, telefono, contacto_nombre')
        .ilike('razon_social', `%${data.buscar}%`)
        .is('deleted_at', null)
        .limit(5);

      if (error) return `Error en la búsqueda: ${error.message}`;
      if (!clients?.length) return `No encontré clientes con "${data.buscar}".`;

      const lines = clients.map(
        (c: Record<string, unknown>) =>
          `- *${c.razon_social}*${c.cuit ? ` (CUIT: ${c.cuit})` : ''}${c.email ? ` | ${c.email}` : ''}${c.telefono ? ` | Tel: ${c.telefono}` : ''}`
      );
      return `Encontré ${clients.length} cliente(s):\n${lines.join('\n')}`;
    }

    case 'query_tramite': {
      const buscarPor = (data.buscar_por as string) || 'titulo';
      const buscar = data.buscar as string;
      let query = supabase
        .from('tramites')
        .select('titulo, estado, numero_expediente, prioridad')
        .is('deleted_at', null)
        .limit(5);

      if (buscarPor === 'expediente') {
        query = query.ilike('numero_expediente', `%${buscar}%`);
      } else {
        query = query.ilike('titulo', `%${buscar}%`);
      }

      const { data: tramites, error } = await query;
      if (error) return `Error en la búsqueda: ${error.message}`;
      if (!tramites?.length) return `No encontré trámites con "${buscar}".`;

      const lines = tramites.map(
        (t: Record<string, unknown>) =>
          `- *${t.titulo}* | Estado: ${t.estado}${t.numero_expediente ? ` | Exp: ${t.numero_expediente}` : ''} | Prior: ${t.prioridad}`
      );
      return `Encontré ${tramites.length} trámite(s):\n${lines.join('\n')}`;
    }

    case 'list_tramites': {
      const estados =
        data.estado === 'todos'
          ? ['en_curso', 'esperando_cliente', 'pendiente', 'en_revision']
          : [data.estado || 'en_curso'];

      const { data: tramites, error } = await supabase
        .from('tramites')
        .select('titulo, estado, numero_expediente, prioridad')
        .in('estado', estados)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) return `Error al listar: ${error.message}`;
      if (!tramites?.length) return 'No hay trámites activos en este momento.';

      const lines = tramites.map(
        (t: Record<string, unknown>) =>
          `- *${t.titulo}* | ${t.estado}${t.numero_expediente ? ` | Exp: ${t.numero_expediente}` : ''}`
      );
      return `Trámites activos (${tramites.length}):\n${lines.join('\n')}`;
    }

    case 'help':
      return `*Comandos disponibles:*

- *Buscar cliente [nombre]* → Busca clientes por nombre
- *Buscar trámite [texto]* → Busca trámites por título o expediente
- *Listar trámites* → Muestra trámites activos
- *Crear cliente [datos]* → Crea un nuevo cliente (nombre, CUIT, email, tel)
- *Agregar producto [datos]* → Agrega producto a un cliente
- *Agregar seguimiento [datos]* → Agrega nota a un trámite
- *Ayuda* → Este mensaje

Ejemplo: "Crear cliente Laboratorios Test, CUIT 30-71234567-0, email test@lab.com"`;

    default:
      return (data as Record<string, unknown>).response_message as string ||
        'No entendí tu mensaje. Escribí "ayuda" para ver los comandos disponibles.';
  }
}

// ─── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const supabase = getSupabase();

  // ── GET: Webhook verification (Meta challenge) ──
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token && challenge) {
      try {
        const config = await loadConfig(supabase);
        if (token === config.verify_token) {
          return new Response(challenge, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      } catch (e) {
        console.error('Config load error:', e);
      }
    }

    return new Response('Forbidden', { status: 403 });
  }

  // ── POST: Incoming messages ──
  if (req.method === 'POST') {
    // Always return 200 to Meta (they retry on non-200)
    try {
      const bodyText = await req.text();
      const config = await loadConfig(supabase);

      if (!config.bot_enabled) {
        return new Response('OK', { status: 200 });
      }

      // Verify HMAC signature
      const signature = req.headers.get('x-hub-signature-256') || '';
      if (config.app_secret && signature) {
        const valid = await verifySignature(bodyText, signature, config.app_secret);
        if (!valid) {
          console.error('Invalid webhook signature');
          return new Response('OK', { status: 200 });
        }
      }

      const body = JSON.parse(bodyText);

      // Extract message from Meta webhook payload
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (!message || message.type !== 'text') {
        return new Response('OK', { status: 200 });
      }

      const from = message.from; // sender phone number
      const waMessageId = message.id;
      const messageText = message.text?.body || '';

      // Check if number is authorized
      const { data: authNumber } = await supabase
        .from('whatsapp_authorized_numbers')
        .select('*')
        .eq('phone_number', from)
        .eq('is_active', true)
        .single();

      if (!authNumber) {
        // Not authorized - log and ignore
        await logMessage(supabase, {
          wa_message_id: waMessageId,
          phone_number: from,
          direction: 'inbound',
          message_text: messageText,
          status: 'rejected',
          error_message: 'Número no autorizado',
        });
        return new Response('OK', { status: 200 });
      }

      // Log inbound message
      await logMessage(supabase, {
        wa_message_id: waMessageId,
        phone_number: from,
        direction: 'inbound',
        message_text: messageText,
        status: 'processing',
      });

      // Check for pending action (confirmation flow)
      const { data: pendingMsg } = await supabase
        .from('whatsapp_messages')
        .select('pending_action')
        .eq('phone_number', from)
        .not('pending_action', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let context = '';
      if (pendingMsg?.pending_action) {
        context = `El usuario tiene una acción pendiente de confirmación: ${JSON.stringify(pendingMsg.pending_action)}. Si el usuario confirma (sí/ok/dale/correcto), responde con action "confirm_yes". Si cancela (no/cancelar), responde con action "confirm_no". Si dice otra cosa, procesa como nuevo mensaje.`;
      }

      // Call Claude AI
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!anthropicKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }

      const aiResult = await callClaude(anthropicKey, messageText, context);
      let responseText: string;

      if (aiResult.action === 'confirm_yes' && pendingMsg?.pending_action) {
        // Execute the pending action
        const pending = pendingMsg.pending_action as { action: string; data: Record<string, unknown> };
        responseText = await executeAction(supabase, pending.action, pending.data);

        // Clear pending action
        await supabase
          .from('whatsapp_messages')
          .update({ pending_action: null })
          .eq('phone_number', from)
          .not('pending_action', 'is', null);
      } else if (aiResult.action === 'confirm_no' && pendingMsg?.pending_action) {
        responseText = 'Operación cancelada.';
        await supabase
          .from('whatsapp_messages')
          .update({ pending_action: null })
          .eq('phone_number', from)
          .not('pending_action', 'is', null);
      } else if (aiResult.requires_confirmation) {
        // Save pending action and ask for confirmation
        responseText = aiResult.confirmation_message || 'Confirmar operación?';
        await logMessage(supabase, {
          phone_number: from,
          direction: 'outbound',
          message_text: responseText,
          ai_action: aiResult,
          pending_action: { action: aiResult.action, data: aiResult.data },
          status: 'pending_confirmation',
        });
      } else if (['query_client', 'query_tramite', 'list_tramites', 'help'].includes(aiResult.action)) {
        responseText = await executeAction(supabase, aiResult.action, aiResult.data);
      } else if (aiResult.action === 'unknown') {
        responseText = aiResult.response_message || 'No entendí tu mensaje. Escribí "ayuda" para ver los comandos.';
      } else {
        responseText = aiResult.response_message || 'Comando no reconocido.';
      }

      // Send response via WhatsApp
      await sendWhatsAppMessage(config.phone_number_id, config.access_token, from, responseText);

      // Log outbound message
      await logMessage(supabase, {
        phone_number: from,
        direction: 'outbound',
        message_text: responseText,
        ai_action: aiResult,
        status: 'sent',
      });

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Webhook error:', error);
      // Always return 200 to Meta
      return new Response('OK', { status: 200 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
