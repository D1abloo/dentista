import { demoSeed, DEMO_PATIENT_LOGIN_ID } from '@/data/demoData';
import { todayIso } from '@/lib/format';
import {
  nextAppointmentId,
  nextConsentId,
  nextDocumentId,
  nextDentistId,
  nextInvoiceId,
  nextPatientId,
  nextPaymentId,
  nextReportId,
  nextTreatmentId
} from '@/lib/ids';
import { loadPersistedState, resetPersistedState, savePersistedState } from '@/lib/storage/persist';
import { STORAGE_EPHEMERAL, STORAGE_PATIENT_ID, STORAGE_ROLE, STORAGE_TENANT_ID } from '@/lib/storage/keys';
import { isClientDemoMode } from '@/lib/appMode';
import { TENANT_CENTRO } from '@/lib/tenantIds';
import type {
  Appointment,
  AppointmentStatus,
  AppSettings,
  BlockedSlot,
  Cabinet,
  ClinicalReport,
  Clinic,
  DemoRole,
  DemoSession,
  DemoState,
  Dentist,
  Invoice,
  Message,
  NormativeText,
  Patient,
  PatientDocument,
  Payment,
  Treatment,
  AdminNote
} from '@/types/demo';

export function isEphemeralSession(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_EPHEMERAL) === '1';
}

export function getInitialState(): DemoState {
  if (typeof window === 'undefined') return structuredClone(demoSeed);
  if (!isClientDemoMode()) return structuredClone(demoSeed);
  if (isEphemeralSession()) return structuredClone(demoSeed);
  const loaded = loadPersistedState();
  if (!loaded?.tenants?.length) return structuredClone(demoSeed);
  return loaded;
}

export function persistState(state: DemoState) {
  if (!isClientDemoMode()) return;
  if (isEphemeralSession()) return;
  savePersistedState(state);
}

export function resetState(): DemoState {
  return resetPersistedState();
}

export function getStoredRole(): DemoRole | null {
  if (typeof window === 'undefined') return null;
  if (!isClientDemoMode()) return null;
  const role = localStorage.getItem(STORAGE_ROLE);
  return role === 'admin' || role === 'paciente' ? role : null;
}

export function getStoredTenantId(): string {
  if (typeof window === 'undefined') return TENANT_CENTRO;
  return localStorage.getItem(STORAGE_TENANT_ID) || TENANT_CENTRO;
}

export function getStoredPatientId(): string {
  if (typeof window === 'undefined') return DEMO_PATIENT_LOGIN_ID;
  if (getStoredRole() !== 'paciente') return DEMO_PATIENT_LOGIN_ID;
  return localStorage.getItem(STORAGE_PATIENT_ID) || DEMO_PATIENT_LOGIN_ID;
}

export function setDemoSession(session: DemoSession) {
  if (!isClientDemoMode()) return;
  localStorage.setItem(STORAGE_ROLE, session.role);
  if (session.patientId) localStorage.setItem(STORAGE_PATIENT_ID, session.patientId);
  if (session.tenantId) localStorage.setItem(STORAGE_TENANT_ID, session.tenantId);
  if (session.role === 'paciente') {
    localStorage.removeItem(STORAGE_TENANT_ID);
  }
  if (session.role === 'admin') {
    localStorage.removeItem(STORAGE_PATIENT_ID);
  }
  if (session.ephemeral) localStorage.setItem(STORAGE_EPHEMERAL, '1');
  else localStorage.removeItem(STORAGE_EPHEMERAL);
}

export function setStoredRole(role: DemoRole, tenantId?: string) {
  setDemoSession({
    role,
    patientId: role === 'paciente' ? DEMO_PATIENT_LOGIN_ID : undefined,
    tenantId: role === 'admin' ? tenantId ?? TENANT_CENTRO : undefined
  });
}

