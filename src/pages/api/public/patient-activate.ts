import type { APIRoute } from 'astro';
import { activatePatientAccount } from '@/lib/services/patientRegistration';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { patientActivateSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) {
    return fail('Activación no disponible temporalmente.', 503);
  }
  try {
    const body = await request.json();
    const parsed = patientActivateSchema.safeParse(body);
    if (!parsed.success) return fail('Enlace no válido.', 422, parsed.error.flatten());

    const result = await activatePatientAccount(parsed.data.token);
    return ok(
      { email: result.email, fullName: result.fullName },
      { message: 'Cuenta activada correctamente. Ya puedes iniciar sesión y reservar citas.' }
    );
  } catch (error) {
    logError('public.patient-activate', error);
    const msg = error instanceof Error ? error.message : 'No se pudo activar la cuenta.';
    return fail(msg, 400);
  }
};
