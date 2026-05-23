import { isActiveStatus } from '@/lib/appointments';
import { generateTimeSlots } from '@/lib/slots';
import type { Appointment, BlockedSlot, DemoState } from '@/types/demo';

export const AGENDA_DAY_START = 8;
export const AGENDA_DAY_END = 20;

export function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function hourInClinicRange(hour: string) {
  const h = Number(hour.slice(0, 2));
  return h >= AGENDA_DAY_START && h < AGENDA_DAY_END;
}

export function blockAppliesToDentist(block: BlockedSlot, dentistId: string) {
  if (block.appliesToAll) return true;
  if (!dentistId) return true;
  if (block.dentistIds?.length) return block.dentistIds.includes(dentistId);
  return block.dentistId === dentistId;
}

export function blockTargetLabel(
  block: BlockedSlot,
  dentists: { id: string; fullName: string }[]
): string {
  if (block.appliesToAll) return 'Todos los profesionales';
  const ids = block.dentistIds?.length ? block.dentistIds : block.dentistId ? [block.dentistId] : [];
  if (!ids.length) return 'Profesional';
  const names = ids
    .map((id) => dentists.find((d) => d.id === id)?.fullName)
    .filter(Boolean) as string[];
  if (names.length === 1) return names[0];
  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} y ${names.length - 2} más`;
}

export function blockCoversTime(block: BlockedSlot, time: string, dentistId: string) {
  if (!blockAppliesToDentist(block, dentistId)) return false;
  const t = timeToMinutes(time);
  const start = timeToMinutes(block.time);
  const end = timeToMinutes(block.endTime ?? block.time);
  return t >= start && t <= end;
}

export function blockCoversHour(block: BlockedSlot, hour: string, dentistId: string) {
  return blockCoversTime(block, `${hour.slice(0, 2)}:00`, dentistId);
}

export function activeAppointmentsForSlot(
  state: DemoState,
  opts: { clinicId: string; date: string; dentistId?: string }
) {
  return state.appointments.filter(
    (a) =>
      a.clinicId === opts.clinicId &&
      a.date === opts.date &&
      isActiveStatus(a.status) &&
      (!opts.dentistId || a.dentistId === opts.dentistId)
  );
}

export function blocksForDay(
  state: DemoState,
  opts: { clinicId: string; date: string; dentistId?: string }
) {
  return state.blockedSlots.filter(
    (b) =>
      b.clinicId === opts.clinicId &&
      b.date === opts.date &&
      (!opts.dentistId || blockAppliesToDentist(b, opts.dentistId))
  );
}

export function isSlotBlocked(
  state: DemoState,
  opts: { clinicId: string; dentistId: string; date: string; time: string }
) {
  return blocksForDay(state, opts).some((b) => blockCoversTime(b, opts.time, opts.dentistId));
}

export function isSlotTakenByDentist(
  state: DemoState,
  opts: { clinicId: string; dentistId: string; date: string; time: string; excludeId?: string }
) {
  return state.appointments.some(
    (a) =>
      a.id !== opts.excludeId &&
      isActiveStatus(a.status) &&
      a.clinicId === opts.clinicId &&
      a.dentistId === opts.dentistId &&
      a.date === opts.date &&
      a.time === opts.time
  );
}

export function availableSlotsForDentist(
  state: DemoState,
  opts: { clinicId: string; dentistId: string; cabinetId: string; date: string; treatmentId: string }
) {
  const treatment = state.treatments.find((t) => t.id === opts.treatmentId);
  const tenantId = state.clinics.find((c) => c.id === opts.clinicId)?.tenantId ?? '';
  const settings = state.settingsByTenant[tenantId];
  const interval = settings?.slotIntervalMinutes || 15;
  const all = generateTimeSlots(interval, AGENDA_DAY_START, AGENDA_DAY_END);
  const duration = treatment?.durationMinutes ?? settings?.defaultDuration ?? 45;
  const blocks = Math.max(1, Math.ceil(duration / interval));

  return all.filter((time, index) => {
    if (!hourInClinicRange(time)) return false;
    if (isSlotTakenByDentist(state, { ...opts, time })) return false;
    if (isSlotBlocked(state, { clinicId: opts.clinicId, dentistId: opts.dentistId, date: opts.date, time })) {
      return false;
    }
    for (let i = 1; i < blocks; i++) {
      const next = all[index + i];
      if (!next) return false;
      if (isSlotTakenByDentist(state, { ...opts, time: next })) return false;
      if (isSlotBlocked(state, { clinicId: opts.clinicId, dentistId: opts.dentistId, date: opts.date, time: next })) {
        return false;
      }
    }
    return true;
  });
}

export function validateAppointmentSlot(
  state: DemoState,
  opts: { clinicId: string; dentistId: string; date: string; time: string; excludeId?: string }
): string | null {
  if (!opts.dentistId) return 'Selecciona un dentista.';
  if (!hourInClinicRange(opts.time)) return 'No se puede reservar fuera del horario de la clínica.';
  if (isSlotBlocked(state, opts)) return 'Este horario está bloqueado.';
  if (isSlotTakenByDentist(state, opts)) return 'Este horario ya está ocupado.';
  return null;
}
