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
    const { action, cotizacionId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let result;

    switch (action) {
      case 'soft-delete': {
        const { error } = await supabase
          .from('cotizaciones')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', cotizacionId);
        if (error) throw error;
        result = { success: true, message: 'Cotización eliminada' };
        break;
      }

      case 'restore': {
        const { error } = await supabase
          .from('cotizaciones')
          .update({ deleted_at: null })
          .eq('id', cotizacionId);
        if (error) throw error;
        result = { success: true, message: 'Cotización restaurada' };
        break;
      }

      case 'hard-delete': {
        const { error } = await supabase
          .from('cotizaciones')
          .delete()
          .eq('id', cotizacionId);
        if (error) throw error;
        result = { success: true, message: 'Cotización eliminada permanentemente' };
        break;
      }

      case 'list-deleted': {
        const { data, error } = await supabase
          .from('cotizaciones')
          .select('id, numero_cotizacion, nombre_cliente, deleted_at')
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false });
        if (error) throw error;
        result = { success: true, data };
        break;
      }

      default:
        throw new Error(`Acción no reconocida: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('cotizacion-actions error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
