import type { APIRoute } from 'astro';
import { getPortalAccessSession } from '@/lib/auth/portalAccess';
import { getPlatformInspectSession } from '@/lib/auth/platformInspect';
import { getSessionUser } from '@/lib/auth';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { logPortalAccessAudit } from '@/lib/services/portalAccess';
import { logPlatformInspectEvent } from '@/lib/services/platformInspect';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { portalAccessAuditSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const pdp = getPortalAccessSession(cookies);
  const inspect = getPlatformInspectSession(cookies);
  const user = getSessionUser(cookies);

  if (!pdp && !(user?.role === 'super_admin' && inspect?.mode === 'patient_portal')) {
    return fail('No hay acceso autorizado al portal del paciente.', 401);
  }

  try {
    const body = await request.json();
    const parsed = portalAccessAuditSchema.safeParse(body);
    if (!parsed.success) return fail('Evento inválido.', 422, parsed.error.flatten());

    const accessRole = inspect?.accessRole ?? user?.staffRole ?? user?.role ?? 'staff';
    const actorEmail = inspect?.superAdminEmail ?? user?.email;

    if (pdp) {
      await logPortalAccessAudit({
        tokenId: pdp.tokenId,
        clinicId: pdp.clinicId,
        tenantId: pdp.tenantId,
        staffProfileId: pdp.staffProfileId,
        patientId: pdp.patientId,
        eventType: parsed.data.eventType,
        pagePath: parsed.data.pagePath,
        resourceLabel: parsed.data.resourceLabel,
        resourceId: parsed.data.resourceId,
        accessRole: String(accessRole),
        actorEmail
      });
    }

    if (inspect && user?.role === 'super_admin') {
      await logPlatformInspectEvent({
        actorEmail: inspect.superAdminEmail,
        actorName: inspect.superAdminName,
        accessRole: inspect.accessRole,
        inspectMode: 'patient_portal',
        clinicId: inspect.clinicId,
        tenantId: inspect.tenantId,
        patientId: inspect.patientId ?? pdp?.patientId,
        eventType: parsed.data.eventType,
        pagePath: parsed.data.pagePath,
        resourceLabel: parsed.data.resourceLabel,
        resourceId: parsed.data.resourceId
      });
    }

    return ok({ logged: true });
  } catch (error) {
    logError('portal-access.audit', error);
    return fail('No se pudo registrar la actividad.', 500);
  }
};