/** Cierra sesión demo por completo (rol, tenant, paciente, modo efímero). */
export function clearDemoSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_ROLE);
  localStorage.removeItem(STORAGE_PATIENT_ID);
  localStorage.removeItem(STORAGE_TENANT_ID);
  localStorage.removeItem(STORAGE_EPHEMERAL);
}

export function clearStoredRole() {
  clearDemoSession();
}

export function setStoredPatientId(id: string) {
  localStorage.setItem(STORAGE_PATIENT_ID, id);
}

export function settingsFor(state: DemoState, tenantId = getStoredTenantId()): AppSettings {
  return state.settingsByTenant[tenantId] ?? Object.values(state.settingsByTenant)[0];
}

export function normativeFor(state: DemoState, tenantId = getStoredTenantId()): NormativeText[] {
  return state.normativeByTenant[tenantId] ?? [];
}

function resolveTenantId(state: DemoState, tenantId?: string, clinicId?: string) {
  if (tenantId) return tenantId;
  if (clinicId) return state.clinics.find((c) => c.id === clinicId)?.tenantId ?? getStoredTenantId();
  return getStoredTenantId();
}

export function createAppointment(
  state: DemoState,
  input: Omit<Appointment, 'id' | 'createdAt' | 'tenantId'> & { status?: AppointmentStatus; tenantId?: string }
): DemoState {
  const appointment: Appointment = {
    ...input,
    tenantId: resolveTenantId(state, input.tenantId, input.clinicId),
    id: nextAppointmentId(state),
    status: input.status ?? 'pendiente',
    createdAt: todayIso()
  };
  return { ...state, appointments: [...state.appointments, appointment] };
}

export function updateAppointmentStatus(
  state: DemoState,
  id: string,
  status: AppointmentStatus,
  patch?: Partial<Pick<Appointment, 'date' | 'time' | 'notes'>>
): DemoState {
  return {
    ...state,
    appointments: state.appointments.map((a) => (a.id === id ? { ...a, status, ...patch } : a))
  };
}

export function updateAppointment(state: DemoState, appointment: Appointment): DemoState {
  return {
    ...state,
    appointments: state.appointments.map((a) => (a.id === appointment.id ? appointment : a))
  };
}

export function deleteAppointment(state: DemoState, id: string): DemoState {
  return { ...state, appointments: state.appointments.filter((a) => a.id !== id) };
}

export function rescheduleAppointment(state: DemoState, id: string, date: string, time: string): DemoState {
  return updateAppointmentStatus(state, id, 'reprogramada', { date, time });
}

export function savePatient(state: DemoState, patient: Patient): DemoState {
  const exists = state.patients.some((p) => p.id === patient.id);
  return {
    ...state,
    patients: exists ? state.patients.map((p) => (p.id === patient.id ? patient : p)) : [...state.patients, patient]
  };
}

export function createPatient(state: DemoState, data: Omit<Patient, 'id' | 'createdAt'>): DemoState {
  const patient: Patient = { ...data, id: nextPatientId(state), createdAt: todayIso() };
  return savePatient(state, patient);
}

export function saveClinicalReport(state: DemoState, report: ClinicalReport): DemoState {
  const exists = state.clinicalReports.some((r) => r.id === report.id);
  return {
    ...state,
    clinicalReports: exists
      ? state.clinicalReports.map((r) => (r.id === report.id ? report : r))
      : [...state.clinicalReports, report]
  };
}

export function createClinicalReport(
  state: DemoState,
  data: Omit<ClinicalReport, 'id' | 'createdAt' | 'tenantId'> & { tenantId?: string }
): DemoState {
  const report: ClinicalReport = {
    ...data,
    tenantId: data.tenantId ?? getStoredTenantId(),
    id: nextReportId(state),
    createdAt: todayIso()
  };
  return saveClinicalReport(state, report);
}

export function saveInvoice(state: DemoState, invoice: Invoice): DemoState {
  const exists = state.invoices.some((i) => i.id === invoice.id);
  return {
    ...state,
    invoices: exists ? state.invoices.map((i) => (i.id === invoice.id ? invoice : i)) : [...state.invoices, invoice]
  };
}

