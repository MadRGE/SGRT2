import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no configurada');
    }

    const { record, type } = await req.json();

    // Solo enviar para usuarios con rol 'cliente'
    if (!record || record.rol !== 'cliente') {
      return new Response(
        JSON.stringify({ success: true, message: 'No es usuario cliente, email no enviado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, nombre, cliente_id } = record;

    // Obtener nombre de la empresa si tiene cliente_id
    let empresaNombre = '';
    if (cliente_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data } = await supabase
        .from('clientes')
        .select('razon_social')
        .eq('id', cliente_id)
        .single();
      if (data) empresaNombre = data.razon_social;
    }

    const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'SGT <onboarding@resend.dev>';
    const APP_URL = Deno.env.get('APP_URL') || 'https://sgrt-2.vercel.app';

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">

    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">Sistema de Gesti&oacute;n de Tr&aacute;mites</h1>
      <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">Portal del Cliente</p>
    </div>

    <div style="padding:32px;">
      <h2 style="color:#1e293b;margin:0 0 16px;">Bienvenido/a, ${nombre || 'Cliente'}!</h2>

      <p style="color:#475569;line-height:1.6;margin:0 0 16px;">
        Le informamos que se ha creado su cuenta de acceso al <strong>Portal del Cliente</strong>
        ${empresaNombre ? ` para la empresa <strong>${empresaNombre}</strong>` : ''}.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="color:#334155;margin:0 0 12px;font-weight:600;">Sus datos de acceso:</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#64748b;width:80px;">Portal:</td>
            <td style="padding:6px 0;"><a href="${APP_URL}" style="color:#2563eb;text-decoration:none;">${APP_URL}</a></td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;">Email:</td>
            <td style="padding:6px 0;color:#1e293b;font-weight:500;">${email}</td>
          </tr>
        </table>
      </div>

      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;border-radius:0 8px 8px 0;margin:24px 0;">
        <p style="color:#1e40af;margin:0 0 8px;font-weight:600;">Pasos para ingresar:</p>
        <ol style="color:#1e40af;margin:0;padding-left:20px;line-height:1.8;">
          <li>Revise su bandeja de entrada y haga click en el enlace de <strong>confirmaci&oacute;n de email</strong></li>
          <li>Ingrese al portal con su email y la contrase&ntilde;a proporcionada</li>
          <li>Le recomendamos cambiar su contrase&ntilde;a en el primer ingreso</li>
        </ol>
      </div>

      <p style="color:#475569;line-height:1.6;margin:24px 0 0;">
        Desde el portal podr&aacute; consultar el estado de sus tr&aacute;mites, visualizar documentaci&oacute;n
        y mantenerse informado sobre el avance de sus proyectos.
      </p>

      <div style="text-align:center;margin:32px 0 0;">
        <a href="${APP_URL}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:16px;">
          Ir al Portal
        </a>
      </div>
    </div>

    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;margin:0;font-size:12px;">
        Este email fue enviado autom&aacute;ticamente. Ante cualquier duda, contacte a su gestor asignado.
      </p>
    </div>
  </div>
</body>
</html>`;

    // Enviar email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: [email],
        subject: `Bienvenido/a al Portal de Gestión de Trámites${empresaNombre ? ` - ${empresaNombre}` : ''}`,
        html: htmlContent,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(`Resend error: ${JSON.stringify(resendData)}`);
    }

    console.log(`Welcome email sent to ${email}, Resend ID: ${resendData.id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Email de bienvenida enviado', id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
