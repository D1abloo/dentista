import { DEMO_PATIENT_ID } from '@/data/demoSeedRecords'
import { isClientDemoMode } from '@/lib/appMode'
import {
  STORAGE_EPHEMERAL,
  STORAGE_PATIENT_ID,
  STORAGE_ROLE,
  STORAGE_TENANT_ID
} from '@/lib/storage/keys'
import { TENANT_CENTRO } from '@/lib/tenantIds'
import type { DemoRole } from '@/types/demo'

export const DEMO_PATIENT_LOGIN_ID = DEMO_PATIENT_ID

export function isEphemeralSession(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_EPHEMERAL) === '1'
}

export function getStoredRole(): DemoRole | null {
  if (typeof window === 'undefined') return null
  if (!isClientDemoMode()) return null
  const role = localStorage.getItem(STORAGE_ROLE)
  return role === 'admin' || role === 'paciente' ? role : null
}

export function getStoredTenantId(): string {
  if (typeof window === 'undefined') return TENANT_CENTRO
  if (!isClientDemoMode()) {
    return localStorage.getItem(STORAGE_TENANT_ID) || ''
  }
  return localStorage.getItem(STORAGE_TENANT_ID) || TENANT_CENTRO
}

export function getStoredPatientId(): string {
  if (typeof window === 'undefined') return DEMO_PATIENT_LOGIN_ID
  if (!isClientDemoMode()) {
    return localStorage.getItem(STORAGE_PATIENT_ID) || ''
  }
  if (getStoredRole() !== 'paciente') return DEMO_PATIENT_LOGIN_ID
  return localStorage.getItem(STORAGE_PATIENT_ID) || DEMO_PATIENT_LOGIN_ID
}