export function createInvoice(
  state: DemoState,
  data: Omit<Invoice, 'id' | 'tenantId'> & { id?: string; tenantId?: string }
): DemoState {
  const { id: presetId, ...rest } = data;
  const invoice: Invoice = {
    ...rest,
    tenantId: rest.tenantId ?? getStoredTenantId(),
    id: presetId ?? nextInvoiceId(state)
  };
  return saveInvoice(state, invoice);
}

export function savePayment(state: DemoState, payment: Payment): DemoState {
  let next = state;
  const exists = state.payments.some((p) => p.id === payment.id);
  next = {
    ...next,
    payments: exists ? next.payments.map((p) => (p.id === payment.id ? payment : p)) : [...next.payments, payment]
  };
  if (payment.invoiceId && payment.status === 'completado') {
    next = {
      ...next,
      invoices: next.invoices.map((i) =>
        i.id === payment.invoiceId ? { ...i, status: 'pagada' as const } : i
      )
    };
  }
  return next;
}

export function createPayment(
  state: DemoState,
  data: Omit<Payment, 'id' | 'createdAt' | 'tenantId'> & { tenantId?: string }
): DemoState {
  const payment: Payment = {
    ...data,
    tenantId: data.tenantId ?? getStoredTenantId(),
    id: nextPaymentId(state),
    createdAt: todayIso()
  };
  return savePayment(state, payment);
}

export function savePatientDocument(state: DemoState, doc: PatientDocument): DemoState {
  const exists = state.patientDocuments.some((d) => d.id === doc.id);
  return {
    ...state,
    patientDocuments: exists
      ? state.patientDocuments.map((d) => (d.id === doc.id ? doc : d))
      : [...state.patientDocuments, doc]
  };
}

export function createPatientDocument(
  state: DemoState,
  data: Omit<PatientDocument, 'id' | 'createdAt' | 'tenantId'> & { tenantId?: string }
): DemoState {
  const doc: PatientDocument = {
    ...data,
    tenantId: data.tenantId ?? getStoredTenantId(),
    id: nextDocumentId(state),
    createdAt: todayIso()
  };
  return savePatientDocument(state, doc);
}

export function addAdminNote(
  state: DemoState,
  note: Omit<AdminNote, 'id' | 'tenantId'> & { id?: string; tenantId?: string }
): DemoState {
  const full: AdminNote = { ...note, tenantId: note.tenantId ?? getStoredTenantId(), id: note.id ?? `NOT-${Date.now()}` };
  return { ...state, adminNotes: [...state.adminNotes, full] };
}

export function createDentist(state: DemoState, data: Omit<Dentist, 'id'>): DemoState {
  const dentist: Dentist = { ...data, id: nextDentistId(state) };
  return saveDentist(state, dentist);
}

export function saveDentist(state: DemoState, dentist: Dentist): DemoState {
  const exists = state.dentists.some((d) => d.id === dentist.id);
  return {
    ...state,
    dentists: exists ? state.dentists.map((d) => (d.id === dentist.id ? dentist : d)) : [...state.dentists, dentist]
  };
}

export function createTreatment(state: DemoState, data: Omit<Treatment, 'id'>): DemoState {
  const treatment: Treatment = { ...data, id: nextTreatmentId(state) };
  return saveTreatment(state, treatment);
}

export function saveTreatment(state: DemoState, treatment: Treatment): DemoState {
  const exists = state.treatments.some((t) => t.id === treatment.id);
  return {
    ...state,
    treatments: exists
      ? state.treatments.map((t) => (t.id === treatment.id ? treatment : t))
      : [...state.treatments, treatment]
  };
}

export function saveClinic(state: DemoState, clinic: Clinic): DemoState {
  return { ...state, clinics: state.clinics.map((c) => (c.id === clinic.id ? clinic : c)) };
}

