import type { DemoState } from '@/types/demo';

const OVERLAY_KEY = 'df_patient_portal_overlay';

type PatientOverlay = {
  patientId: string;
  updatedAt: string;
  appointments: DemoState['appointments'];
  messages: DemoState['messages'];
  payments: DemoState['payments'];
  invoices: DemoState['invoices'];
  patientDocuments: DemoState['patientDocuments'];
  clinicalReports: DemoState['clinicalReports'];
  informedConsents: DemoState['informedConsents'];
  patients: DemoState['patients'];
};

function isPatientPortalPath(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/paciente');
}

function mergeById<T extends { id: string }>(base: T[], patch: T[]): T[] {
  const map = new Map(base.map((x) => [x.id, x]));
  for (const item of patch) map.set(item.id, item);
  return [...map.values()];
}

export function extractPatientOverlay(state: DemoState, patientId: string): Omit<PatientOverlay, 'patientId' | 'updatedAt'> {
  return {
    appointments: state.appointments.filter((a) => a.patientId === patientId),
    messages: state.messages.filter((m) => m.patientId === patientId),
    payments: state.payments.filter((p) => p.patientId === patientId),
    invoices: state.invoices.filter((i) => i.patientId === patientId),
    patientDocuments: state.patientDocuments.filter((d) => d.patientId === patientId),
    clinicalReports: state.clinicalReports.filter((r) => r.patientId === patientId),
    informedConsents: state.informedConsents.filter((c) => c.patientId === patientId),
    patients: state.patients.filter((p) => p.id === patientId)
  };
}

/** Fusiona datos del paciente: servidor + cambios locales (el patch gana por id, sin borrar filas nuevas del servidor). */
function mergePatientSlice<T extends { id: string }>(
  baseAll: T[],
  patch: T[],
  belongsToPatient: (item: T) => boolean
): T[] {
  const others = baseAll.filter((x) => !belongsToPatient(x));
  const baseMine = baseAll.filter(belongsToPatient);
  return [...others, ...mergeById(baseMine, patch)];
}

export function mergePatientOverlay(base: DemoState, overlay: PatientOverlay): DemoState {
  const pid = overlay.patientId;
  const isPat = <T extends { patientId: string }>(x: T) => x.patientId === pid;
  const isPatDoc = (d: DemoState['patientDocuments'][0]) => d.patientId === pid;
  const isPatSelf = (p: DemoState['patients'][0]) => p.id === pid;

  return {
    ...base,
    appointments: mergePatientSlice(base.appointments, overlay.appointments, isPat),
    messages: mergePatientSlice(base.messages, overlay.messages, isPat),
    payments: mergePatientSlice(base.payments, overlay.payments, isPat),
    invoices: mergePatientSlice(base.invoices, overlay.invoices, isPat),
    patientDocuments: mergePatientSlice(base.patientDocuments, overlay.patientDocuments, isPatDoc),
    clinicalReports: mergePatientSlice(base.clinicalReports, overlay.clinicalReports, isPat),
    informedConsents: mergePatientSlice(base.informedConsents, overlay.informedConsents, isPat),
    patients: mergePatientSlice(base.patients, overlay.patients, isPatSelf)
  };
}

export function savePatientPortalOverlay(state: DemoState, patientId: string) {
  if (!isPatientPortalPath() || typeof window === 'undefined') return;
  try {
    const slice = extractPatientOverlay(state, patientId);
    const payload: PatientOverlay = {
      patientId,
      updatedAt: new Date().toISOString(),
      ...slice
    };
    localStorage.setItem(OVERLAY_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function loadPatientPortalOverlay(patientId: string): PatientOverlay | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(OVERLAY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PatientOverlay;
    if (parsed.patientId !== patientId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function applyPatientPortalOverlay(base: DemoState, patientId: string): DemoState {
  const overlay = loadPatientPortalOverlay(patientId);
  if (!overlay) return base;
  return mergePatientOverlay(base, overlay);
}
