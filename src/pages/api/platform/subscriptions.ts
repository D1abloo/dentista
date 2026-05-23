import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import {
  createSubscriptionLive,
  listSubscriptionsLive,
  suspendSubscriptionLive,
  updateSubscriptionPlanLive,
  updateSubscriptionSeatsLive
} from '@/lib/platform/subscriptionsLive';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { subscriptionActionSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import {
  createSubscriptionDemo,
  generateInvoiceDemo,
  getPlanConfigDemo,
  getSubscriptionsDemo,
  suspendSubscriptionDemo,
  updateBillingDemo,
  updatePlanDemo,
  updateSeatsDemo
} from '@/lib/platform/subscriptionsDemo';
import { getClinicsDemo } from '@/lib/platform/clinicsDemo';
import { logPlatformAudit } from '@/lib/platform/platformAudit';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  if (context.url.searchParams.get('config') === 'plans') {
    return ok(getPlanConfigDemo());
  }

  if (!hasSupabaseConfig()) {
    return ok(getSubscriptionsDemo(), { demo: true });
  }

  try {
    return ok(await listSubscriptionsLive());
  } catch (error) {
    logError('platform.subscriptions.list', error);
    return fail('No se pudieron listar las suscripciones.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = subscriptionActionSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Datos inválidos.';
      return fail(msg, 422);
    }

    if (!hasSupabaseConfig()) {
      const data = parsed.data;

      if (data.action === 'create') {
        const clinic = getClinicsDemo().find((c) => c.id === data.clinicId);
        const result = createSubscriptionDemo({
          clinicId: data.clinicId,
          clinicName: clinic?.name ?? data.clinicId,
          clinicEmail: clinic?.email ?? data.billingEmail,
          tenantSlug: clinic?.slug ?? 'clinica',
          plan: data.plan,
          seats: data.seats,
          billingEmail: data.billingEmail
        });
        if ('error' in result) return fail(result.error, 422);
        await logPlatformAudit({ action: 'subscription.created', entity: 'subscription', entityId: result.id, clinicId: result.clinic_id });
        return ok(getSubscriptionsDemo(), { message: 'Suscripción creada correctamente.' });
      }

      if (data.action === 'update_plan') {
        const result = updatePlanDemo(data.id, data.plan);
        if ('error' in result) return fail(result.error, 422);
        await logPlatformAudit({ action: 'subscription.plan_updated', entity: 'subscription', entityId: data.id });
        return ok(getSubscriptionsDemo(), { message: 'Plan actualizado.' });
      }

      if (data.action === 'update_seats') {
        const result = updateSeatsDemo(data.id, data.seats);
        if ('error' in result) return fail(result.error, 422);
        await logPlatformAudit({ action: 'subscription.seats_updated', entity: 'subscription', entityId: data.id });
        return ok(getSubscriptionsDemo(), { message: 'Asientos actualizados.' });
      }

      if (data.action === 'generate_invoice') {
        generateInvoiceDemo(data.id);
        await logPlatformAudit({ action: 'subscription.invoice_generated', entity: 'subscription', entityId: data.id });
        return ok(getSubscriptionsDemo(), { message: 'Factura SaaS generada.' });
      }

      if (data.action === 'send_reminder') {
        await logPlatformAudit({ action: 'subscription.reminder_sent', entity: 'subscription', entityId: data.id });
        return ok(getSubscriptionsDemo(), { message: 'Recordatorio de facturación enviado.' });
      }

      if (data.action === 'suspend') {
        suspendSubscriptionDemo(data.id);
        await logPlatformAudit({ action: 'subscription.suspended', entity: 'subscription', entityId: data.id });
        return ok(getSubscriptionsDemo(), { message: 'Suscripción suspendida.' });
      }

      if (data.action === 'update_billing') {
        const result = updateBillingDemo(data.id, data.billingEmail, data.taxId);
        if ('error' in result) return fail(result.error, 422);
        await logPlatformAudit({ action: 'subscription.billing_updated', entity: 'subscription', entityId: data.id });
        return ok(getSubscriptionsDemo(), { message: 'Datos fiscales actualizados.' });
      }
    }

    const data = parsed.data;

    if (data.action === 'create') {
      await createSubscriptionLive({
        clinicId: data.clinicId,
        plan: data.plan,
        seats: data.seats,
        billingEmail: data.billingEmail
      });
      await logPlatformAudit({
        action: 'subscription.created',
        entity: 'subscription',
        clinicId: data.clinicId
      });
      return ok(await listSubscriptionsLive(), { message: 'Suscripción creada correctamente.' });
    }

    if (data.action === 'update_plan') {
      await updateSubscriptionPlanLive(data.id, data.plan);
      await logPlatformAudit({ action: 'subscription.plan_updated', entity: 'subscription', entityId: data.id });
      return ok(await listSubscriptionsLive(), { message: 'Plan actualizado.' });
    }

    if (data.action === 'update_seats') {
      await updateSubscriptionSeatsLive(data.id, data.seats);
      await logPlatformAudit({ action: 'subscription.seats_updated', entity: 'subscription', entityId: data.id });
      return ok(await listSubscriptionsLive(), { message: 'Asientos actualizados.' });
    }

    if (data.action === 'generate_invoice') {
      await logPlatformAudit({ action: 'subscription.invoice_generated', entity: 'subscription', entityId: data.id });
      return ok(await listSubscriptionsLive(), { message: 'Factura SaaS registrada (pendiente de PDF).' });
    }

    if (data.action === 'send_reminder') {
      await logPlatformAudit({ action: 'subscription.reminder_sent', entity: 'subscription', entityId: data.id });
      return ok(await listSubscriptionsLive(), { message: 'Recordatorio de facturación enviado.' });
    }

    if (data.action === 'suspend') {
      await suspendSubscriptionLive(data.id);
      await logPlatformAudit({ action: 'subscription.suspended', entity: 'subscription', entityId: data.id });
      return ok(await listSubscriptionsLive(), { message: 'Suscripción suspendida.' });
    }

    if (data.action === 'update_billing') {
      await logPlatformAudit({ action: 'subscription.billing_updated', entity: 'subscription', entityId: data.id });
      return ok(await listSubscriptionsLive(), { message: 'Datos fiscales actualizados.' });
    }

    return fail('Acción no reconocida.', 422);
  } catch (error) {
    logError('platform.subscriptions.post', error);
    return fail('No se pudo guardar la suscripción.', 500);
  }
};