export function saveCabinet(state: DemoState, clinicId: string, cabinet: Cabinet): DemoState {
  return {
    ...state,
    clinics: state.clinics.map((c) => {
      if (c.id !== clinicId) return c;
      const exists = c.cabinets.some((g) => g.id === cabinet.id);
      return {
        ...c,
        cabinets: exists ? c.cabinets.map((g) => (g.id === cabinet.id ? cabinet : g)) : [...c.cabinets, cabinet]
      };
    })
  };
}

export function saveMessage(state: DemoState, message: Message): DemoState {
  return {
    ...state,
    messages: state.messages.map((m) => (m.id === message.id ? message : m))
  };
}

export function addMessage(state: DemoState, message: Omit<Message, 'id' | 'tenantId'> & { tenantId?: string }): DemoState {
  return {
    ...state,
    messages: [{ ...message, tenantId: message.tenantId ?? getStoredTenantId(), id: `MSG-${Date.now()}` }, ...state.messages]
  };
}

export function saveNormative(state: DemoState, tenantId: string, text: NormativeText): DemoState {
  const list = state.normativeByTenant[tenantId] ?? [];
  return {
    ...state,
    normativeByTenant: {
      ...state.normativeByTenant,
      [tenantId]: list.map((n) => (n.id === text.id ? text : n))
    }
  };
}

export function saveSettings(state: DemoState, tenantId: string, settings: AppSettings): DemoState {
  return {
    ...state,
    settingsByTenant: { ...state.settingsByTenant, [tenantId]: settings }
  };
}

export function addBlockedSlot(
  state: DemoState,
  slot: Omit<BlockedSlot, 'id' | 'tenantId'> & { tenantId?: string }
): DemoState {
  return {
    ...state,
    blockedSlots: [
      ...state.blockedSlots,
      { ...slot, tenantId: slot.tenantId ?? resolveTenantId(state, slot.tenantId, slot.clinicId), id: `BLK-${Date.now()}` }
    ]
  };
}

export function removeBlockedSlot(state: DemoState, id: string): DemoState {
  return { ...state, blockedSlots: state.blockedSlots.filter((b) => b.id !== id) };
}

export function saveInformedConsent(state: DemoState, consent: import('@/types/demo').InformedConsent): DemoState {
  const exists = state.informedConsents.some((c) => c.id === consent.id);
  return {
    ...state,
    informedConsents: exists
      ? state.informedConsents.map((c) => (c.id === consent.id ? consent : c))
      : [...state.informedConsents, consent]
  };
}

export function createInformedConsent(
  state: DemoState,
  data: Omit<import('@/types/demo').InformedConsent, 'id' | 'createdAt' | 'tenantId' | 'status'> & {
    tenantId?: string;
    status?: import('@/types/demo').ConsentStatus;
  }
): DemoState {
  const consent: import('@/types/demo').InformedConsent = {
    ...data,
    tenantId: data.tenantId ?? getStoredTenantId(),
    status: data.status ?? 'pendiente',
    id: nextConsentId(state),
    createdAt: todayIso()
  };
  return saveInformedConsent(state, consent);
}

export function signInformedConsent(
  state: DemoState,
  id: string,
  signatureRef: string,
  fileRef?: string,
  fileName?: string
): DemoState {
  const c = state.informedConsents.find((x) => x.id === id);
  if (!c) return state;
  return saveInformedConsent(state, {
    ...c,
    status: 'firmado',
    signatureRef,
    fileRef: fileRef ?? c.fileRef,
    fileName: fileName ?? c.fileName,
    signedAt: new Date().toISOString()
  });
}

export function pendingConsentsForPatient(state: DemoState, patientId: string) {
  return state.informedConsents.filter(
    (c) => c.patientId === patientId && c.requiredForPortal && c.status === 'pendiente'
  );
}

export function exportCsv(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length || typeof window === 'undefined') return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadDemoFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
