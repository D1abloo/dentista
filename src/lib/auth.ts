import { createHmac, timingSafeEqual } from 'node:crypto';
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

export function createSessionToken(user: Omit<SessionUser, 'expiresAt'>) {
  const payload = toBase64Url(JSON.stringify({ ...user, expiresAt: Date.now() + 1000 * 60 * 60 * 8 }));
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

/** Solo disponible con PUBLIC_DEMO_MODE=true */
export function loginDemoUser(input: LoginInput): Omit<SessionUser, 'expiresAt'> | null {
  if (!isDemoMode()) return null;

  const adminEmail = import.meta.env.ADMIN_DEMO_EMAIL || 'admin@clinic.local';
  const adminPassword = import.meta.env.ADMIN_DEMO_PASSWORD || 'admin12345';
  const patientEmail = import.meta.env.PATIENT_DEMO_EMAIL || 'maria@example.com';
  const patientPassword = import.meta.env.PATIENT_DEMO_PASSWORD || 'paciente123';

  if (input.role === 'admin' && input.email === adminEmail && input.password === adminPassword) {
    return { role: 'admin', email: adminEmail, name: 'Administrador demo', clinicId: 'demo-clinic' };
  }

  if (input.role === 'patient' && input.email === patientEmail && input.password === patientPassword) {
    return {
      role: 'patient',
      email: patientEmail,
      name: 'Paciente demo',
      clinicId: 'demo-clinic',
      patientId: 'p-maria'
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
    name: import.meta.env.SUPER_ADMIN_NAME || 'Super Admin Dentista+'
  };
}

export async function loginProductionUser(input: LoginInput): Promise<Omit<SessionUser, 'expiresAt'> | null> {
  const superUser = loginSuperAdmin(input);
  if (superUser) return superUser;
  if (!hasSupabaseConfig()) return null;
  try {
    return await loginWithSupabaseProfile(input);
  } catch {
    return null;
  }
}

export function canAccessRole(user: SessionUser | null, roles: SessionUser['role'][]) {
  return Boolean(user && roles.includes(user.role));
}
