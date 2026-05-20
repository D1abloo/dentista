import type { AppointmentStatus, DemoState } from '@/types/demo';

const STATUS_TO_ACTION: Partial<
  Record<AppointmentStatus, 'confirm' | 'complete' | 'cancel' | 'no_show' | 'reschedule'>
> = {
  confirmada: 'confirm',
  completada: 'complete',
  cancelada: 'cancel',
  no_asistio: 'no_show',
  reprogramada: 'reschedule'
};

export async function fetchClinicBootstrap(): Promise<{ state?: DemoState; tenantId?: string } | null> {
  const res = await fetch('/api/clinic/bootstrap', { credentials: 'include' });
  const json = (await res.json()) as {
    data?: { state?: DemoState; tenantId?: string };
    error?: { message?: string };
  };
  if (!res.ok || !json.data?.state) return null;
  return { state: json.data.state, tenantId: json.data.tenantId };
}

export async function patchAppointmentLive(input: {
  clinicId: string;
  appointmentId: string;
  status: AppointmentStatus;
  date?: string;
  time?: string;
  notes?: string;
}) {
  const action = STATUS_TO_ACTION[input.status];
  if (!action) return { ok: false as const, message: 'Estado sin acción en servidor.' };

  const body: Record<string, unknown> = {
    clinicId: input.clinicId,
    appointmentId: input.appointmentId,
    action,
    notes: input.notes
  };

  if (action === 'reschedule' && input.date && input.time) {
    const offset = '+02:00';
    body.startsAt = `${input.date}T${input.time}:00${offset}`;
  }

  const res = await fetch('/api/appointments', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = (await res.json()) as { error?: { message?: string } };
  if (!res.ok) return { ok: false as const, message: json.error?.message ?? 'No se pudo actualizar la cita.' };
  return { ok: true as const };
}

export async function createAppointmentLive(input: {
  clinicId: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  dentistId: string;
  treatmentId: string;
  roomName: string;
  date: string;
  time: string;
  notes?: string;
}) {
  const offset = '+02:00';
  const res = await fetch('/api/appointments', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...input,
      startsAt: `${input.date}T${input.time}:00${offset}`
    })
  });
  const json = (await res.json()) as { error?: { message?: string } };
  if (!res.ok) return { ok: false as const, message: json.error?.message ?? 'No se pudo crear la cita.' };
  return { ok: true as const };
}

export async function processNotificationQueueLive(limit = 20) {
  const res = await fetch('/api/notifications/process', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ limit })
  });
  const json = (await res.json()) as { data?: unknown; error?: { message?: string } };
  if (!res.ok) return { ok: false as const, message: json.error?.message ?? 'No se pudo procesar la cola.' };
  return { ok: true as const, data: json.data };
}
