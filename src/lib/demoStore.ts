import { demoSeed, DEMO_PATIENT_LOGIN_ID } from '@/data/demoData';
import { createEmptyDemoState } from '@/lib/emptyState';
import { isClinicSlotTaken } from '@/lib/appointments';
import { todayIso } from '@/lib/format';
import { nextClinicId, nextTenantId } from '@/lib/ids';
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
import {
  STORAGE_EPHEMERAL,
  STORAGE_PATIENT_ID,
  STORAGE_ROLE,
  STORAGE_STATE,
  STORAGE_TENANT_ID
} from '@/lib/storage/keys';
import { nextDemoNhc } from '@/lib/nhc';
import { isClientDemoMode } from '@/lib/appMode';
import { notifyNewAppointmentRequest, pushClinicNotification } from '@/lib/clinicNotifications';
import { displayPaymentId } from '@/lib/paymentAdmin';
import { patientName } from '@/lib/selectors';
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
  Tenant,
  AdminNote
} from '@/types/demo';

export function isEphemeralSession(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_EPHEMERAL) === '1';
}

export function getInitialState(): DemoState {
  if (typeof window === 'undefined') {
    return isClientDemoMode() ? structuredClone(demoSeed) : createEmptyDemoState();
  }
  if (!isClientDemoMode()) return createEmptyDemoState();
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
  if (!isClientDemoMode()) {
    return localStorage.getItem(STORAGE_TENANT_ID) || '';
  }
  return localStorage.getItem(STORAGE_TENANT_ID) || TENANT_CENTRO;
}

export function getStoredPatientId(): string {
  if (typeof window === 'undefined') return DEMO_PATIENT_LOGIN_ID;
  if (!isClientDemoMode()) {
    return localStorage.getItem(STORAGE_PATIENT_ID) || '';
  }
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
  localStorage.removeItem(STORAGE_STATE);
}

/** En LIVE: no borra tenant/clínica activa (los fija el bootstrap tras login). */
export function clearDemoRoleHints() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_ROLE);
  localStorage.removeItem(STORAGE_PATIENT_ID);
  localStorage.removeItem(STORAGE_EPHEMERAL);
}

export function defaultAppSettings(clinicName = 'Clínica'): AppSettings {
  return {
    clinicName,
    tagline: 'Gestión dental premium',
    legalName: clinicName,
    phone: '',
    email: '',
    whatsapp: '',
    address: '',
    city: '',
    imageUrl: '/brand/dentista-logo.svg',
    generalHours: 'Lun–Vie 09:00–20:00',
    defaultDuration: 45,
    slotIntervalMinutes: 15,
    minCancelHours: 24,
    remindersEnabled: true,
    welcomeMessage: `Bienvenido a ${clinicName}`,
    appointmentConfirmMessage: 'Cita registrada correctamente.',
    primaryColor: '#2d8b7d',
    accentColor: '#2d8b7d',
    logoUrl: '/brand/clinic-shield.svg',
    website: '',
    instagram: '',
    facebook: '',
    openTime: '08:30',
    closeTime: '20:00',
    workDays: [1, 2, 3, 4, 5],
    nif: '',
    vatRate: 21,
    invoiceSeries: 'FAC',
    defaultInvoiceConcept: 'Servicios odontológicos'
  };
}

export function settingsFor(state: DemoState, tenantId = getStoredTenantId()): AppSettings {
  const hit =
    state.settingsByTenant[tenantId] ??
    Object.values(state.settingsByTenant)[0];
  return hit ?? defaultAppSettings();
}

export function clearStoredRole() {
  clearDemoSession();
}

export function setStoredPatientId(id: string) {
  localStorage.setItem(STORAGE_PATIENT_ID, id);
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
  input: Omit<Appointment, 'id' | 'createdAt' | 'tenantId'> & {
    status?: AppointmentStatus;
    tenantId?: string;
    fromPatient?: boolean;
  }
): DemoState {
  const appointment: Appointment = {
    ...input,
    tenantId: resolveTenantId(state, input.tenantId, input.clinicId),
    id: nextAppointmentId(state),
    status: input.status ?? 'pendiente',
    createdAt: todayIso()
  };
  let next: DemoState = { ...state, appointments: [...state.appointments, appointment] };
  if (appointment.status === 'pendiente') {
    next = notifyNewAppointmentRequest(next, appointment, { fromPatient: input.fromPatient });
  }
  return next;
}

export function tryCreateAppointment(
  state: DemoState,
  input: Omit<Appointment, 'id' | 'createdAt' | 'tenantId'> & {
    status?: AppointmentStatus;
    tenantId?: string;
    fromPatient?: boolean;
  }
): { state: DemoState; ok: boolean; message?: string } {
  if (isClinicSlotTaken(state, { clinicId: input.clinicId, date: input.date, time: input.time })) {
    return {
      state,
      ok: false,
      message: 'Ese horario ya está reservado en esta clínica. Elige otra hora o día.'
    };
  }
  return { state: createAppointment(state, input), ok: true };
}

