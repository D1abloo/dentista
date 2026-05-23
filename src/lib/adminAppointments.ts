import { isClientDemoMode } from '@/lib/appMode';
import { isClinicSlotTaken } from '@/lib/appointments';
import { validateAppointmentSlot } from '@/lib/agenda/availability';
import { createAppointmentLive, patchAppointmentLive } from '@/lib/clinicApi';
import { tryCreateAppointment, updateAppointmentStatus } from '@/lib/demoStore';
import type { AppointmentStatus, DemoState } from '@/types/demo';

export type CreateAdminAppointmentInput = {
  state: DemoState;
  clinicId: string;
  cabinetId: string;
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
  status?: AppointmentStatus;
};

export async function createAdminAppointment(
  input: CreateAdminAppointmentInput
): Promise<{ ok: true; demoState?: DemoState } | { ok: false; message: string }> {
  const {
    state,
    clinicId,
    cabinetId,
    patientId,
    patientName,
    patientEmail,
    patientPhone,
    dentistId,
    treatmentId,
    roomName,
    date,
    time,
    notes,
    status = 'pendiente'
  } = input;

  const slotErr = validateAppointmentSlot(state, { clinicId, dentistId, date, time });
  if (slotErr) return { ok: false, message: slotErr };
  if (isClinicSlotTaken(state, { clinicId, date, time })) {
    return { ok: false, message: 'Este horario ya está ocupado.' };
  }

  if (!isClientDemoMode()) {
    const live = await createAppointmentLive({
      clinicId,
      patientId,
      patientName,
      patientEmail,
      patientPhone,
      dentistId,
      treatmentId,
      roomName,
      date,
      time,
      notes
    });
    if (!live.ok) return { ok: false, message: live.message };
    return { ok: true as const };
  }

  const result = tryCreateAppointment(state, {
    patientId,
    dentistId,
    clinicId,
    cabinetId,
    treatmentId,
    date,
    time,
    notes: notes ?? '',
    status
  });
  if (!result.ok) {
    return { ok: false, message: result.message ?? 'No se pudo crear la cita.' };
  }
  return { ok: true as const, demoState: result.state };
}

export async function updateAdminAppointmentStatus(
  state: DemoState,
  appt: { id: string; clinicId: string; date: string; time: string },
  status: AppointmentStatus,
  patch?: { date?: string; time?: string }
): Promise<{ ok: true; demoState?: DemoState } | { ok: false; message: string }> {
  if (!isClientDemoMode()) {
    const live = await patchAppointmentLive({
      clinicId: appt.clinicId,
      appointmentId: appt.id,
      status,
      date: patch?.date,
      time: patch?.time
    });
    if (!live.ok) return { ok: false, message: live.message };
    return { ok: true };
  }
  return {
    ok: true,
    demoState: updateAppointmentStatus(state, appt.id, status, patch)
  };
}
