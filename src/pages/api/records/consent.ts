import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, assertStaffOrOwnPatient, requireSession, requireStaffSession } from '@/lib/api/guards';
import { created, fail, ok } from '@/lib/http';
import { consentBelongsToPatient, createInformedConsentRecord, signInformedConsentRecord } from '@/lib/services/records';
import { consentCreateSchema, consentSignSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const gate = requireStaffSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = consentCreateSchema.safeParse(payload);
    if (!parsed.success) return fail('Consentimiento inválido.', 422, parsed.error.flatten());
    const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;
    const data = await createInformedConsentRecord(parsed.data);
    return created(data, { message: 'Consentimiento creado en Supabase.' });
  } catch (error) {
    return fail('No se pudo crear el consentimiento.', 500, error instanceof Error ? error.message : error);
  }
};

export const PATCH: APIRoute = async (context) => {
  try {
    const gate = requireSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = consentSignSchema.safeParse(payload);
    if (!parsed.success) return fail('Firma de consentimiento inválida.', 422, parsed.error.flatten());
    if (gate.user.role === 'patient' || gate.user.patientId) {
      if (!gate.user.patientId) return fail('Sesión de paciente inválida.', 403);
      const owned = await consentBelongsToPatient(parsed.data.consentId, gate.user.patientId);
      if (!owned) return fail('No puedes firmar este consentimiento.', 403);
      if (gate.user.clinicId && gate.user.clinicId !== parsed.data.clinicId) {
        return fail('Sede no válida para tu sesión.', 403);
      }
    } else {
      const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
      if (scopeErr) return scopeErr;
    }
    const data = await signInformedConsentRecord(parsed.data);
    return ok(data, { message: 'Consentimiento firmado.' });
  } catch (error) {
    return fail('No se pudo firmar el consentimiento.', 500, error instanceof Error ? error.message : error);
  }
};