export function registerOrganization(
  state: DemoState,
  input: {
    centerName: string;
    ownerName: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
  }
): { state: DemoState; tenantId: string; clinicId: string } {
  const tenantId = nextTenantId(state);
  const clinicId = nextClinicId(state);
  const centerName = input.centerName.trim();
  const tenant: Tenant = {
    id: tenantId,
    name: centerName,
    type: 'clinica',
    ownerName: input.ownerName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    active: true,
    createdAt: todayIso()
  };
  const clinic: Clinic = {
    id: clinicId,
    tenantId,
    name: centerName,
    address: input.address.trim(),
    city: input.city?.trim() || 'Madrid',
    phone: input.phone.trim(),
    email: input.email.trim(),
    whatsapp: input.phone.trim(),
    openingHours: 'Lun–Vie 09:00–20:00',
    active: true,
    isMainBranch: true,
    cabinets: [{ id: `g-${clinicId.slice(-4)}`, name: 'Gabinete 1', equipment: 'General', active: true }]
  };
  const appSettings: AppSettings = {
    clinicName: centerName,
    tagline: 'Gestión dental premium',
    legalName: `${centerName} S.L.`,
    phone: input.phone.trim(),
    email: input.email.trim(),
    whatsapp: input.phone.trim(),
    address: input.address.trim(),
    city: input.city?.trim() || 'Madrid',
    generalHours: 'Lun–Vie 09:00–20:00',
    defaultDuration: 45,
    slotIntervalMinutes: 15,
    minCancelHours: 24,
    remindersEnabled: true,
    welcomeMessage: `Bienvenido a ${centerName}`,
    appointmentConfirmMessage: 'Cita registrada correctamente.',
    primaryColor: '#0F2742',
    accentColor: '#14B8A6',
    nif: 'B00000000',
    vatRate: 21,
    invoiceSeries: 'FAC',
    defaultInvoiceConcept: 'Servicios odontológicos',
    logoUrl: '/brand/dentista-logo.svg',
    imageUrl: '/brand/dentista-logo.svg'
  };
  const normative: NormativeText[] = normativeFor(state, TENANT_CENTRO).length
    ? structuredClone(normativeFor(state, TENANT_CENTRO))
    : [];

  const next: DemoState = {
    ...state,
    tenants: [...state.tenants, tenant],
    clinics: [...state.clinics, clinic],
    settingsByTenant: { ...state.settingsByTenant, [tenantId]: appSettings },
    normativeByTenant: { ...state.normativeByTenant, [tenantId]: normative }
  };
  return { state: next, tenantId, clinicId };
}

/** Añade una sede a la organización (tenant) activa sin crear un nuevo tenant. */
export function addBranchToOrganization(
  state: DemoState,
  tenantId: string,
  input: {
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
  }
): { state: DemoState; clinicId: string } {
  const clinicId = nextClinicId(state);
  const clinic: Clinic = {
    id: clinicId,
    tenantId,
    name: input.name.trim(),
    address: input.address?.trim() ?? '',
    city: input.city?.trim() || 'Madrid',
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    whatsapp: input.phone?.trim() ?? '',
    openingHours: 'Lun–Vie 09:00–20:00',
    active: true,
    isMainBranch: false,
    cabinets: [{ id: `g-${clinicId.slice(-4)}`, name: 'Gabinete 1', equipment: 'General', active: true }]
  };
  return { state: { ...state, clinics: [...state.clinics, clinic] }, clinicId };
}

export function updateAppointmentStatus(
  state: DemoState,
  id: string,
  status: AppointmentStatus,
  patch?: Partial<
    Pick<Appointment, 'date' | 'time' | 'notes' | 'attendanceConfirmed' | 'attendanceConfirmedAt'>
  >
): DemoState {
  return {
    ...state,
    appointments: state.appointments.map((a) => (a.id === id ? { ...a, status, ...patch } : a))
  };
}

