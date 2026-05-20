import type { APIRoute } from 'astro';
import { submitContactForm } from '@/lib/platform/contact';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { contactFormSchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async () => {
  return ok({ available: true, endpoint: '/api/public/contact' });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = contactFormSchema.safeParse(body);
    if (!parsed.success) return fail('Revisa los datos del formulario.', 422, parsed.error.flatten());

    const result = await submitContactForm(parsed.data);
    return ok(result, { message: 'Mensaje enviado correctamente.' });
  } catch (error) {
    logError('public.contact', error);
    return fail('No se pudo enviar el mensaje. Inténtalo más tarde o escribe a info@estructuraweb.es.', 500);
  }
};
