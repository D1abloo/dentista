import type { APIRoute } from 'astro';
import {
  requireAppointmentAccess
} from '@/lib/api/appointmentAccess';
import { ok, created, fail } from '@/lib/http';
import { sendAppointmentNotifications } from '@/lib/notifications';
import {
  createAppointmentWithValidation,
  listScopedAppointments
} from '@/lib/services/appointmentAutomation';
import { updateAppointment } from '@/lib/services/appointments';
import {
  appointmentActionSchema,
  appointmentAutomationCreateSchema,
  appointmentAutomationListSchema,
  appointmentListQuerySchema,
  appointmentSchema
} from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const automationQuery = appointmentAutomationListSchema.safeParse(
      Object.fromEntries(context.url.searchParams)
    );
    if (automationQuery.success) {
      const accessGate = await requireAppointmentAccess(context, automationQuery.data.clinicId);
      if (accessGate.response || !accessGate.access) return accessGate.response ?? fail('No autorizado.', 401);
      const data = await listScopedAppointments(accessGate.access.actor, automationQuery.data);
      return ok(data, { count: data.length, timezone: automationQuery.data.timezone });
    }

    const parsed = appointmentListQuerySchema.safeParse(Object.fromEntries(context.url.searchParams));
    if (!parsed.success) return fail('Query de citas inválida.', 422, parsed.error.flatten());
    const { clinicId, dentistId } = parsed.data;
    const accessGate = await requireAppointmentAccess(context, clinicId);
    if (accessGate.response || !accessGate.access) return accessGate.response ?? fail('No autorizado.', 401);
    const data = await listScopedAppointments(accessGate.access.actor, {
      clinicId,
      dentistId,
      upcomingOnly: false
    });
    return ok(data, { count: data.length });
  } catch (error) {
    return fail('No se pudieron cargar las citas.', 500, error instanceof Error ? error.message : error);
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const payload = await context.request.json();
    const automationParsed = appointmentAutomationCreateSchema.safeParse(payload);
    if (automationParsed.success) {
      const accessGate = await requireAppointmentAccess(context, automationParsed.data.clinicId);
      if (accessGate.response || !accessGate.access) return accessGate.response ?? fail('No autorizado.', 401);
      const data = await createAppointmentWithValidation(accessGate.access.actor, automationParsed.data);
      const channels = [
        automationParsed.data.patientEmail ? 'email' : null,
        automationParsed.data.patientPhone ? 'whatsapp' : null
      ].filter((channel): channel is 'email' | 'whatsapp' => Boolean(channel));
      const notifications = channels.length
        ? await sendAppointmentNotifications(
            {
              channels,
              patientId: data.patientId,
              appointmentId: data.id,
              patientName: data.patientName,
              patientEmail: automationParsed.data.patientEmail,
              patientPhone: automationParsed.data.patientPhone,
              treatmentName: data.treatmentName,
              dentistName: data.dentistName,
              clinicName: data.clinicId,
              cabinetName: data.roomName,
              date: data.startsAt.slice(0, 10),
              time: data.startsAt.slice(11, 16)
            },
            new URL(context.request.url).origin
          )
        : null;
      return created(data, { message: 'Cita creada correctamente.', notifications, orchestrator: 'n8n' });
    }

    const parsed = appointmentSchema.safeParse(payload);
    if (!parsed.success) return fail('Datos de cita inválidos.', 422, parsed.error.flatten());

    const accessGate = await requireAppointmentAccess(context, parsed.data.clinicId);
    if (accessGate.response || !accessGate.access) return accessGate.response ?? fail('No autorizado.', 401);
    if (accessGate.access.actor.role === 'patient' || accessGate.access.actor.patientId) {
      const patientId = accessGate.access.actor.patientId ?? accessGate.access.actor.userId;
      if (parsed.data.patientId !== patientId) {
        return fail('No puedes crear citas para otro paciente.', 403);
      }
    }

    const data = await createAppointmentWithValidation(accessGate.access.actor, {
      ...parsed.data,
      confirm: true,
      timezone: 'Europe/Madrid'
    });
    const channels = [
      parsed.data.patientEmail ? 'email' : null,
      parsed.data.patientPhone ? 'whatsapp' : null
    ].filter((channel): channel is 'email' | 'whatsapp' => Boolean(channel));
    const notifications = channels.length
      ? await sendAppointmentNotifications(
          {
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
          },
          new URL(context.request.url).origin
        )
      : null;
    return created(data, { message: 'Cita creada correctamente.', notifications });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear la cita.';
    const status = message.includes('disponible') || message.includes('ocupada') ? 409 : 500;
    return fail(message, status);
  }
};

export const PATCH: APIRoute = async (context) => {
  try {
    const payload = await context.request.json();
    const parsed = appointmentActionSchema.safeParse(payload);
    if (!parsed.success) return fail('Acción de cita inválida.', 422, parsed.error.flatten());
    const accessGate = await requireAppointmentAccess(context, parsed.data.clinicId);
    if (accessGate.response || !accessGate.access) return accessGate.response ?? fail('No autorizado.', 401);
    if (accessGate.access.actor.role === 'patient' || accessGate.access.actor.patientId) {
      if (!['cancel', 'reschedule'].includes(parsed.data.action)) {
        return fail('El paciente solo puede reprogramar o cancelar sus citas.', 403);
      }
      const rows = await listScopedAppointments(accessGate.access.actor, { clinicId: parsed.data.clinicId });
      const current = rows.find((appointment) => appointment.id === parsed.data.appointmentId);
      if (!current) return fail('No puedes modificar una cita de otro paciente.', 403);
    }

    const data = await updateAppointment(parsed.data);
    return ok(data, { message: 'Cita actualizada correctamente.' });
  } catch (error) {
    return fail('No se pudo actualizar la cita.', 500, error instanceof Error ? error.message : error);
  }
};
