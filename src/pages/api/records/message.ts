import type { APIRoute } from 'astro';
import { assertStaffOrOwnPatient, requireSession } from '@/lib/api/guards';
import { created, fail } from '@/lib/http';
import { createPatientMessageRecord } from '@/lib/services/records';
import { messageCreateSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const gate = requireSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = messageCreateSchema.safeParse(payload);
    if (!parsed.success) return fail('Mensaje inválido.', 422, parsed.error.flatten());
    const scopeErr = await assertStaffOrOwnPatient(gate.user, parsed.data.clinicId, parsed.data.patientId);
    if (scopeErr) return scopeErr;
    const data = await createPatientMessageRecord(parsed.data);
    return created(data, { message: 'Mensaje guardado en Supabase.' });
  } catch (error) {
    return fail('No se pudo guardar el mensaje.', 500, error instanceof Error ? error.message : error);
  }
};
