import { patientName } from '@/lib/selectors';
import type { Appointment, DemoState } from '@/types/demo';

export function isActiveStatus(status: Appointment['status']) {
  return !['cancelada', 'completada', 'no_asistio'].includes(status);
}

export function appointmentPrice(state: DemoState, treatmentId: string) {
  return state.treatments.find((t) => t.id === treatmentId)?.price ?? 0;
}

export function hasSlotConflict(
  state: DemoState,
  opts: {
    dentistId: string;
    cabinetId: string;
    date: string;
    time: string;
    excludeId?: string;
  }
) {
  return state.appointments.some(
    (a) =>
      a.id !== opts.excludeId &&
      isActiveStatus(a.status) &&
      a.dentistId === opts.dentistId &&
      a.cabinetId === opts.cabinetId &&
      a.date === opts.date &&
      a.time === opts.time
  );
}

export function filterAppointments(
  state: DemoState,
  list: Appointment[],
  opts: { q?: string; status?: string; patientId?: string }
) {
  let out = [...list];
  if (opts.patientId) out = out.filter((a) => a.patientId === opts.patientId);
  if (opts.status && opts.status !== 'todos') out = out.filter((a) => a.status === opts.status);
  if (opts.q?.trim()) {
    const q = opts.q.toLowerCase();
    out = out.filter((a) => {
      const name = patientName(state, a.patientId).toLowerCase();
      return name.includes(q) || a.id.toLowerCase().includes(q) || a.date.includes(q);
    });
  }
  return out.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
}

export function appointmentsInRange(list: Appointment[], from: string, to: string) {
  return list.filter((a) => a.date >= from && a.date <= to);
}

export function weekRange(anchor: string) {
  const d = new Date(`${anchor}T12:00:00`);
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { from: fmt(monday), to: fmt(sunday) };
}

export function monthPrefix(anchor: string) {
  return anchor.slice(0, 7);
}
