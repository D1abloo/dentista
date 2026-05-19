import type { DemoState, Patient } from '@/types/demo';

/** Coincide búsqueda por ID paciente (PAT-XXXX), DNI o nombre */
export function normalizeSearch(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '');
}

export function patientMatchesQuery(patient: Patient, query: string) {
  const q = normalizeSearch(query);
  if (!q) return true;
  const dni = normalizeSearch(patient.dni ?? '');
  return (
    patient.id.toLowerCase().includes(q) ||
    patient.fullName.toLowerCase().includes(q) ||
    patient.email.toLowerCase().includes(q) ||
    Boolean(dni && dni.includes(q.replace(/-/g, '')))
  );
}

export function findPatientsByQuery(state: DemoState, query: string): Patient[] {
  if (!normalizeSearch(query)) return state.patients;
  return state.patients.filter((p) => patientMatchesQuery(p, query));
}

export function findPatientIdByQuery(state: DemoState, query: string): string | null {
  const q = normalizeSearch(query);
  if (!q) return null;
  const exact = state.patients.find(
    (p) => p.id.toLowerCase() === q || normalizeSearch(p.dni ?? '') === q.replace(/-/g, '')
  );
  if (exact) return exact.id;
  const list = findPatientsByQuery(state, query);
  return list.length === 1 ? list[0].id : null;
}

/** Filtra registros vinculados a paciente según búsqueda DNI/ID/nombre */
export function recordMatchesPatientQuery(
  state: DemoState,
  patientId: string,
  query: string
): boolean {
  if (!normalizeSearch(query)) return true;
  const p = state.patients.find((x) => x.id === patientId);
  return p ? patientMatchesQuery(p, query) : false;
}
