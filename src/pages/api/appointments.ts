import type { APIRoute } from 'astro';
import { getSessionUser } from '@/lib/auth';
import { ok, created, fail } from '@/lib/http';
import { sendAppointmentNotifications } from '@/lib/notifications';
import { listAppointments, createAppointment, updateAppointment } from '@/lib/services/appointments';
import { appointmentActionSchema, appointmentSchema, appointmentListQuerySchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const user = getSessionUser(cookies);
    if (!user) return fail('No autenticado para consultar citas.', 401);
    const parsed = appointmentListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return fail('Query de citas inválida.', 422, parsed.error.flatten());
    const { clinicId, dentistId } = parsed.data;
    const allAppointments = await listAppointments(clinicId);
    const scoped = dentistId ? allAppointments.filter((appointment) => appointment.dentistId === dentistId) : allAppointments;
    const data = user.role === 'patient'
      ? scoped.filter((appointment) => appointment.patientId === (user.patientId ?? 'p-maria'))
      : scoped;
    return ok(data, { count: data.length, mode: import.meta.env.PUBLIC_DEMO_MODE === 'false' ? 'real' : 'demo' });
  } catch (error) {
    return fail('No se pudieron cargar las citas.', 500, error instanceof Error ? error.message : error);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.json();
    const parsed = appointmentSchema.safeParse(payload);
    if (!parsed.success) return fail('Datos de cita inválidos.', 422, parsed.error.flatten());
    const data = await createAppointment(parsed.data);
    const channels = [
      parsed.data.patientEmail ? 'email' : null,
      parsed.data.patientPhone ? 'whatsapp' : null
    ].filter((channel): channel is 'email' | 'whatsapp' => Boolean(channel));
    const notifications = channels.length ? await sendAppointmentNotifications({
      channels,
      patientId: data.patientId,
      appointmentId: data.id,
      patientName: data.patientName,
      patientEmail: parsed.data.patientEmail,
      patientPhone: parsed.data.patientPhone,
      treatmentName: data.treatmentName,
      dentistName: data.dentistName,
      clinicName: data.clinicId,
      cabinetName: data.roomName,
      date: data.startsAt.slice(0, 10),
      time: data.startsAt.slice(11, 16)
    }, new URL(request.url).origin) : null;
    return created(data, { message: 'Cita creada correctamente.', notifications });
  } catch (error) {
    return fail('No se pudo crear la cita.', 500, error instanceof Error ? error.message : error);
  }
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
  try {
    const user = getSessionUser(cookies);
    if (!user) return fail('No autenticado para modificar citas.', 401);

    const payload = await request.json();
    const parsed = appointmentActionSchema.safeParse(payload);
    if (!parsed.success) return fail('Acción de cita inválida.', 422, parsed.error.flatten());
    if (user.role === 'patient' && !['cancel', 'reschedule'].includes(parsed.data.action)) {
      return fail('El paciente solo puede reprogramar o cancelar sus citas.', 403);
    }
    if (user.role === 'patient') {
      const current = (await listAppointments(parsed.data.clinicId)).find((appointment) => appointment.id === parsed.data.appointmentId);
      if (!current || current.patientId !== (user.patientId ?? 'p-maria')) {
        return fail('No puedes modificar una cita de otro paciente.', 403);
      }
    }

    const data = await updateAppointment(parsed.data);
    return ok(data, { message: 'Cita actualizada correctamente.' });
  } catch (error) {
    return fail('No se pudo actualizar la cita.', 500, error instanceof Error ? error.message : error);
  }
};
