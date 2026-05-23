import { dentistsForClinic } from '@/lib/clinic';
import { todayIso } from '@/lib/format';
import { summarizeDayAvailability } from '@/lib/bookingCalendar';
import { availableSlots, daySlotMap, type SlotCell } from '@/lib/slots';
import type { Clinic, DemoState, Dentist, Patient, Treatment } from '@/types/demo';

export const ANY_DENTIST_ID = '__any__';

export const BOOK_STEPS = [
  'Clínica',
  'Tratamiento',
  'Profesional',
  'Fecha y hora',
  'Resumen',
  'Confirmar'
] as const;

export type BookStep = 1 | 2 | 3 | 4 | 5 | 6;

export type SlotPick = { date: string; time: string; dentistId: string };

export function clinicsForPatient(state: DemoState, patient: Patient): Clinic[] {
  const active = state.clinics.filter((c) => c.active);
  if (!patient.preferredClinicId) return active;
  const pref = state.clinics.find((c) => c.id === patient.preferredClinicId);
  if (!pref) return active;
  return active.filter((c) => c.tenantId === pref.tenantId);
}

export function treatmentBlurb(t: Treatment): string {
  if (t.description?.trim()) return t.description.trim();
  const n = t.name.toLowerCase();
  if (n.includes('limpieza')) return 'Limpieza completa y revisión básica.';
  if (n.includes('revisión') || n.includes('diagnóstico')) return 'Consulta inicial o revisión general.';
  if (n.includes('blanque')) return 'Tratamiento estético dental.';
  if (n.includes('ortodon')) return 'Seguimiento o valoración de ortodoncia.';
  if (n.includes('urgenc')) return 'Dolor, molestia o incidencia urgente.';
  return 'Tratamiento disponible en tu clínica.';
}

export function resolveDentistId(
  state: DemoState,
  opts: {
    clinicId: string;
    dentistId: string;
    cabinetId: string;
    date: string;
    time: string;
    treatmentId: string;
  }
): string | null {
  if (opts.dentistId !== ANY_DENTIST_ID) {
    const slots = availableSlots(state, { ...opts, dentistId: opts.dentistId });
    return slots.includes(opts.time) ? opts.dentistId : null;
  }
  for (const d of dentistsForClinic(state, opts.clinicId)) {
    const slots = availableSlots(state, { ...opts, dentistId: d.id });
    if (slots.includes(opts.time)) return d.id;
  }
  return null;
}

export function findNextAvailableSlot(
  state: DemoState,
  opts: {
    clinicId: string;
    treatmentId: string;
    dentistId: string;
    cabinetId: string;
    fromDate?: string;
  }
): SlotPick | null {
  const start = opts.fromDate ?? todayIso();
  const dentists =
    opts.dentistId === ANY_DENTIST_ID
      ? dentistsForClinic(state, opts.clinicId)
      : dentistsForClinic(state, opts.clinicId).filter((d) => d.id === opts.dentistId);

  for (let offset = 0; offset < 90; offset++) {
    const d = new Date(start + 'T12:00:00');
    d.setDate(d.getDate() + offset);
    const date = d.toISOString().slice(0, 10);
    const summary = summarizeDayAvailability(state, {
      clinicId: opts.clinicId,
      dentistId: dentists[0]?.id ?? '',
      cabinetId: opts.cabinetId,
      treatmentId: opts.treatmentId,
      date
    });
    if (summary.level === 'past' || summary.level === 'full') continue;

    for (const dentist of dentists) {
      const slots = availableSlots(state, {
        clinicId: opts.clinicId,
        dentistId: dentist.id,
        cabinetId: opts.cabinetId,
        date,
        treatmentId: opts.treatmentId
      });
      if (slots[0]) return { date, time: slots[0], dentistId: dentist.id };
    }
  }
  return null;
}

export function nextSlotLabel(state: DemoState, opts: Parameters<typeof findNextAvailableSlot>[1]): string | null {
  const pick = findNextAvailableSlot(state, opts);
  if (!pick) return null;
  const today = todayIso();
  const day =
    pick.date === today
      ? 'Hoy'
      : new Date(pick.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return `${day} a las ${pick.time}`;
}

export function professionalAvailabilityHint(
  state: DemoState,
  clinicId: string,
  dentist: Dentist,
  treatmentId: string,
  cabinetId: string
): string {
  const pick = findNextAvailableSlot(state, {
    clinicId,
    treatmentId,
    dentistId: dentist.id,
    cabinetId
  });
  if (!pick) return 'Sin huecos próximos';
  const today = todayIso();
  if (pick.date === today) return 'Disponible hoy';
  const wd = new Date(pick.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long' });
  return `Próximo hueco: ${wd} ${pick.time}`;
}

export function mergedDaySlots(
  state: DemoState,
  opts: { clinicId: string; cabinetId: string; date: string; treatmentId: string },
  dentists: Dentist[]
): SlotCell[] {
  if (!dentists.length) return [];
  const base = daySlotMap(state, { ...opts, dentistId: dentists[0].id });
  if (dentists.length === 1) return base;
  return base.map((cell) => {
    const anyFree = dentists.some((d) =>
      availableSlots(state, { ...opts, dentistId: d.id, date: opts.date, treatmentId: opts.treatmentId }).includes(
        cell.time
      )
    );
    return {
      time: cell.time,
      status: anyFree ? 'libre' : ('ocupado' as const),
      selectable: anyFree
    };
  });
}

export function calendarDentistId(dentistId: string, dentists: Dentist[]) {
  if (dentistId === ANY_DENTIST_ID) return dentists[0]?.id ?? '';
  return dentistId;
}

export function formatSlotsHeader(date: string) {
  const label = new Date(date + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  return `Horarios disponibles para el ${label}`;
}
