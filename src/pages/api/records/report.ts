import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, requireStaffSession } from '@/lib/api/guards';
import { logEvent } from '@/lib/audit/logEvent';
import { clientIp } from '@/lib/audit/sanitize';
import { logSecurityDenial } from '@/lib/audit/securityLog';
import { created, fail, ok } from '@/lib/http';
import {
  createClinicalReportRecord,
  toggleClinicalReportVisibility,
  updateClinicalReportRecord
} from '@/lib/services/records';
import { reportCreateSchema, reportUpdateSchema, reportVisibilitySchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const gate = await requireStaffSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = reportCreateSchema.safeParse(payload);
    if (!parsed.success) return fail('Informe inválido.', 422, parsed.error.flatten());
    const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scopeErr) {
      await logSecurityDenial({
        user: gate.user,
        reason: 'Sin permiso para clínica al crear informe',
        clinicId: parsed.data.clinicId,
        route: '/api/records/report',
        ip: clientIp(context.request),
        userAgent: context.request.headers.get('user-agent')
      });
      return scopeErr;
    }
    const data = await createClinicalReportRecord(parsed.data);
    await logEvent({
      event_type: 'report.created',
      module: 'reports',
      action: 'Crear informe',
      user_email: gate.user.email,
      clinic_id: parsed.data.clinicId,
      patient_id: parsed.data.patientId,
      resource_type: 'report',
      resource_id: data?.id,
      route: '/admin/informes',
      ip_address: clientIp(context.request)
    });
    return created(data, { message: 'Informe persistido en Supabase.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar el informe.';
    return fail(message, 500, error instanceof Error ? error.message : error);
  }
};

export const PUT: APIRoute = async (context) => {
  try {
    const gate = await requireStaffSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = reportUpdateSchema.safeParse(payload);
    if (!parsed.success) return fail('Informe inválido.', 422, parsed.error.flatten());
    const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;
    const data = await updateClinicalReportRecord(parsed.data);
    return ok(data, { message: 'Informe actualizado.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar el informe.';
    return fail(message, 500, error instanceof Error ? error.message : error);
  }
};

export const PATCH: APIRoute = async (context) => {
  try {
    const gate = await requireStaffSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = reportVisibilitySchema.safeParse(payload);
    if (!parsed.success) return fail('Payload inválido.', 422, parsed.error.flatten());
    const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;
    const data = await toggleClinicalReportVisibility(
      parsed.data.clinicId,
      parsed.data.id,
      parsed.data.visibleToPatient
    );
    if (parsed.data.visibleToPatient) {
      await logEvent({
        event_type: 'report.published_to_patient',
        module: 'reports',
        action: 'Publicar informe al PdP',
        user_email: gate.user.email,
        clinic_id: parsed.data.clinicId,
        resource_type: 'report',
        resource_id: parsed.data.id,
        route: '/admin/informes',
        ip_address: clientIp(context.request)
      });
    }
    return ok(data, { message: 'Visibilidad de informe actualizada.' });
  } catch (error) {
    return fail('No se pudo actualizar el informe.', 500, error instanceof Error ? error.message : error);
  }
};
