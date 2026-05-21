import type { APIRoute } from 'astro';
import { notifyClinicRegistration } from '@/lib/platform/contact';
import { createRegistration } from '@/lib/platform/service';
import { getEmailStatus } from '@/lib/email/send';
import { created, fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { clinicRegistrationSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async () => {
  const email = getEmailStatus();
  return ok({
    available: hasSupabaseConfig(),
    endpoint: '/api/public/clinic-registration',
    emailConfigured: email.configured
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) {
    return fail('El registro de clínicas no está disponible temporalmente.', 503);
  }
  try {
    const body = await request.json();
    const parsed = clinicRegistrationSchema.safeParse(body);
    if (!parsed.success) return fail('Revisa los datos del formulario.', 422, parsed.error.flatten());
    const row = await createRegistration(parsed.data);
    let emailSent = false;
    try {
      const mail = await notifyClinicRegistration({
        clinic_name: parsed.data.clinic_name,
        owner_name: parsed.data.owner_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        registrationId: row.id
      });
      emailSent = mail.sent && !mail.mock;
    } catch (mailErr) {
      logError('public.clinic-registration.email', mailErr);
      return created(
        { id: row.id, status: row.status, emailSent: false },
        {
          message:
            'Solicitud registrada, pero no pudimos enviar el correo de confirmación. Revisa SMTP en el servidor o escribe a soporte.'
        }
      );
    }
    return created(
      { id: row.id, status: row.status, emailSent },
      { message: 'Solicitud recibida. Te contactaremos en menos de 24 horas.' }
    );
  } catch (error) {
    logError('public.clinic-registration', error);
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: string }).code) : '';
    if (code === '23505') {
      return fail('Ya existe una solicitud pendiente con este email.', 409);
    }
    return fail('No se pudo enviar la solicitud.', 500);
  }
};
