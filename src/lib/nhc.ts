import type { DemoState, Patient } from '@/types/demo';

/** NHC almacenado como entero en texto (0, 1, 2…). */
export function formatNhc(value: number) {
  return String(Math.max(0, Math.floor(value)));
}

/** Presentación con tres dígitos: NHC 000, NHC 001… */
export function formatNhcDisplay(nhc?: string) {
  if (!nhc) return '—';
  const n = String(nhc).replace(/\D/g, '');
  if (!n) return '—';
  return `NHC ${n.padStart(3, '0')}`;
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
  let max = -1;
  for (const p of list) {
    if (!p.nhc) continue;
    const n = parseInt(String(p.nhc).replace(/\D/g, ''), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return formatNhc(max + 1);
}

export function patientDisplayCode(patient: Pick<Patient, 'nhc' | 'id'>) {
  return patient.nhc ? formatNhcDisplay(patient.nhc) : patient.id;
}
