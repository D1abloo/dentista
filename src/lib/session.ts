import type { DemoRole } from '@/types/demo';
import type { PortalChoiceId, PortalChoiceOption } from '@/lib/auth/portalChoices';
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

type LoginApiData = SessionUser & {
  choosePortal?: boolean;
  options?: PortalChoiceOption[];
};

export type LoginUnifiedResult =
  | {
      ok: true;
      portalRole: DemoRole;
      mustChangePassword?: boolean;
      passwordExpired?: boolean;
    }
  | { ok: true; choosePortal: true; email: string; options: PortalChoiceOption[] }
  | { ok: false; message: string };

function mapApiRole(role: string): DemoRole | null {
  if (role === 'admin') return 'admin';
  if (role === 'patient') return 'paciente';
  if (role === 'super_admin') return 'admin';
  return null;
}

function sessionRoleMatchesForced(userRole: string, forced: 'admin' | 'patient'): boolean {
  if (forced === 'admin') return userRole === 'admin' || userRole === 'super_admin';
  return userRole === 'patient';
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
  if (typeof window !== 'undefined') {
    const next = new URLSearchParams(window.location.search).get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  }
  if (user.role === 'super_admin') return '/platform';
  if (user.role === 'patient') return '/paciente';
  return '/admin';
}

function finishSessionLogin(
  user: SessionUser,
  forcedRole?: 'admin' | 'patient'
): LoginUnifiedResult {
  if (forcedRole && !sessionRoleMatchesForced(user.role, forcedRole)) {
    return { ok: false, message: 'Este acceso no corresponde a tu tipo de cuenta.' };
  }

  const portalRole = user.role === 'super_admin' ? 'admin' : mapApiRole(user.role);
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

async function postLogin(body: Record<string, unknown>) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  const json = (await res.json()) as {
    data?: LoginApiData;
    error?: { message?: string };
  };
  return { res, json };
}

export async function loginWithCredentials(
  role: 'admin' | 'patient',
  email: string,
  password: string
): Promise<LoginUnifiedResult> {
  return loginUnified(email, password, role);
}

/** Formulario único: detecta portales disponibles o inicia sesión directa. */
export async function loginUnified(
  email: string,
  password: string,
  forcedRole?: 'admin' | 'patient'
): Promise<LoginUnifiedResult> {
  clearDemoSession();
  const { res, json } = await postLogin({
    role: forcedRole ?? 'auto',
    email,
    password
  });

  if (!res.ok) {
    return { ok: false, message: json.error?.message ?? 'Credenciales incorrectas.' };
  }

  if (json.data?.choosePortal && json.data.options?.length) {
    return {
      ok: true,
      choosePortal: true,
      email: json.data.email,
      options: json.data.options
    };
  }

  if (!json.data?.role) {
    return { ok: false, message: json.error?.message ?? 'Credenciales incorrectas.' };
  }

  return finishSessionLogin(json.data, forcedRole);
}

export async function loginWithPortalChoice(
  email: string,
  password: string,
  portal: PortalChoiceId,
  forcedRole?: 'admin' | 'patient'
): Promise<LoginUnifiedResult> {
  const { res, json } = await postLogin({
    role: forcedRole ?? 'auto',
    email,
    password,
    portal
  });

  if (!res.ok || !json.data?.role) {
    return { ok: false, message: json.error?.message ?? 'No se pudo completar el acceso.' };
  }

  return finishSessionLogin(json.data, forcedRole);
}

export async function logoutSession(): Promise<void> {
  clearDemoSession();
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}
