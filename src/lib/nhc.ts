import type { DemoState, Patient } from '@/types/demo';

/** Ancho mínimo de dígitos del NHC (amplía cuando se agotan). */
export const NHC_MIN_WIDTH = 4;

export function formatNhc(value: number, width = NHC_MIN_WIDTH) {
  const w = value >= 10 ** width ? String(value).length : width;
  return String(value).padStart(w, '0');
}

export function normalizeNhcQuery(query: string) {
  return query.trim().replace(/\s+/g, '').replace(/^nhc[-\s]*/i, '');
}

/** Siguiente NHC en modo demo (por clínica preferida o global). */
export function nextDemoNhc(state: DemoState, clinicId?: string): string {
  const list = clinicId
    ? state.patients.filter((p) => p.preferredClinicId === clinicId || !p.preferredClinicId)
    : state.patients;
  let max = 0;
  for (const p of list) {
    if (!p.nhc) continue;
    const n = parseInt(p.nhc.replace(/\D/g, ''), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return formatNhc(max + 1);
}

export function patientDisplayCode(patient: Pick<Patient, 'nhc' | 'id'>) {
  return patient.nhc ? `NHC ${patient.nhc}` : patient.id;
}
