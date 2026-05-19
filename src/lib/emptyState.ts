import type { DemoState } from '@/types/demo';

/** Estado vacío para producción (sin datos demo ni seed). */
export function createEmptyDemoState(): DemoState {
  return {
    tenants: [],
    patients: [],
    dentists: [],
    clinics: [],
    treatments: [],
    appointments: [],
    clinicalReports: [],
    invoices: [],
    payments: [],
    patientDocuments: [],
    adminNotes: [],
    messages: [],
    settingsByTenant: {},
    normativeByTenant: {},
    blockedSlots: [],
    informedConsents: []
  };
}