/** La administración valida que el paciente acudió; habilita justificante en portal. */
export function confirmAppointmentAttendance(state: DemoState, id: string): DemoState {
  const at = new Date().toISOString();
  return {
    ...state,
    appointments: state.appointments.map((a) => {
      if (a.id !== id) return a;
      if (a.status === 'cancelada') return a;
      return {
        ...a,
        attendanceConfirmed: true,
        attendanceConfirmedAt: at,
        status: a.status === 'completada' ? 'completada' : 'completada'
      };
    })
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

export function createPatient(state: DemoState, data: Omit<Patient, 'id' | 'createdAt' | 'nhc'>): DemoState {
  const nhc = nextDemoNhc(state, data.preferredClinicId);
  const patient: Patient = { ...data, nhc, id: nextPatientId(state), createdAt: todayIso() };
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
    createdAt: todayIso(),
    ...(data.visibleToPatient
      ? { lockedAt: new Date().toISOString(), reopenedForEdit: false }
      : {})
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

export function deleteInvoice(state: DemoState, id: string): DemoState {
  return {
    ...state,
    invoices: state.invoices.filter((i) => i.id !== id)
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
  let next = savePayment(state, payment);
  const name = patientName(next, payment.patientId);
  if (payment.status === 'fallido') {
    next = pushClinicNotification(next, {
      category: 'pagos',
      title: 'Pago fallido',
      description: `El pago de ${name} ha fallado.`,
      patientId: payment.patientId,
      entityType: 'payment',
      entityId: payment.id,
      priority: 'urgente'
    });
  } else if (payment.status === 'completado') {
    next = pushClinicNotification(next, {
      category: 'pagos',
      title: 'Pago registrado',
      description: `Pago de ${payment.amount.toFixed(2).replace('.', ',')} € registrado para ${name}.`,
      patientId: payment.patientId,
      entityType: 'payment',
      entityId: payment.id,
      priority: 'normal'
    });
    if (payment.invoiceId) {
      next = pushClinicNotification(next, {
        category: 'facturas',
        title: 'Factura marcada como pagada',
        description: `Factura vinculada al pago ${displayPaymentId(payment)} marcada como pagada.`,
        patientId: payment.patientId,
        entityType: 'invoice',
        entityId: payment.invoiceId,
        read: true
      });
    }
  } else {
    next = pushClinicNotification(next, {
      category: 'pagos',
      title: 'Pago pendiente',
      description: `Pago ${displayPaymentId(payment)} de ${name} pendiente.`,
      patientId: payment.patientId,
      entityType: 'payment',
      entityId: payment.id,
      priority: 'importante'
    });
  }
  return next;
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

export function deletePatientDocument(state: DemoState, id: string): DemoState {
  return {
    ...state,
    patientDocuments: state.patientDocuments.filter((d) => d.id !== id)
  };
}

export function createPatientDocument(
  state: DemoState,
  data: Omit<PatientDocument, 'id' | 'createdAt' | 'tenantId'> & { tenantId?: string; createdAt?: string }
): DemoState {
  const doc: PatientDocument = {
    ...data,
    tenantId: data.tenantId ?? getStoredTenantId(),
    id: nextDocumentId(state),
    createdAt: data.createdAt ?? todayIso()
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

/** Crea un bloqueo de agenda (todos los dentistas, uno o varios en un mismo registro). */
export function saveScheduleBlock(
  state: DemoState,
  input: {
    clinicId: string;
    cabinetId: string;
    date: string;
    time: string;
    endTime?: string;
    reason: string;
    notes?: string;
    appliesToAll?: boolean;
    dentistIds?: string[];
    tenantId?: string;
  }
): DemoState {
  const tenantId = input.tenantId ?? resolveTenantId(state, input.tenantId, input.clinicId);
  const ids = input.appliesToAll ? [] : [...new Set(input.dentistIds ?? [])];
  const primaryDentist = ids[0] ?? state.dentists[0]?.id ?? '';
  return addBlockedSlot(state, {
    tenantId,
    clinicId: input.clinicId,
    cabinetId: input.cabinetId,
    date: input.date,
    time: input.time,
    endTime: input.endTime,
    reason: input.reason,
    notes: input.notes,
    appliesToAll: Boolean(input.appliesToAll),
    dentistId: input.appliesToAll ? primaryDentist : primaryDentist,
    dentistIds: input.appliesToAll ? undefined : ids.length > 1 ? ids : ids.length === 1 ? ids : undefined
  });
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

export function effectiveConsentStatus(
  consent: import('@/types/demo').InformedConsent,
  today = todayIso()
): 'pendiente' | 'firmado' | 'caducado' {
  if (consent.status === 'firmado') return 'firmado';
  if (consent.expiresAt && consent.expiresAt < today) return 'caducado';
  return 'pendiente';
}

export function signInformedConsent(
  state: DemoState,
  id: string,
  signatureRef: string,
  fileRef?: string,
  fileName?: string,
  opts?: { signatureMethod?: import('@/types/demo').ConsentSignatureMethod; signedCopyRef?: string }
): DemoState {
  const c = state.informedConsents.find((x) => x.id === id);
  if (!c) return state;
  return saveInformedConsent(state, {
    ...c,
    status: 'firmado',
    signatureRef,
    signatureMethod: opts?.signatureMethod,
    signedCopyRef: opts?.signedCopyRef ?? fileRef ?? c.fileRef ?? signatureRef,
    fileRef: fileRef ?? c.fileRef,
    fileName: fileName ?? c.fileName,
    signedAt: new Date().toISOString()
  });
}

export function pendingConsentsForPatient(state: DemoState, patientId: string) {
  return state.informedConsents.filter(
    (c) =>
      c.patientId === patientId &&
      c.requiredForPortal &&
      effectiveConsentStatus(c) === 'pendiente'
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
