import type { DemoState } from '@/types/demo';
import { getStoredTenantId, settingsFor } from '@/lib/demoStore';
import { tenantById, tenantName } from '@/lib/tenant';

const STAFF_KEY = 'dentista_staff_by_tenant';

export type StaffProfile = {
  fullName: string;
  role: 'admin' | 'recepcion';
  updatedAt: string;
};

function readStaffMap(): Record<string, StaffProfile> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STAFF_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StaffProfile>) : {};
  } catch {
    return {};
  }
}

function writeStaffMap(map: Record<string, StaffProfile>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STAFF_KEY, JSON.stringify(map));
}

export function getStaffProfile(tenantId = getStoredTenantId()): StaffProfile | null {
  return readStaffMap()[tenantId] ?? null;
}

export function saveStaffProfile(tenantId: string, profile: Omit<StaffProfile, 'updatedAt'>) {
  const map = readStaffMap();
  map[tenantId] = { ...profile, updatedAt: new Date().toISOString() };
  writeStaffMap(map);
}

export function organizationDisplayName(state: DemoState, tenantId = getStoredTenantId()): string {
  const settings = settingsFor(state, tenantId);
  if (settings?.clinicName?.trim()) return settings.clinicName.trim();
  return tenantName(state, tenantId);
}

export function organizationSubtitle(state: DemoState, tenantId = getStoredTenantId()): string {
  const tenant = tenantById(state, tenantId);
  const staff = getStaffProfile(tenantId);
  const parts: string[] = [];
  if (staff?.fullName) parts.push(staff.fullName);
  if (tenant?.ownerName && tenant.ownerName !== staff?.fullName) parts.push(tenant.ownerName);
  return parts.join(' · ') || 'Equipo clínica';
}
