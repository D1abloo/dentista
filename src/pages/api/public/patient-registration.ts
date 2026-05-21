import type { APIRoute } from 'astro';
import { created, fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { registerPatient } from '@/lib/services/patientRegistration';
import { patientRegistrationSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async () => {
  return ok({
    available: hasSupabaseConfig(),
    endpoint: '/api/public/patient-registration'
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) {
    return fail('El registro de pacientes no está disponible temporalmente.', 503);
  }
  try {
    const body = await request.json();
    const parsed = patientRegistrationSchema.safeParse(body);
    if (!parsed.success) return fail('Revisa los datos del formulario.', 422, parsed.error.flatten());

    const result = await registerPatient(parsed.data);
    return created(
      {
        profileId: result.profileId,
        email: result.email,
        activationEmailSent: result.activationEmailSent
      },
      {
        message: result.activationEmailSent
          ? 'Cuenta creada. Revisa tu correo y activa la cuenta antes de reservar citas.'
          : 'Cuenta creada, pero no pudimos enviar el correo de activación. Contacta con la clínica.'
      }
    );
  } catch (error) {
    logError('public.patient-registration', error);
    const msg = error instanceof Error ? error.message : 'No se pudo completar el registro.';
    if (msg.includes('ya existe') || msg.includes('ya está registrado')) {
      return fail(msg, 409);
    }
    return fail(msg, 500);
  }
};
