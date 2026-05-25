import type { DemoRole } from '@/types/demo';
import type { PortalChoiceId, PortalChoiceOption } from '@/lib/auth/portalChoices';
import { isClientDemoMode } from '@/lib/appMode';
import { isPatientPortalPath, isSafeInternalPath } from '@/lib/loginIntent';
import { STORAGE_ACTIVE_CLINIC_ID, STORAGE_PATIENT_ID, STORAGE_STATE, STORAGE_TENANT_ID } from '@/lib/storage/keys';
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
  | { ok: true; redirectTo: string; portalRole: DemoRole }
  | { ok: false; message: string };

function mapApiRole(role: string): DemoRole | null {
  if (role === 'admin') return 'admin';
  if (role === 'patient') return 'paciente';
  if (role === 'super_admin') return 'admin';
  return null;
}

function sessionRoleMatchesForced(userRole: string, forced: 'admin' | 'patient'): boolean {
  if (forced === 'admin') return userRole === 'admin';
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
    if (next && isSafeInternalPath(next)) {
      if (isPatientPortalPath(next)) return next;
      if (user.role === 'super_admin' && next.startsWith('/platform')) return next;
      if (user.role === 'admin' && next.startsWith('/admin')) return next;
      if (user.role === 'patient') return next;
    }
  }
  if (user.role === 'super_admin') return '/platform';
  if (user.role === 'patient') return '/paciente';
  if (user.role === 'admin') return '/admin/elegir-centro?auto=1';
  return '/admin';
}

async function finishSessionLogin(
  user: SessionUser,
  forcedRole?: 'admin' | 'patient',
  opts?: { deferRedirect?: boolean }
): Promise<LoginUnifiedResult> {
  if (forcedRole === 'admin' && user.role === 'super_admin') {
    return { ok: false, message: 'Tu cuenta no tiene acceso al panel clínica.' };
  }

  if (forcedRole && !sessionRoleMatchesForced(user.role, forcedRole)) {
    if (forcedRole === 'admin') {
      return { ok: false, message: 'Tu cuenta no tiene acceso al panel clínica.' };
    }
    return { ok: false, message: 'Este acceso no corresponde a tu tipo de cuenta.' };
  }

  const portalRole = mapApiRole(user.role);
  if (!portalRole) {
    return { ok: false, message: 'Rol de sesión no válido.' };
  }

  if (user.tenantId) localStorage.setItem(STORAGE_TENANT_ID, user.tenantId);
  if (user.patientId) localStorage.setItem(STORAGE_PATIENT_ID, user.patientId);

  const mustChange = Boolean(user.mustChangePassword || user.passwordExpired);
  if (mustChange) {
    const q = user.passwordExpired ? '?expired=1' : '';
    const dest = `/login/cambiar-password${q}`;
    if (opts?.deferRedirect) {
      return { ok: true, redirectTo: dest, portalRole };
    }
    window.location.href = dest;
    return { ok: true, portalRole, mustChangePassword: true };
  }

  const dest = redirectAfterLogin(user);
  if (opts?.deferRedirect) {
    return { ok: true, redirectTo: dest, portalRole };
  }

  if (dest.startsWith('/admin')) {
    try {
      await fetch('/api/auth/ensure-admin-access', { method: 'POST', credentials: 'include' });
    } catch {
      /* middleware también acepta sesión clínica válida */
    }
  }

  window.location.href = dest;
  return {
    ok: true,
    portalRole,
    mustChangePassword: user.mustChangePassword,
    passwordExpired: user.passwordExpired
  };
}

async function postLogin(body: Record<string, unknown> & { remember?: boolean }) {
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
  forcedRole?: 'admin' | 'patient',
  opts?: { remember?: boolean; deferRedirect?: boolean }
): Promise<LoginUnifiedResult> {
  clearDemoSession();
  const { res, json } = await postLogin({
    role: forcedRole ?? 'auto',
    email,
    password,
    remember: opts?.remember
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

  return await finishSessionLogin(json.data, forcedRole, { deferRedirect: opts?.deferRedirect });
}

export async function loginWithPortalChoice(
  email: string,
  password: string,
  portal: PortalChoiceId,
  forcedRole?: 'admin' | 'patient',
  opts?: { remember?: boolean; deferRedirect?: boolean }
): Promise<LoginUnifiedResult> {
  const { res, json } = await postLogin({
    role: forcedRole ?? 'auto',
    email,
    password,
    portal,
    remember: opts?.remember
  });

  if (!res.ok || !json.data?.role) {
    return { ok: false, message: json.error?.message ?? 'No se pudo completar el acceso.' };
  }

  return await finishSessionLogin(json.data, forcedRole, { deferRedirect: opts?.deferRedirect });
}

export async function logoutSession(): Promise<void> {
  clearDemoSession();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_STATE);
    localStorage.removeItem(STORAGE_ACTIVE_CLINIC_ID);
    sessionStorage.clear();
  }
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}
