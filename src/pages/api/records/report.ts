import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, requireStaffSession } from '@/lib/api/guards';
import { created, fail, ok } from '@/lib/http';
import { createClinicalReportRecord, toggleClinicalReportVisibility } from '@/lib/services/records';
import { reportCreateSchema, reportVisibilitySchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const gate = requireStaffSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = reportCreateSchema.safeParse(payload);
    if (!parsed.success) return fail('Informe inválido.', 422, parsed.error.flatten());
    const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;
    const data = await createClinicalReportRecord(parsed.data);
    return created(data, { message: 'Informe persistido en Supabase.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar el informe.';
    return fail(message, 500, error instanceof Error ? error.message : error);
  }
};

export const PATCH: APIRoute = async (context) => {
  try {
    const gate = requireStaffSession(context);
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
    return ok(data, { message: 'Visibilidad de informe actualizada.' });
  } catch (error) {
    return fail('No se pudo actualizar el informe.', 500, error instanceof Error ? error.message : error);
  }
};
