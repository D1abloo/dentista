import type { APIRoute } from 'astro';
import { requireStaffSession, resolveStaffClinicId } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { listAuditEvents } from '@/lib/audit/listEvents';
import { auditActionSchema } from '@/lib/validators';
import { markAuditReviewed } from '@/lib/audit/listEvents';
import { logEvent } from '@/lib/audit/logEvent';
import { clientIp } from '@/lib/audit/sanitize';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;

  try {
    const url = new URL(context.request.url);
    const clinicId = resolveStaffClinicId(gate.user, url.searchParams.get('clinicId') ?? undefined);
    if (!clinicId) return fail('Clínica no definida en sesión.', 403);

    const search = url.searchParams.get('q') ?? undefined;
    const data = await listAuditEvents({
      clinic_id: clinicId,
      search,
      limit: 120
    });

    return ok({
      ...data,
      scope: { clinic_id: clinicId }
    });
  } catch (error) {
    logError('admin.activity.list', error);
    return fail('No se pudo cargar la actividad de la clínica.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = auditActionSchema.safeParse(body);
    if (!parsed.success) return fail('Acción inválida.', 422);

    if (parsed.data.action === 'mark_reviewed') {
      const okReview = await markAuditReviewed(parsed.data.id);
      if (!okReview) return fail('No se pudo marcar el evento.', 422);
      await logEvent({
        event_type: 'audit.mark_reviewed',
        module: 'config',
        action: 'Marcar evento revisado',
        user_email: gate.user.email,
        clinic_id: gate.user.clinicId,
        resource_id: parsed.data.id,
        route: '/admin/monitorizacion',
        ip_address: clientIp(context.request)
      });
      const data = await listAuditEvents({ clinic_id: gate.user.clinicId ?? undefined, limit: 120 });
      return ok(data, { message: 'Evento marcado como revisado.' });
    }

    if (parsed.data.action === 'log_export') {
      await logEvent({
        event_type: 'audit.exported',
        module: 'config',
        action: 'Exportar actividad clínica',
        user_email: gate.user.email,
        clinic_id: gate.user.clinicId,
        metadata: { format: parsed.data.format ?? 'csv' },
        route: '/admin/monitorizacion',
        ip_address: clientIp(context.request)
      });
      return ok({ exported: true }, { message: 'Exportación registrada.' });
    }

    return fail('Acción no permitida.', 400);
  } catch (error) {
    logError('admin.activity.post', error);
    return fail('No se pudo procesar la acción.', 500);
  }
};
