import { createHmac, timingSafeEqual } from 'node:crypto';
import { AccountNotActivatedError } from '@/lib/auth/accountErrors';
import { loginAutoDetect } from '@/lib/auth/loginAuto';
import type { LoginProductionResult } from '@/lib/auth/loginResolve';
import { resolveProductionLogin, resolveProductionLoginWithPortal } from '@/lib/auth/loginResolve';
import { getPlatformInspectSession } from '@/lib/auth/platformInspect';
import { loginWithSupabaseProfile } from '@/lib/auth/productionLogin';
import { hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer';
import type { PlatformRole } from '@/lib/platform/types';
import type { LoginInput } from './validators';

export const sessionCookieName = 'df_session';

export interface SessionUser {
  role: PlatformRole | 'patient' | 'admin' | 'super_admin';
  email: string;
  name: string;
  profileId?: string;
  clinicId?: string;
  tenantId?: string;
  patientId?: string;
  staffRole?: string;
  mustChangePassword?: boolean;
  passwordExpired?: boolean;
  expiresAt: number;
  /** Super admin revisando panel clínica o PdP (auditoría) */
  platformInspect?: boolean;
  inspectMode?: 'clinic_admin' | 'patient_portal';
  inspectAccessRole?: string;
  /** Portal elegido al iniciar sesión: plataforma, clínica o paciente. */
  sessionPortal?: 'platform' | 'clinic' | 'patient';
}

interface CookieReader {
  get(name: string): { value?: string } | undefined;
}

const VALID_ROLES = new Set([
  'super_admin',
  'clinic_admin',
  'admin',
  'owner',
  'dentist',
  'receptionist',
  'patient'
]);

const encoder = new TextEncoder();

function secret() {
  const s = import.meta.env.AUTH_SESSION_SECRET;
  if (!s || s === 'change-me-local-dev') {
    if (import.meta.env.PROD) {
      throw new Error('AUTH_SESSION_SECRET debe configurarse en producción.');
    }
    return 'dentalflow-dev-only-secret';
  }
  return s;
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEquals(left: string, right: string) {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export function createSessionToken(user: Omit<SessionUser, 'expiresAt'>, maxAgeSec = 60 * 60 * 8) {
  const payload = toBase64Url(
    JSON.stringify({ ...user, expiresAt: Date.now() + Math.max(60, maxAgeSec) * 1000 })
  );
  return `${payload}.${sign(payload)}`;
}

export function parseSessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEquals(sign(payload), signature)) return null;

  try {
    const user = JSON.parse(fromBase64Url(payload)) as SessionUser;
    if (!user.expiresAt || user.expiresAt < Date.now()) return null;
    if (!VALID_ROLES.has(user.role)) return null;
    return user;
  } catch {
    return null;
  }
}

export function getSessionUser(cookies: CookieReader) {
  return parseSessionToken(cookies.get(sessionCookieName)?.value);
}

/** Sesión efectiva: super admin en modo inspección actúa como admin de la clínica indicada. */
export function getEffectiveSessionUser(cookies: CookieReader): SessionUser | null {
  const user = getSessionUser(cookies);
  if (!user) return null;

  const inspect = getPlatformInspectSession(cookies);
  if (!inspect) return user;

  const ownsInspect =
    user.role === 'super_admin' ||
    user.email.trim().toLowerCase() === inspect.superAdminEmail.trim().toLowerCase();
  if (!ownsInspect) return user;

  if (inspect.mode === 'clinic_admin') {
    return {
      ...user,
      role: 'admin',
      clinicId: inspect.clinicId,
      tenantId: inspect.tenantId,
      staffRole: 'super_admin',
      platformInspect: true,
      inspectMode: 'clinic_admin',
      inspectAccessRole: inspect.accessRole
    };
  }

  return {
    ...user,
    platformInspect: true,
    inspectMode: 'patient_portal',
    inspectAccessRole: inspect.accessRole,
    clinicId: inspect.clinicId,
    tenantId: inspect.tenantId,
    patientId: inspect.patientId
  };
}

/** Solo disponible con PUBLIC_DEMO_MODE=true */
export function loginDemoUser(input: LoginInput): Omit<SessionUser, 'expiresAt'> | null {
  if (!isDemoMode()) return null;

  const adminEmail = import.meta.env.ADMIN_DEMO_EMAIL || 'admin@clinic.local';
  const adminPassword = import.meta.env.ADMIN_DEMO_PASSWORD || 'admin12345';
  const patientEmail = import.meta.env.PATIENT_DEMO_EMAIL || 'maria@example.com';
  const patientPassword = import.meta.env.PATIENT_DEMO_PASSWORD || 'paciente123';

  if (input.role === 'admin' && input.email === adminEmail && input.password === adminPassword) {
    return {
      role: 'admin',
      email: adminEmail,
      name: 'Administrador demo',
      clinicId: 'demo-clinic',
      sessionPortal: 'clinic'
    };
  }

  if (input.role === 'patient' && input.email === patientEmail && input.password === patientPassword) {
    return {
      role: 'patient',
      email: patientEmail,
      name: 'Paciente demo',
      clinicId: 'demo-clinic',
      patientId: 'p-maria',
      sessionPortal: 'patient'
    };
  }

  return null;
}

export function loginSuperAdmin(input: LoginInput): Omit<SessionUser, 'expiresAt'> | null {
  const email = import.meta.env.SUPER_ADMIN_EMAIL;
  const password = import.meta.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) return null;
  if (input.role !== 'super_admin') return null;
  if (input.email !== email || input.password !== password) return null;
  return {
    role: 'super_admin',
    email,
    name: import.meta.env.SUPER_ADMIN_NAME || 'Super Admin Dentista+',
    sessionPortal: 'platform'
  };
}

export type { LoginProductionResult } from '@/lib/auth/loginResolve';

export async function loginProductionUser(input: LoginInput): Promise<LoginProductionResult | null> {
  if (input.role === 'super_admin') {
    const envUser = loginSuperAdmin(input);
    if (envUser) return envUser;
    if (!hasSupabaseConfig()) return null;
    try {
      return await loginWithSupabaseProfile(input);
    } catch (err) {
      if (err instanceof AccountNotActivatedError) throw err;
      return null;
    }
  }

  if (!hasSupabaseConfig()) return null;
  try {
    if (input.role === 'auto') {
      return await loginAutoDetect(input.email, input.password);
    }
    return await resolveProductionLogin(input);
  } catch (err) {
    if (err instanceof AccountNotActivatedError) throw err;
    return null;
  }
}

export async function loginProductionUserWithPortal(
  input: LoginInput,
  portal: 'admin' | 'patient' | 'platform'
): Promise<Omit<SessionUser, 'expiresAt'> | null> {
  const superUser = loginSuperAdmin({ ...input, role: 'super_admin' });
  if (portal === 'platform' && superUser) return superUser;
  if (!hasSupabaseConfig()) return null;
  try {
    return await resolveProductionLoginWithPortal(input, portal);
  } catch (err) {
    if (err instanceof AccountNotActivatedError) throw err;
    return null;
  }
}

export function canAccessRole(user: SessionUser | null, roles: SessionUser['role'][]) {
  return Boolean(user && roles.includes(user.role));
}
