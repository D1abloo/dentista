import type { APIRoute } from 'astro';
import { getPortalAccessSession } from '@/lib/auth/portalAccess';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { logPortalAccessAudit } from '@/lib/services/portalAccess';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { portalAccessAuditSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const pdp = getPortalAccessSession(cookies);
  if (!pdp) return fail('No hay acceso autorizado al portal del paciente.', 401);

  try {
    const body = await request.json();
    const parsed = portalAccessAuditSchema.safeParse(body);
    if (!parsed.success) return fail('Evento inválido.', 422, parsed.error.flatten());

    await logPortalAccessAudit({
      tokenId: pdp.tokenId,
      clinicId: pdp.clinicId,
      tenantId: pdp.tenantId,
      staffProfileId: pdp.staffProfileId,
      patientId: pdp.patientId,
      eventType: parsed.data.eventType,
      pagePath: parsed.data.pagePath,
      resourceLabel: parsed.data.resourceLabel,
      resourceId: parsed.data.resourceId
    });

    return ok({ logged: true });
  } catch (error) {
    logError('portal-access.audit', error);
    return fail('No se pudo registrar la actividad.', 500);
  }
};
