import type { APIRoute } from 'astro';
import { createRegistration } from '@/lib/platform/service';
import { created, fail } from '@/lib/http';
import { logError } from '@/lib/logger';
import { clinicRegistrationSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) {
    return fail('El registro de clínicas no está disponible temporalmente.', 503);
  }
  try {
    const body = await request.json();
    const parsed = clinicRegistrationSchema.safeParse(body);
    if (!parsed.success) return fail('Revisa los datos del formulario.', 422, parsed.error.flatten());
    const row = await createRegistration(parsed.data);
    return created(
      { id: row.id, status: row.status },
      { message: 'Solicitud recibida. Te contactaremos en menos de 24 horas.' }
    );
  } catch (error) {
    logError('public.clinic-registration', error);
    return fail('No se pudo enviar la solicitud.', 500);
  }
};
