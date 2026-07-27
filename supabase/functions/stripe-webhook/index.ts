// Supabase Edge Function: stripe-webhook
// Handles billing webhooks for SaaS subscriptions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const event = await req.json();

    console.log(`[Stripe Webhook] Received Event: ${event.type}`);

    switch (event.type) {
      case 'invoice.payment_succeeded':
        console.log('[Stripe Webhook] Subscription invoice payment succeeded');
        break;
      case 'customer.subscription.deleted':
        console.log('[Stripe Webhook] Subscription canceled');
        break;
      default:
        console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
