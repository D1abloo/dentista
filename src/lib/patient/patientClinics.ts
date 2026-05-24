import type { DemoState, Message, Patient } from '@/types/demo';

export type PatientClinicOption = {
  id: string;
  name: string;
  city?: string;
  tenantId: string;
  isPrimary: boolean;
};

function addClinicId(ids: Set<string>, clinicId?: string) {
  if (clinicId) ids.add(clinicId);
}

function clinicIdsFromTenant(state: DemoState, tenantId: string): string[] {
  return state.clinics.filter((c) => c.active && c.tenantId === tenantId).map((c) => c.id);
}

/** Clínicas con las que el paciente tiene relación (citas, facturas, mensajes, sede principal). */
export function clinicsLinkedToPatient(state: DemoState, patient: Patient): PatientClinicOption[] {
  const ids = new Set<string>();
  addClinicId(ids, patient.preferredClinicId);

  const pid = patient.id;
  for (const a of state.appointments) {
    if (a.patientId === pid) addClinicId(ids, a.clinicId);
  }
  for (const inv of state.invoices) {
    if (inv.patientId === pid) {
      for (const cid of clinicIdsFromTenant(state, inv.tenantId)) ids.add(cid);
    }
  }
  for (const pay of state.payments) {
    if (pay.patientId === pid) {
      for (const cid of clinicIdsFromTenant(state, pay.tenantId)) ids.add(cid);
    }
  }
  for (const r of state.clinicalReports) {
    if (r.patientId === pid) {
      for (const cid of clinicIdsFromTenant(state, r.tenantId)) ids.add(cid);
    }
  }
  for (const d of state.patientDocuments) {
    if (d.patientId === pid) {
      for (const cid of clinicIdsFromTenant(state, d.tenantId)) ids.add(cid);
    }
  }
  for (const m of state.messages) {
    if (m.patientId === pid) {
      for (const cid of clinicIdsFromTenant(state, m.tenantId)) ids.add(cid);
    }
  }

  const options: PatientClinicOption[] = [];
  for (const id of ids) {
    const c = state.clinics.find((x) => x.id === id && x.active);
    if (!c) continue;
    options.push({
      id: c.id,
      name: c.name,
      city: c.city,
      tenantId: c.tenantId,
      isPrimary: id === patient.preferredClinicId
    });
  }

  if (!options.length) {
    const fallback =
      (patient.preferredClinicId
        ? state.clinics.find((c) => c.id === patient.preferredClinicId && c.active)
        : undefined) ?? state.clinics.find((c) => c.active);
    if (fallback) {
      options.push({
        id: fallback.id,
        name: fallback.name,
        city: fallback.city,
        tenantId: fallback.tenantId,
        isPrimary: true
      });
    }
  }

  return options.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.name.localeCompare(b.name, 'es');
  });
}

export function clinicIdForMessage(
  state: DemoState,
  message: Message,
  patient?: Pick<Patient, 'preferredClinicId'>
): string | undefined {
  if (message.appointmentId) {
    const appt = state.appointments.find((a) => a.id === message.appointmentId);
    if (appt?.clinicId) return appt.clinicId;
  }
  if (message.invoiceId) {
    const inv = state.invoices.find((i) => i.id === message.invoiceId);
    if (inv?.appointmentId) {
      const appt = state.appointments.find((a) => a.id === inv.appointmentId);
      if (appt?.clinicId) return appt.clinicId;
    }
    if (inv) {
      const matches = state.clinics.filter((c) => c.active && c.tenantId === inv.tenantId);
      if (matches.length === 1) return matches[0].id;
    }
  }
  const matches = state.clinics.filter((c) => c.active && c.tenantId === message.tenantId);
  if (matches.length === 1) return matches[0].id;
  const pref = patient?.preferredClinicId;
  if (pref && matches.some((c) => c.id === pref)) return pref;
  return matches[0]?.id;
}

export function messageBelongsToClinic(state: DemoState, message: Message, clinicId: string): boolean {
  const clinic = state.clinics.find((c) => c.id === clinicId);
  if (!clinic || message.tenantId !== clinic.tenantId) return false;
  const resolved = clinicIdForMessage(state, message);
  if (resolved) return resolved === clinicId;
  return true;
}

export function clinicLabel(option: PatientClinicOption): string {
  return option.city ? `${option.name} · ${option.city}` : option.name;
}
