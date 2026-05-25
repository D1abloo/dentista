import { createHmac, timingSafeEqual } from 'node:crypto';

export const platformInspectCookieName = 'df_platform_inspect';

export type PlatformInspectMode = 'clinic_admin' | 'patient_portal';

export interface PlatformInspectSession {
  superAdminEmail: string;
  superAdminName: string;
  accessRole: 'super_admin';
  mode: PlatformInspectMode;
  clinicId: string;
  tenantId?: string;
  patientId?: string;
  tokenId?: string;
  patientName?: string;
  expiresAt: number;
}

const encoder = new TextEncoder();

function secret() {
  const s = import.meta.env.AUTH_SESSION_SECRET;
  if (!s || s === 'change-me-local-dev') {
    if (import.meta.env.PROD) throw new Error('AUTH_SESSION_SECRET debe configurarse en producción.');
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
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createPlatformInspectCookie(session: Omit<PlatformInspectSession, 'expiresAt'>, hours = 4) {
  const expiresAt = Date.now() + hours * 60 * 60 * 1000;
  const payload = toBase64Url(JSON.stringify({ ...session, expiresAt }));
  return `${payload}.${sign(payload)}`;
}

export function parsePlatformInspectCookie(token: string | undefined): PlatformInspectSession | null {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEquals(sign(payload), signature)) return null;
  try {
    const session = JSON.parse(fromBase64Url(payload)) as PlatformInspectSession;
    if (!session.expiresAt || session.expiresAt < Date.now()) return null;
    if (!session.clinicId || !session.superAdminEmail) return null;
    return session;
  } catch {
    return null;
  }
}

export function getPlatformInspectSession(cookies: { get(name: string): { value?: string } | undefined }) {
  return parsePlatformInspectCookie(cookies.get(platformInspectCookieName)?.value);
}

type CookieDeleter = {
  delete: (name: string, options: { path: string }) => void;
};

/** Cierra inspección de clínica/PdP al volver al panel de plataforma. */
export function clearPlatformInspectCookie(cookies: CookieDeleter) {
  try {
    if (typeof cookies.delete === 'function') {
      cookies.delete(platformInspectCookieName, { path: '/' });
    }
  } catch {
    /* ignore en entornos sin soporte delete */
  }
}
