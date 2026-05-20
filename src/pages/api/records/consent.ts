import type { APIRoute } from 'astro';
import { assertClinicScope, requireSession } from '@/lib/api/guards';
import { created, fail, ok } from '@/lib/http';
import { createInformedConsentRecord, signInformedConsentRecord } from '@/lib/services/records';
import { consentCreateSchema, consentSignSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const gate = requireSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = consentCreateSchema.safeParse(payload);
    if (!parsed.success) return fail('Consentimiento inválido.', 422, parsed.error.flatten());
    const scopeErr = assertClinicScope(gate.user, parsed.data.clinicId);
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
    const scopeErr = assertClinicScope(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;
    const data = await signInformedConsentRecord(parsed.data);
    return ok(data, { message: 'Consentimiento firmado.' });
  } catch (error) {
    return fail('No se pudo firmar el consentimiento.', 500, error instanceof Error ? error.message : error);
  }
};
