import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const portalAccessCookieName = 'df_pdp_access';

export interface PortalAccessSession {
  tokenId: string;
  patientId: string;
  staffProfileId: string;
  clinicId: string;
  tenantId?: string;
  targetClinicId?: string;
  patientName?: string;
  expiresAt: number;
}

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

export function hashPortalToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

export function generatePortalToken() {
  const raw = randomBytes(32).toString('base64url');
  return { raw, hash: hashPortalToken(raw) };
}

export function createPortalAccessCookie(session: Omit<PortalAccessSession, 'expiresAt'>, maxAgeHours = 8) {
  const expiresAt = Date.now() + maxAgeHours * 60 * 60 * 1000;
  const payload = toBase64Url(JSON.stringify({ ...session, expiresAt }));
  return `${payload}.${sign(payload)}`;
}

export function parsePortalAccessCookie(token: string | undefined): PortalAccessSession | null {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEquals(sign(payload), signature)) return null;
  try {
    const session = JSON.parse(fromBase64Url(payload)) as PortalAccessSession;
    if (!session.expiresAt || session.expiresAt < Date.now()) return null;
    if (!session.tokenId || !session.patientId || !session.staffProfileId) return null;
    return session;
  } catch {
    return null;
  }
}

export function getPortalAccessSession(cookies: { get(name: string): { value?: string } | undefined }) {
  return parsePortalAccessCookie(cookies.get(portalAccessCookieName)?.value);
}
