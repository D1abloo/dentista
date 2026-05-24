import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, requireStaffSession } from '@/lib/api/guards';
import { ok, fail } from '@/lib/http';
import { processNotificationQueue } from '@/lib/notifications/queue';
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer';
import { reminderSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const gate = await requireStaffSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = reminderSchema.safeParse(payload);
    if (!parsed.success) return fail('Payload de recordatorio inválido.', 422, parsed.error.flatten());
    const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;
    const providers = {
      whatsapp: import.meta.env.WHATSAPP_PROVIDER ?? 'mock',
      email: import.meta.env.EMAIL_PROVIDER ?? 'mock',
      sms: import.meta.env.SMS_PROVIDER ?? 'mock'
    };

    const jobId = `reminder-${Date.now()}`;
    if (!isDemoMode() && hasSupabaseConfig()) {
      const db = getSupabaseAdmin();
      const rows = parsed.data.appointmentIds.map((appointmentId) => ({
        clinic_id: parsed.data.clinicId,
        channel: parsed.data.channel,
        provider: providers[parsed.data.channel],
        payload: { appointmentId, template: parsed.data.template },
        status: 'queued'
      }));
      const { error } = await db.from('notification_jobs').insert(rows);
      if (error) throw error;
      void processNotificationQueue(Math.min(parsed.data.appointmentIds.length, 15)).catch(() => undefined);
    }

    return ok({
      provider: providers[parsed.data.channel],
      clinicId: parsed.data.clinicId,
      channel: parsed.data.channel,
      sent: parsed.data.appointmentIds.length,
      status: 'queued',
      jobId
    }, { message: 'Recordatorios encolados.' });
  } catch (error) {
    return fail('No se pudieron enviar recordatorios.', 500, error instanceof Error ? error.message : error);
  }
};
