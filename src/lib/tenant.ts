import type { DemoState, Tenant } from '@/types/demo';
import { getStoredPatientId, getStoredTenantId } from '@/lib/demoSessionStorage';

export { DEMO_TENANTS, TENANT_CENTRO, TENANT_NORTE, TENANT_SUR } from '@/lib/tenantIds';

export function tenantById(state: DemoState, tenantId: string): Tenant | undefined {
  return state.tenants.find((t) => t.id === tenantId);
}

export function tenantName(state: DemoState, tenantId: string): string {
  return tenantById(state, tenantId)?.name ?? tenantId;
}

export function clinicName(state: DemoState, clinicId: string): string {
  return state.clinics.find((c) => c.id === clinicId)?.name ?? clinicId;
}

export function dentistName(state: DemoState, dentistId: string): string {
  return state.dentists.find((d) => d.id === dentistId)?.fullName ?? dentistId;
}

/** Admin: solo registros del tenant activo */
export function forTenant<T extends { tenantId: string }>(items: T[], tenantId: string): T[] {
  return items.filter((r) => r.tenantId === tenantId);
}

/** Paciente: todos sus registros (multi-clínica) */
export function forPatient<T extends { patientId: string }>(items: T[], patientId: string): T[] {
  return items.filter((r) => r.patientId === patientId);
}

export function activeTenantId(): string {
  return getStoredTenantId();
}

export function activePatientId(): string {
  return getStoredPatientId();
}

export function adminScope(state: DemoState, tenantId = activeTenantId()) {
  return {
    tenantId,
    tenant: tenantById(state, tenantId),
    appointments: forTenant(state.appointments, tenantId),
    reports: forTenant(state.clinicalReports, tenantId),
    invoices: forTenant(state.invoices, tenantId),
    payments: forTenant(state.payments, tenantId),
    documents: forTenant(state.patientDocuments, tenantId),
    dentists: forTenant(state.dentists, tenantId),
    clinics: forTenant(state.clinics, tenantId),
    treatments: forTenant(state.treatments, tenantId),
    messages: forTenant(state.messages, tenantId),
    notes: forTenant(state.adminNotes, tenantId),
    blockedSlots: forTenant(state.blockedSlots, tenantId),
    settings: state.settingsByTenant[tenantId],
    normative: state.normativeByTenant[tenantId] ?? []
  };
}

export function patientScope(state: DemoState, patientId = activePatientId()) {
  return {
    patientId,
    appointments: forPatient(state.appointments, patientId),
    reports: forPatient(state.clinicalReports, patientId).filter((r) => r.visibleToPatient),
    invoices: forPatient(state.invoices, patientId),
    payments: forPatient(state.payments, patientId),
    documents: forPatient(state.patientDocuments, patientId).filter((d) => d.visibility === 'paciente'),
    messages: forPatient(state.messages, patientId)
  };
}

/** Pacientes visibles para agendar en una sede (ficha en la clínica o historial en esa sede). */
export function patientsForClinic(state: DemoState, clinicId: string) {
  const ids = new Set<string>();
  for (const p of state.patients) {
    if (!p.preferredClinicId || p.preferredClinicId === clinicId) ids.add(p.id);
  }
  for (const a of state.appointments) {
    if (a.clinicId === clinicId) ids.add(a.patientId);
  }
  const clinicTenant = state.clinics.find((c) => c.id === clinicId)?.tenantId;
  if (clinicTenant) {
    for (const i of state.invoices) {
      if (i.tenantId === clinicTenant) ids.add(i.patientId);
    }
  }
  if (!ids.size) return state.patients;
  return state.patients.filter((p) => ids.has(p.id));
}

/** Pacientes que tienen al menos un registro en el tenant (citas, informes, etc.) */
export function patientsForTenant(state: DemoState, tenantId: string): string[] {
  const ids = new Set<string>();
  for (const a of state.appointments) if (a.tenantId === tenantId) ids.add(a.patientId);
  for (const r of state.clinicalReports) if (r.tenantId === tenantId) ids.add(r.patientId);
  for (const i of state.invoices) if (i.tenantId === tenantId) ids.add(i.patientId);
  for (const p of state.payments) if (p.tenantId === tenantId) ids.add(p.patientId);
  for (const d of state.patientDocuments) if (d.tenantId === tenantId) ids.add(d.patientId);
  return [...ids];
}
