import { createHmac, timingSafeEqual } from 'node:crypto';
import { getEffectiveSessionUser, type SessionUser } from '@/lib/auth';
import { enrichDualRoleClinicSession } from '@/lib/auth/dualRoleClinic';

const STAFF_ROLES = new Set(['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist']);

export const adminPanelGateCookieName = 'df_admin_gate';

const encoder = new TextEncoder();
const GATE_TTL_MS = 12 * 60 * 60 * 1000;
const GATE_MAX_AGE_SEC = 60 * 60 * 12;

type CookieReader = { get(name: string): { value?: string } | undefined };
type CookieWriter = CookieReader & {
  set: (
    name: string,
    value: string,
    opts: { httpOnly: boolean; sameSite: 'lax'; secure: boolean; path: string; maxAge: number }
  ) => void;
};

function secret() {
  const s = import.meta.env.ADMIN_PANEL_ENTRY_SECRET ?? import.meta.env.AUTH_SESSION_SECRET;
  if (!s || s === 'change-me-local-dev') {
    if (import.meta.env.PROD) {
      throw new Error('ADMIN_PANEL_ENTRY_SECRET o AUTH_SESSION_SECRET debe configurarse en producción.');
    }
    return 'dentalflow-admin-gate-dev';
  }
  return s;
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEquals(left: string, right: string) {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function getAdminEntrySlug(): string {
  const slug = import.meta.env.ADMIN_PANEL_ENTRY_SLUG?.trim();
  if (slug) return slug;
  if (import.meta.env.PROD) {
    throw new Error('ADMIN_PANEL_ENTRY_SLUG debe configurarse en producción.');
  }
  return 'dev-clinica-local';
}

export function validateAdminEntrySlug(slug: string | undefined): boolean {
  if (!slug?.trim()) return false;
  const expected = getAdminEntrySlug();
  return safeEquals(slug.trim(), expected);
}

export function createAdminPanelGateCookie(): string {
  const exp = Date.now() + GATE_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function parseAdminPanelGateCookie(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEquals(sign(payload), signature)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function hasAdminPanelGate(cookies: CookieReader): boolean {
  return parseAdminPanelGateCookie(cookies.get(adminPanelGateCookieName)?.value);
}

/** Usuario con acceso al panel clínica (alineado con requireStaffSession). */
export function isClinicPanelUser(
  user: Pick<SessionUser, 'role' | 'platformInspect' | 'inspectMode' | 'staffRole' | 'clinicId' | 'profileId'>
): boolean {
  if (user.role === 'patient') return false;
  if (user.platformInspect && user.inspectMode === 'clinic_admin') {
    return Boolean(user.clinicId);
  }
  if (user.role === 'admin') return true;
  if (user.role === 'super_admin' && user.clinicId) return true;
  const staffRole = user.staffRole ?? user.role;
  return STAFF_ROLES.has(staffRole);
}

/** Sesión válida de personal clínica (post-login), con enriquecimiento dual-role si aplica. */
export async function hasClinicPanelSession(cookies: CookieReader): Promise<boolean> {
  let user = getEffectiveSessionUser(cookies);
  if (!user) return false;
  if (user.role === 'super_admin' && !user.platformInspect) {
    user = await enrichDualRoleClinicSession(user);
  }
  return isClinicPanelUser(user);
}

export function applyAdminPanelGateCookie(cookies: CookieWriter, maxAge = GATE_MAX_AGE_SEC) {
  cookies.set(adminPanelGateCookieName, createAdminPanelGateCookie(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    path: '/',
    maxAge
  });
}

export function isDemoGateBypass(): boolean {
  return import.meta.env.PUBLIC_DEMO_MODE === 'true';
}

/** Rutas HTML del panel clínica que requieren enlace de entrada previo. */
export function isAdminPanelProtectedPath(pathname: string): boolean {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return true;
  if (pathname === '/login/admin') return true;
  return false;
}

/** Solo rutas del panel (no login). Tras autenticación basta la sesión clínica. */
export function isAdminPanelRoute(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function isAdminEntryPath(pathname: string): boolean {
  return pathname.startsWith('/entrada/');
}
