import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { updateDentistProfileRecord } from '@/lib/services/dentistProfile';
import { hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer';
import { dentistProfileUpdateSchema } from '@/lib/validators';

export const prerender = false;

export const PATCH: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  if (isDemoMode()) return fail('En modo demo guarda desde el panel.', 400);

  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = dentistProfileUpdateSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());

    const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;

    const data = await updateDentistProfileRecord(gate.user, {
      clinicId: parsed.data.clinicId,
      dentistId: parsed.data.dentistId,
      fullName: parsed.data.fullName,
      specialty: parsed.data.specialty,
      collegiateNumber: parsed.data.collegiateNumber,
      email: parsed.data.email || undefined,
      phone: parsed.data.phone || undefined
    });

    return ok(data, { message: 'Perfil profesional actualizado.' });
  } catch (error) {
    logError('clinic.dentist-profile.patch', error);
    const message = error instanceof Error ? error.message : 'No se pudo guardar el perfil.';
    return fail(message, 500);
  }
};
