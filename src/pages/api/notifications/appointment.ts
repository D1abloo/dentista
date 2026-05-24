import type { APIRoute } from 'astro';
import { requireStaffSession } from '@/lib/api/guards';
import { ok, fail } from '@/lib/http';
import { sendAppointmentNotifications } from '@/lib/notifications';
import { appointmentNotificationSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const gate = await requireStaffSession(context);
    if (gate.response) return gate.response;

    const payload = await context.request.json();
    const parsed = appointmentNotificationSchema.safeParse(payload);
    if (!parsed.success) return fail('Datos de notificación inválidos.', 422, parsed.error.flatten());

    const data = await sendAppointmentNotifications(parsed.data, new URL(context.request.url).origin);
    return ok(data, { message: 'Confirmaciones procesadas.' });
  } catch (error) {
    return fail('No se pudieron procesar las confirmaciones de la cita.', 500, error instanceof Error ? error.message : error);
  }
};
