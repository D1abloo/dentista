import type { DemoState } from '@/types/demo';

type IdPrefix = 'PAT' | 'CIT' | 'INF' | 'FAC' | 'PAG' | 'DOC' | 'MSG' | 'NOT' | 'TEN' | 'DEN' | 'CLI' | 'TRA' | 'CON';

export function nextId(prefix: IdPrefix, existingIds: string[]) {
  const nums = existingIds
    .filter((id) => id.startsWith(`${prefix}-`))
    .map((id) => parseInt(id.split('-')[1] ?? '0', 10))
    .filter((n) => !Number.isNaN(n));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(n).padStart(4, '0')}`;
}

export function nextPatientId(state: DemoState) {
  return nextId('PAT', state.patients.map((p) => p.id));
}

export function nextAppointmentId(state: DemoState) {
  return nextId('CIT', state.appointments.map((a) => a.id));
}

export function nextReportId(state: DemoState) {
  return nextId('INF', state.clinicalReports.map((r) => r.id));
}

export function nextInvoiceId(state: DemoState) {
  const year = new Date().getFullYear();
  const prefix = `FAC-${year}-`;
  const nums = state.invoices
    .map((i) => {
      if (i.id.startsWith(prefix)) return parseInt(i.id.slice(prefix.length), 10);
      const legacy = i.id.match(/^FAC-(\d+)$/);
      return legacy ? parseInt(legacy[1], 10) : 0;
    })
    .filter((n) => !Number.isNaN(n));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(n).padStart(4, '0')}`;
}

export function nextPaymentId(state: DemoState) {
  return nextId('PAG', state.payments.map((p) => p.id));
}

export function nextDocumentId(state: DemoState) {
  return nextId('DOC', state.patientDocuments.map((d) => d.id));
}

export function nextConsentId(state: DemoState) {
  return nextId('CON', state.informedConsents.map((c) => c.id));
}

export function nextDentistId(state: DemoState) {
  return nextId('DEN', state.dentists.map((d) => d.id));
}

export function nextTreatmentId(state: DemoState) {
  return nextId('TRA', state.treatments.map((t) => t.id));
}

export function nextTenantId(state: DemoState) {
  return nextId('TEN', state.tenants.map((t) => t.id));
}

export function nextClinicId(state: DemoState) {
  return nextId('CLI', state.clinics.map((c) => c.id));
}
