import type { DemoRole } from '@/types/demo';
import { isClientDemoMode } from '@/lib/appMode';
import { STORAGE_PATIENT_ID, STORAGE_TENANT_ID } from '@/lib/storage/keys';
import { clearDemoSession, getStoredRole } from '@/lib/demoStore';

export type SessionUser = {
  role: 'admin' | 'patient' | 'super_admin';
  email: string;
  name: string;
  profileId?: string;
  clinicId?: string;
  tenantId?: string;
  patientId?: string;
  mustChangePassword?: boolean;
  passwordExpired?: boolean;
};

function mapApiRole(role: string): DemoRole | null {
  if (role === 'admin') return 'admin';
  if (role === 'patient') return 'paciente';
  return null;
}

/** En LIVE ignora localStorage y usa cookie de sesión (/api/auth/me). */
export async function resolvePortalRole(): Promise<DemoRole | null> {
  if (isClientDemoMode()) {
    return getStoredRole();
  }

  clearDemoSession();

  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: SessionUser };
    return json.data?.role ? mapApiRole(json.data.role) : null;
  } catch {
    return null;
  }
}

export async function loginWithCredentials(
  role: 'admin' | 'patient',
  email: string,
  password: string
): Promise<
  | { ok: true; portalRole: DemoRole; mustChangePassword?: boolean; passwordExpired?: boolean }
  | { ok: false; message: string }
> {
  clearDemoSession();
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ role, email, password })
  });
  const json = (await res.json()) as {
    data?: SessionUser;
    error?: { message?: string };
  };
  if (!res.ok || !json.data?.role) {
    return { ok: false, message: json.error?.message ?? 'Credenciales incorrectas.' };
  }
  const portalRole = mapApiRole(json.data.role);
  if (!portalRole) {
    return { ok: false, message: 'Rol de sesión no válido.' };
  }
  if (json.data.tenantId) localStorage.setItem(STORAGE_TENANT_ID, json.data.tenantId);
  if (json.data.patientId) localStorage.setItem(STORAGE_PATIENT_ID, json.data.patientId);
  const mustChange = Boolean(json.data.mustChangePassword || json.data.passwordExpired);
  if (mustChange) {
    const q = json.data.passwordExpired ? '?expired=1' : '';
    window.location.href = `/login/cambiar-password${q}`;
    return { ok: true, portalRole, mustChangePassword: true };
  }
  return {
    ok: true,
    portalRole,
    mustChangePassword: json.data.mustChangePassword,
    passwordExpired: json.data.passwordExpired
  };
}

export async function logoutSession(): Promise<void> {
  clearDemoSession();
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}
