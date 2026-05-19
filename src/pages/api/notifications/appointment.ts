import type { APIRoute } from 'astro';
import { ok, fail } from '@/lib/http';
import { sendAppointmentNotifications } from '@/lib/notifications';
import { appointmentNotificationSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();
    const parsed = appointmentNotificationSchema.safeParse(payload);
    if (!parsed.success) return fail('Datos de notificación inválidos.', 422, parsed.error.flatten());

    const data = await sendAppointmentNotifications(parsed.data, new URL(request.url).origin);
    return ok(data, {
      message: 'Confirmaciones procesadas.',
      mode: import.meta.env.PUBLIC_DEMO_MODE === 'false' ? 'real' : 'demo'
    });
  } catch (error) {
    return fail('No se pudieron procesar las confirmaciones de la cita.', 500, error instanceof Error ? error.message : error);
  }
};
