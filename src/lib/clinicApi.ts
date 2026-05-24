import { API_JSON_HEADERS, apiErrorMessage, readApiJson } from '@/lib/apiFetch';
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

export async function fetchClinicBootstrap(): Promise<{
  state?: DemoState;
  tenantId?: string;
  patientId?: string;
} | null> {
  const res = await fetch('/api/clinic/bootstrap', { credentials: 'include' });
  const json = (await res.json()) as {
    data?: { state?: DemoState; tenantId?: string; patientId?: string };
    error?: { message?: string };
  };
  if (!res.ok || !json.data?.state) return null;
  return {
    state: json.data.state,
    tenantId: json.data.tenantId,
    patientId: json.data.patientId
  };
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
  const payload: Record<string, unknown> = {
    clinicId: input.clinicId,
    patientId: input.patientId,
    patientName: input.patientName,
    dentistId: input.dentistId,
    treatmentId: input.treatmentId,
    roomName: input.roomName,
    startsAt: `${input.date}T${input.time}:00${offset}`
  };
  if (input.patientEmail?.includes('@')) payload.patientEmail = input.patientEmail.trim();
  if (input.patientPhone && input.patientPhone.replace(/\D/g, '').length >= 6) {
    payload.patientPhone = input.patientPhone.trim();
  }
  if (input.notes?.trim()) payload.notes = input.notes.trim();

  const res = await fetch('/api/appointments', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = (await res.json()) as { error?: { message?: string } };
  if (!res.ok) return { ok: false as const, message: json.error?.message ?? 'No se pudo crear la cita.' };
  return { ok: true as const };
}

export async function createScheduleBlockLive(input: {
  clinicId: string;
  dentistId: string;
  dentistIds?: string[];
  date: string;
  time: string;
  endTime?: string;
  reason: string;
  durationMinutes?: number;
  blockGroupId?: string;
  notes?: string;
}) {
  const res = await fetch('/api/schedule/blocks', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  });
  const json = (await res.json()) as {
    error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } };
  };
  if (!res.ok) {
    const fieldMsg = json.error?.details?.fieldErrors
      ? Object.values(json.error.details.fieldErrors).flat().join(' ')
      : '';
    const message = [json.error?.message, fieldMsg].filter(Boolean).join(' ') || 'No se pudo bloquear.';
    return { ok: false as const, message };
  }
  return { ok: true as const };
}

export async function createTreatmentLive(input: {
  clinicId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active?: boolean;
}) {
  const res = await fetch('/api/treatments', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  });
  const json = (await res.json()) as { error?: { message?: string } };
  if (!res.ok) return { ok: false as const, message: json.error?.message ?? 'No se pudo guardar el tratamiento.' };
  return { ok: true as const };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function scheduleBlockUuid(id: string) {
  return UUID_RE.test(id) ? id : '';
}

export async function bulkUnblockScheduleLive(input: {
  clinicId: string;
  fromDate: string;
  toDate: string;
  scope: 'all' | 'dentist';
  dentistId?: string;
}) {
  const res = await fetch('/api/schedule/blocks/bulk-unblock', {
    method: 'POST',
    credentials: 'include',
    headers: API_JSON_HEADERS,
    body: JSON.stringify(input)
  });
  const parsed = await readApiJson<{ data?: { removed?: number }; error?: { message?: string } }>(res);
  if (!parsed.parseOk) return { ok: false as const, message: parsed.message };
  const json = parsed.json;
  if (!res.ok) {
    return { ok: false as const, message: apiErrorMessage(json, 'No se pudo desbloquear el periodo.') };
  }
  const removed = Number(json.data?.removed ?? 0);
  if (removed < 1) {
    return { ok: false as const, message: 'No había bloqueos que eliminar en ese periodo.' };
  }
  return { ok: true as const, removed };
}

export async function deleteScheduleBlockLive(input: {
  clinicId: string;
  blockId?: string;
  blockGroupId?: string;
  blockIds?: string[];
}) {
  const q = new URLSearchParams({ clinicId: input.clinicId });
  if (input.blockGroupId) q.set('blockGroupId', input.blockGroupId);
  const uuidIds = (input.blockIds ?? []).map(scheduleBlockUuid).filter(Boolean);
  if (uuidIds.length) q.set('ids', uuidIds.join(','));
  else if (input.blockId && scheduleBlockUuid(input.blockId)) q.set('id', input.blockId);
  else if (input.blockId) q.set('id', input.blockId);
  const res = await fetch(`/api/schedule/blocks?${q.toString()}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: API_JSON_HEADERS,
    body: '{}'
  });
  const parsed = await readApiJson<{ data?: { removed?: number }; error?: { message?: string } }>(res);
  if (!parsed.parseOk) return { ok: false as const, message: parsed.message };
  const json = parsed.json;
  if (!res.ok) {
    return { ok: false as const, message: apiErrorMessage(json, 'No se pudo quitar el bloqueo.') };
  }
  const removed = Number(json.data?.removed ?? 0);
  if (removed < 1) {
    return {
      ok: false as const,
      message:
        'No se eliminó ningún bloqueo en el servidor. Recarga la página (F5) e inténtalo otra vez; si persiste, contacta con soporte.'
    };
  }
  return { ok: true as const, removed };
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
