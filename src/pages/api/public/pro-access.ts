import type { APIRoute } from 'astro';
import { submitProAccessForm } from '@/lib/platform/contact';
import { getEmailStatus } from '@/lib/email/send';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { proAccessFormSchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async () => {
  const email = getEmailStatus();
  return ok({
    available: true,
    endpoint: '/api/public/pro-access',
    emailConfigured: email.configured
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = proAccessFormSchema.safeParse(body);
    if (!parsed.success) return fail('Revisa los datos del formulario.', 422, parsed.error.flatten());

    const result = await submitProAccessForm(parsed.data);
    return ok(result, { message: 'Solicitud enviada correctamente.' });
  } catch (error) {
    logError('public.pro-access', error);
    return fail(
      'No se pudo enviar la solicitud. Inténtalo más tarde o escribe a info@estructuraweb.es.',
      500
    );
  }
};
