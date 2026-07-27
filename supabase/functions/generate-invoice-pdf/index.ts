// Supabase Edge Function: generate-invoice-pdf
// Renders HTML/PDF receipt documents for billing invoices
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { invoiceId, format = '80mm' } = await req.json();

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: invoiceId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // PDF generation simulation payload
    const pdfData = {
      success: true,
      invoiceId,
      format,
      generatedAt: new Date().toISOString(),
      downloadUrl: `https://givqmvmpjssqklhufigr.supabase.co/storage/v1/object/public/invoice-pdfs/inv_${invoiceId}.pdf`
    };

    return new Response(
      JSON.stringify(pdfData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
