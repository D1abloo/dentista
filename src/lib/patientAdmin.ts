import { isActiveStatus } from '@/lib/appointments';
import { findPatientsByQuery, patientMatchesQuery, recordMatchesPatientQuery } from '@/lib/patientSearch';
import { pendingInvoicesForPatient, recordsForPatient } from '@/lib/selectors';
import type { DemoState, Patient } from '@/types/demo';

export type PatientFilter = 'all' | 'next_appt' | 'pending_inv' | 'no_appt' | 'portal';
export type PatientSort = 'next_appt' | 'name' | 'recent' | 'pending_inv';

export type PatientRow = {
  patient: Patient;
  nextAppt: { date: string; time: string } | null;
  pendingInvoices: number;
  reportsCount: number;
  documentsCount: number;
  portalActive: boolean;
  badges: Array<'next' | 'pending' | 'portal' | 'no_appt'>;
};

export function enrichPatientRow(state: DemoState, patient: Patient): PatientRow {
  const rec = recordsForPatient(state, patient.id);
  const nextAppt = [...rec.appointments]
    .filter((a) => isActiveStatus(a.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
  const pendingInvoices = pendingInvoicesForPatient(state, patient.id).length;
  const portalActive = Boolean(patient.email?.includes('@'));
  const badges: PatientRow['badges'] = [];
  if (nextAppt) badges.push('next');
  else badges.push('no_appt');
  if (pendingInvoices > 0) badges.push('pending');
  if (portalActive) badges.push('portal');

  return {
    patient,
    nextAppt: nextAppt ? { date: nextAppt.date, time: nextAppt.time } : null,
    pendingInvoices,
    reportsCount: rec.reports.length,
    documentsCount: rec.documents.length,
    portalActive,
    badges
  };
}

export function patientMatchesSearch(state: DemoState, patientId: string, q: string): boolean {
  if (!q.trim()) return true;
  const p = state.patients.find((x) => x.id === patientId);
  if (p && patientMatchesQuery(p, q)) return true;
  return recordMatchesPatientQuery(state, patientId, q);
}

export function filterPatientRows(rows: PatientRow[], filter: PatientFilter): PatientRow[] {
  switch (filter) {
    case 'next_appt':
      return rows.filter((r) => r.nextAppt);
    case 'pending_inv':
      return rows.filter((r) => r.pendingInvoices > 0);
    case 'no_appt':
      return rows.filter((r) => !r.nextAppt);
    case 'portal':
      return rows.filter((r) => r.portalActive);
    default:
      return rows;
  }
}

export function sortPatientRows(rows: PatientRow[], sort: PatientSort): PatientRow[] {
  const copy = [...rows];
  if (sort === 'name') {
    return copy.sort((a, b) => a.patient.fullName.localeCompare(b.patient.fullName, 'es'));
  }
  if (sort === 'pending_inv') {
    return copy.sort((a, b) => b.pendingInvoices - a.pendingInvoices);
  }
  if (sort === 'recent') {
    return copy.sort((a, b) => b.patient.createdAt.localeCompare(a.patient.createdAt));
  }
  return copy.sort((a, b) => {
    if (!a.nextAppt && !b.nextAppt) return a.patient.fullName.localeCompare(b.patient.fullName, 'es');
    if (!a.nextAppt) return 1;
    if (!b.nextAppt) return -1;
    return `${a.nextAppt.date}${a.nextAppt.time}`.localeCompare(`${b.nextAppt.date}${b.nextAppt.time}`);
  });
}

export function computePatientKpis(rows: PatientRow[]) {
  return {
    total: rows.length,
    withNext: rows.filter((r) => r.nextAppt).length,
    pendingInv: rows.reduce((s, r) => s + r.pendingInvoices, 0),
    portalActive: rows.filter((r) => r.portalActive).length
  };
}

export function searchPatientRows(state: DemoState, rows: PatientRow[], q: string): PatientRow[] {
  if (!q.trim()) return rows;
  const byPatient = findPatientsByQuery(state, q).map((p) => p.id);
  const idSet = new Set(byPatient);
  return rows.filter(
    (r) => idSet.has(r.patient.id) || patientMatchesSearch(state, r.patient.id, q)
  );
}

export function prefillPatientForBooking(patientId: string) {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('dentista:bookPatientId', patientId);
  }
}

export function consumeBookingPatientPrefill(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  const id = sessionStorage.getItem('dentista:bookPatientId');
  if (id) sessionStorage.removeItem('dentista:bookPatientId');
  return id;
}
