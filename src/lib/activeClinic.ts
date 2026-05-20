import { STORAGE_ACTIVE_CLINIC_ID } from '@/lib/storage/keys';
import type { DemoState } from '@/types/demo';
import { getPrimaryClinic } from '@/lib/clinic';

export function getActiveClinicId(state: DemoState, tenantId: string, fallbackClinicId?: string): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_ACTIVE_CLINIC_ID);
    if (stored && state.clinics.some((c) => c.id === stored && c.tenantId === tenantId)) {
      return stored;
    }
  }
  if (fallbackClinicId && state.clinics.some((c) => c.id === fallbackClinicId)) return fallbackClinicId;
  return getPrimaryClinic(state, tenantId).id;
}

export function setActiveClinicId(clinicId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_ACTIVE_CLINIC_ID, clinicId);
}
