import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, requireStaffSession } from '@/lib/api/guards';
import { created, fail } from '@/lib/http';
import { createPatientDocumentRecord } from '@/lib/services/records';
import { documentCreateSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const gate = requireStaffSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = documentCreateSchema.safeParse(payload);
    if (!parsed.success) return fail('Documento inválido.', 422, parsed.error.flatten());
    const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;
    const data = await createPatientDocumentRecord(parsed.data);
    return created(data, { message: 'Documento guardado correctamente.' });
  } catch (error) {
    return fail('No se pudo guardar el documento.', 500, error instanceof Error ? error.message : error);
  }
};
