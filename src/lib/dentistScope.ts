import type { Appointment, DemoState, Dentist, Patient } from '@/types/demo';
import { todayIso } from '@/lib/format';

export const DENTIST_SCOPE_KEY = 'dentista-plus-selected-dentist';

const dentistPalette = [
  { from: '#0eaddd', to: '#2fd4a8', soft: '#e8f9fc' },
  { from: '#6366f1', to: '#8b5cf6', soft: '#eef2ff' },
  { from: '#f59e0b', to: '#f97316', soft: '#fff7ed' }
] as const;

export function dentistAccent(index: number) {
  return dentistPalette[index % dentistPalette.length];
}

export function dentistInitials(name: string) {
  const parts = name.replace(/^(Dr\.|Dra\.)\s*/i, '').trim().split(/\s+/);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

export function inferPrimaryDentistId(state: DemoState, patientId: string): string | undefined {
  const patient = state.patients.find((item) => item.id === patientId);
  if (patient?.primaryDentistId) return patient.primaryDentistId;
  const counts = new Map<string, number>();
  for (const appointment of state.appointments.filter((item) => item.patientId === patientId)) {
    counts.set(appointment.dentistId, (counts.get(appointment.dentistId) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0];
}

export function patientsForDentist(state: DemoState, dentistId: string): Patient[] {
  return state.patients.filter((patient) => {
    const primary = patient.primaryDentistId || inferPrimaryDentistId(state, patient.id);
    return primary === dentistId;
  });
}

export function appointmentsForDentist(state: DemoState, dentistId: string): Appointment[] {
  return state.appointments.filter((appointment) => appointment.dentistId === dentistId);
}

export function dentistStats(state: DemoState, dentist: Dentist) {
  const appointments = appointmentsForDentist(state, dentist.id);
  const patients = patientsForDentist(state, dentist.id);
  const today = todayIso();
  const todayAppointments = appointments.filter((item) => item.date === today);
  const pending = appointments.filter((item) => item.status === 'pendiente').length;
  const upcoming = appointments
    .filter((item) => item.date >= today && !['cancelada', 'completada', 'no_asistio'].includes(item.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return {
    patients: patients.length,
    appointments: appointments.length,
    todayAppointments: todayAppointments.length,
    pending,
    nextAppointment: upcoming[0] ?? null
  };
}

export function readScopedDentistId(): string | null {
  if (typeof window === 'undefined') return null;
  const fromUrl = new URL(window.location.href).searchParams.get('dr');
  if (fromUrl) return fromUrl;
  return window.sessionStorage.getItem(DENTIST_SCOPE_KEY);
}

export function writeScopedDentistId(dentistId: string | null) {
  if (typeof window === 'undefined') return;
  if (dentistId) window.sessionStorage.setItem(DENTIST_SCOPE_KEY, dentistId);
  else window.sessionStorage.removeItem(DENTIST_SCOPE_KEY);
}

export function parseDentistIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/admin\/equipo\/([^/]+)/);
  return match?.[1] ?? null;
}
