import type { DemoState, Patient } from '@/types/demo';

/** NHC como número entero (1, 2, 3… sin ceros a la izquierda). */
export function formatNhc(value: number) {
  return String(Math.max(1, Math.floor(value)));
}

export function normalizeNhcQuery(query: string) {
  const raw = query.trim().replace(/\s+/g, '').replace(/^nhc[-\s]*/i, '');
  if (/^\d+$/.test(raw)) return String(parseInt(raw, 10));
  return raw;
}

export function nextDemoNhc(state: DemoState, clinicId?: string): string {
  const list = clinicId
    ? state.patients.filter((p) => p.preferredClinicId === clinicId || !p.preferredClinicId)
    : state.patients;
  let max = 0;
  for (const p of list) {
    if (!p.nhc) continue;
    const n = parseInt(String(p.nhc).replace(/\D/g, ''), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return formatNhc(max + 1);
}

export function patientDisplayCode(patient: Pick<Patient, 'nhc' | 'id'>) {
  return patient.nhc ? `NHC ${patient.nhc}` : patient.id;
}
