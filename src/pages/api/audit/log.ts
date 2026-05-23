import type { APIRoute } from 'astro';
import { getSessionUser } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { logEvent } from '@/lib/audit/logEvent';
import { clientIp } from '@/lib/audit/sanitize';
import { clientAuditLogSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const user = getSessionUser(context.cookies);
    const body = await context.request.json();
    const parsed = clientAuditLogSchema.safeParse(body);
    if (!parsed.success) return fail('Evento inválido.', 422);

    const ip = clientIp(context.request);
    const ua = context.request.headers.get('user-agent');

    await logEvent({
      ...parsed.data,
      user_id: user?.profileId ?? null,
      user_email: user?.email ?? null,
      user_role: user?.staffRole ?? user?.role ?? null,
      tenant_id: user?.tenantId ?? null,
      clinic_id: user?.clinicId ?? null,
      patient_id: user?.patientId ?? null,
      ip_address: ip,
      user_agent: ua,
      metadata: parsed.data.metadata
    });

    return ok({ logged: true });
  } catch (error) {
    logError('audit.log.api', error);
    return fail('No se pudo registrar el evento.', 500);
  }
};
