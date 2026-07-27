// Supabase Edge Function: process-ai-assistant
// Handles natural language store intelligence queries & business analysis
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
    const { prompt, tenantId } = await req.json();

    if (!prompt || !tenantId) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt or tenantId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Simulated LLM Assistant Response
    const responseText = `[OmniPOS AI Assistant]: Analysis complete for store "${tenantId}". Based on your recent sales patterns, top revenue items are Beverages and Dairy. Reorder recommended for items with stock < 5 units.`;

    return new Response(
      JSON.stringify({
        answer: responseText,
        usage: { prompt_tokens: 45, completion_tokens: 32, total_tokens: 77 },
        model: 'deepseek-r1'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
