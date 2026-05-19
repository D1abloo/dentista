import { createHmac, timingSafeEqual } from 'node:crypto';
import type { UserRole } from './types';
import type { LoginInput } from './validators';

export const sessionCookieName = 'df_session';

export interface SessionUser {
  role: Extract<UserRole, 'patient' | 'admin'>;
  email: string;
  name: string;
  clinicId: string;
  patientId?: string;
  expiresAt: number;
}

interface CookieReader {
  get(name: string): { value?: string } | undefined;
}

const encoder = new TextEncoder();

function secret() {
  return import.meta.env.AUTH_SESSION_SECRET || 'dentalflow-demo-session-secret';
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
    if (user.role !== 'admin' && user.role !== 'patient') return null;
    return user;
  } catch {
    return null;
  }
}

export function getSessionUser(cookies: CookieReader) {
  return parseSessionToken(cookies.get(sessionCookieName)?.value);
}

export function loginDemoUser(input: LoginInput): Omit<SessionUser, 'expiresAt'> | null {
  const adminEmail = import.meta.env.ADMIN_DEMO_EMAIL || 'admin@clinic.local';
  const adminPassword = import.meta.env.ADMIN_DEMO_PASSWORD || 'admin12345';
  const patientEmail = import.meta.env.PATIENT_DEMO_EMAIL || 'maria@example.com';
  const patientPassword = import.meta.env.PATIENT_DEMO_PASSWORD || 'paciente123';

  if (input.role === 'admin' && input.email === adminEmail && input.password === adminPassword) {
    return { role: 'admin', email: adminEmail, name: 'Dr. Admin', clinicId: 'demo-clinic' };
  }

  if (input.role === 'patient' && input.email === patientEmail && input.password === patientPassword) {
    return { role: 'patient', email: patientEmail, name: 'María González', clinicId: 'demo-clinic', patientId: 'p-maria' };
  }

  return null;
}

export function canAccessRole(user: SessionUser | null, roles: SessionUser['role'][]) {
  return Boolean(user && roles.includes(user.role));
}
