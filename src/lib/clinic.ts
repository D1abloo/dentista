import type { Clinic, DemoState, Dentist } from '@/types/demo';
import { TENANT_CENTRO } from '@/lib/tenantIds';

export const PRIMARY_CLINIC_ID = 'CLI-0001';

export function getPrimaryClinic(state: DemoState, tenantId = TENANT_CENTRO): Clinic {
  const hit =
    state.clinics.find((c) => c.tenantId === tenantId && c.isMainBranch) ??
    state.clinics.find((c) => c.tenantId === tenantId && c.active) ??
    state.clinics.find((c) => c.tenantId === tenantId) ??
    state.clinics[0];
  if (hit) return hit;
  return {
    id: '',
    tenantId: tenantId || '',
    name: 'Clínica',
    address: '',
    city: '',
    phone: '',
    email: '',
    whatsapp: '',
    openingHours: '',
    active: true,
    isMainBranch: true,
    cabinets: []
  };
}

export function clinicTenantId(state: DemoState, clinicId: string): string {
  return state.clinics.find((c) => c.id === clinicId)?.tenantId ?? TENANT_CENTRO;
}

export function dentistsForClinic(state: DemoState, clinicId: string) {
  const clinic = state.clinics.find((c) => c.id === clinicId);
  if (!clinic) return [];
  return state.dentists.filter((d) => d.tenantId === clinic.tenantId && d.active);
}

export function treatmentsForClinic(state: DemoState, clinicId: string) {
  const tenantId = clinicTenantId(state, clinicId);
  return state.treatments.filter((t) => t.tenantId === tenantId && t.active);
}

export function appointmentsForClinic(state: DemoState, clinicId: string) {
  return state.appointments.filter((a) => a.clinicId === clinicId);
}
