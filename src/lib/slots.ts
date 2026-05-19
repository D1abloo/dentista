import type { DemoState } from '@/types/demo';
import { clinicTenantId } from '@/lib/clinic';

export function generateTimeSlots(interval = 15, startHour = 9, endHour = 18) {
  const slots: string[] = [];
  for (let m = startHour * 60; m < endHour * 60; m += interval) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

export function availableSlots(
  state: DemoState,
  opts: { clinicId: string; dentistId: string; cabinetId: string; date: string; treatmentId: string }
) {
  const treatment = state.treatments.find((t) => t.id === opts.treatmentId);
  const tenantId = clinicTenantId(state, opts.clinicId);
  const settings = state.settingsByTenant[tenantId];
  const interval = settings?.slotIntervalMinutes || 15;
  const all = generateTimeSlots(interval);
  const taken = new Set(
    state.appointments
      .filter(
        (a) =>
          a.dentistId === opts.dentistId &&
          a.date === opts.date &&
          a.status !== 'cancelada' &&
          a.cabinetId === opts.cabinetId
      )
      .map((a) => a.time)
  );
  const blocked = new Set(
    state.blockedSlots
      .filter(
        (b) =>
          b.dentistId === opts.dentistId &&
          b.date === opts.date &&
          (b.cabinetId === opts.cabinetId || !b.cabinetId)
      )
      .map((b) => b.time)
  );
  const duration = treatment?.durationMinutes ?? settings?.defaultDuration ?? 45;
  const blocks = Math.max(1, Math.ceil(duration / interval));
  return all.filter((time, index) => {
    if (taken.has(time) || blocked.has(time)) return false;
    for (let i = 1; i < blocks; i++) {
      const next = all[index + i];
      if (!next || taken.has(next) || blocked.has(next)) return false;
    }
    return true;
  });
}
