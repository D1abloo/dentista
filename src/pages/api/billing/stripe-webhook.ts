import type { APIRoute } from 'astro';
import { created, fail, ok } from '@/lib/http';
import { completeStripeCheckout } from '@/lib/services/billing';
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer';

export const prerender = false;

function env(name: string) {
  return String((import.meta.env as Record<string, string | undefined>)[name] ?? '').trim();
}

export const POST: APIRoute = async ({ request }) => {
  if (isDemoMode() || !hasSupabaseConfig()) {
    return fail('Webhook Stripe solo en modo producción con Supabase.', 503);
  }

  try {
    const rawBody = await request.text();
    const webhookSecret = env('STRIPE_WEBHOOK_SECRET');
    const signature = request.headers.get('stripe-signature');

    if (webhookSecret && !signature && import.meta.env.PROD) {
      return fail('Falta cabecera stripe-signature.', 400);
    }

    const event = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      data?: { object?: { id?: string; metadata?: Record<string, string> } };
    };

    if (event.type === 'checkout.session.completed') {
      const sessionId = event.data?.object?.id;
      if (!sessionId) return fail('Evento Stripe sin session id.', 422);

      const db = getSupabaseAdmin();
      if (event.id) {
        const { data: dup } = await db
          .from('stripe_checkout_sessions')
          .select('id')
          .eq('stripe_event_id', event.id)
          .maybeSingle();
        if (dup) return ok({ duplicate: true }, { message: 'Evento ya procesado.' });
      }

      const completed = await completeStripeCheckout(sessionId);
      if (event.id && completed) {
        await db.from('stripe_checkout_sessions').update({ stripe_event_id: event.id }).eq('id', completed.id);
      }

      return created({ sessionId, status: 'paid' }, { message: 'Pago Stripe confirmado.' });
    }

    return ok({ received: true, type: event.type ?? 'unknown' }, { message: 'Evento recibido.' });
  } catch (error) {
    return fail('Error procesando webhook Stripe.', 500, error instanceof Error ? error.message : error);
  }
};
