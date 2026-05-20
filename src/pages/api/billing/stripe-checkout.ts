import type { APIRoute } from 'astro';
import { assertClinicScope, requireSession } from '@/lib/api/guards';
import { created, fail } from '@/lib/http';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { stripeCheckoutSchema } from '@/lib/validators';

export const prerender = false;

function env(name: string) {
  const value = (import.meta.env as Record<string, string | undefined>)[name];
  return String(value ?? '').trim();
}

export const POST: APIRoute = async (context) => {
  try {
    const gate = requireSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = stripeCheckoutSchema.safeParse(payload);
    if (!parsed.success) return fail('Checkout inválido.', 422, parsed.error.flatten());
    const scopeErr = assertClinicScope(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;

    const amountCents = Math.round(parsed.data.amount * 100);
    const secret = env('STRIPE_SECRET_KEY');
    const appUrl = env('PUBLIC_APP_URL') || new URL(context.request.url).origin;
    const successUrl = parsed.data.successUrl ?? `${appUrl}/paciente/facturas?checkout=ok`;
    const cancelUrl = parsed.data.cancelUrl ?? `${appUrl}/paciente/facturas?checkout=cancel`;

    const db = getSupabaseAdmin();
    const { data: sessionRow, error: rowErr } = await db
      .from('stripe_checkout_sessions')
      .insert({
        clinic_id: parsed.data.clinicId,
        patient_id: parsed.data.patientId,
        invoice_id: parsed.data.invoiceId ?? null,
        amount_cents: amountCents,
        currency: 'eur',
        status: 'created',
        metadata: { concept: parsed.data.concept }
      })
      .select('*')
      .single();
    if (rowErr) throw rowErr;

    if (!secret) {
      return created(
        { provider: 'mock', mode: 'mock', sessionId: sessionRow.id, checkoutUrl: `${appUrl}/paciente/facturas?mock=1` },
        { message: 'STRIPE_SECRET_KEY ausente: checkout mock.' }
      );
    }

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', successUrl);
    body.set('cancel_url', cancelUrl);
    body.set('line_items[0][price_data][currency]', 'eur');
    body.set('line_items[0][price_data][unit_amount]', String(amountCents));
    body.set('line_items[0][price_data][product_data][name]', parsed.data.concept);
    body.set('line_items[0][quantity]', '1');
    body.set('metadata[clinic_id]', parsed.data.clinicId);
    body.set('metadata[patient_id]', parsed.data.patientId);
    body.set('metadata[local_session_id]', sessionRow.id);
    if (parsed.data.invoiceId) body.set('metadata[invoice_id]', parsed.data.invoiceId);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });
    const stripeJson = (await stripeRes.json().catch(() => ({}))) as { id?: string; url?: string; error?: { message?: string } };
    if (!stripeRes.ok || !stripeJson.id || !stripeJson.url) {
      await db
        .from('stripe_checkout_sessions')
        .update({ status: 'failed', metadata: { ...sessionRow.metadata, stripe_error: stripeJson.error?.message ?? 'Stripe error' } })
        .eq('id', sessionRow.id);
      return fail('Stripe rechazó el checkout.', 502, stripeJson.error?.message ?? stripeJson);
    }

    await db
      .from('stripe_checkout_sessions')
      .update({ stripe_session_id: stripeJson.id, stripe_url: stripeJson.url, updated_at: new Date().toISOString() })
      .eq('id', sessionRow.id);

    return created(
      { provider: 'stripe', mode: 'live', sessionId: sessionRow.id, checkoutUrl: stripeJson.url, stripeSessionId: stripeJson.id },
      { message: 'Checkout Stripe creado.' }
    );
  } catch (error) {
    return fail('No se pudo crear el checkout.', 500, error instanceof Error ? error.message : error);
  }
};
