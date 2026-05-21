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
  platformInspect?: boolean;
  inspectMode?: 'clinic_admin' | 'patient_portal';
  inspectAccessRole?: string;
};

function mapApiRole(role: string): DemoRole | null {
  if (role === 'admin') return 'admin';
  if (role === 'patient') return 'paciente';
  if (role === 'super_admin') return 'admin';
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

function redirectAfterLogin(user: SessionUser): string {
  if (user.role === 'super_admin') return '/platform';
  if (user.role === 'patient') return '/paciente';
  return '/admin';
}

export async function loginWithCredentials(
  role: 'admin' | 'patient',
  email: string,
  password: string
): Promise<
  | { ok: true; portalRole: DemoRole; mustChangePassword?: boolean; passwordExpired?: boolean }
  | { ok: false; message: string }
> {
  return loginUnified(email, password, role);
}

/** Formulario único: detecta automáticamente paciente, personal o plataforma. */
export async function loginUnified(
  email: string,
  password: string,
  forcedRole?: 'admin' | 'patient'
): Promise<
  | { ok: true; portalRole: DemoRole; mustChangePassword?: boolean; passwordExpired?: boolean }
  | { ok: false; message: string }
> {
  clearDemoSession();
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      role: forcedRole ?? 'auto',
      email,
      password
    })
  });
  const json = (await res.json()) as {
    data?: SessionUser;
    error?: { message?: string };
  };
  if (!res.ok || !json.data?.role) {
    return { ok: false, message: json.error?.message ?? 'Credenciales incorrectas.' };
  }
  const user = json.data;
  if (forcedRole) {
    const portalRole = mapApiRole(user.role);
    if (!portalRole || portalRole !== forcedRole) {
      return { ok: false, message: 'Este acceso no corresponde a tu tipo de cuenta.' };
    }
  }
  const portalRole =
    user.role === 'super_admin' ? 'admin' : mapApiRole(user.role);
  if (!portalRole && user.role !== 'super_admin') {
    return { ok: false, message: 'Rol de sesión no válido.' };
  }
  if (user.tenantId) localStorage.setItem(STORAGE_TENANT_ID, user.tenantId);
  if (user.patientId) localStorage.setItem(STORAGE_PATIENT_ID, user.patientId);
  const mustChange = Boolean(user.mustChangePassword || user.passwordExpired);
  if (mustChange) {
    const q = user.passwordExpired ? '?expired=1' : '';
    window.location.href = `/login/cambiar-password${q}`;
    return { ok: true, portalRole: portalRole ?? 'admin', mustChangePassword: true };
  }
  window.location.href = redirectAfterLogin(user);
  return {
    ok: true,
    portalRole: portalRole ?? 'admin',
    mustChangePassword: user.mustChangePassword,
    passwordExpired: user.passwordExpired
  };
}

export async function logoutSession(): Promise<void> {
  clearDemoSession();
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}
