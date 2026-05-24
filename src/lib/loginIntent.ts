import type { DemoRole } from '@/types/demo';
import { TENANT_CENTRO, VALID_TENANT_IDS } from '@/lib/tenantIds';

export function isSafeInternalPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//');
}

export function isPatientPortalPath(path: string): boolean {
  return path === '/portal-paciente' || path.startsWith('/paciente');
}

export function getLoginNextParam(): string | null {
  if (typeof window === 'undefined') return null;
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next || !isSafeInternalPath(next)) return null;
  return next;
}

export function loginPath(role: DemoRole, tenantId?: string): string {
  const next = getLoginNextParam();
  const nextQ = next ? `&next=${encodeURIComponent(next)}` : '';

  if (role === 'admin') {
    const tenantQ = tenantId ? `?tenant=${tenantId}` : next ? `?${nextQ.slice(1)}` : '';
    return `/login/admin${tenantQ}`;
  }

  const base = '/portal-paciente';
  if (next) return `${base}?next=${encodeURIComponent(next)}`;
  return base;
}

/** Login unificado con destino PdP (reserva, portal paciente). */
export function unifiedLoginPath(next?: string): string {
  const dest = next ?? getLoginNextParam();
  if (dest) return `/login?next=${encodeURIComponent(dest)}`;
  return '/login';
}

/** @deprecated Usar loginPath('admin') o loginPath('paciente') */
export function loginUrl(role: DemoRole, opts?: { tenantId?: string }): string {
  return loginPath(role, opts?.tenantId);
}

export function parseTenantFromSearch(search = ''): string {
  const tenantParam = new URLSearchParams(search).get('tenant');
  return tenantParam && VALID_TENANT_IDS.has(tenantParam) ? tenantParam : TENANT_CENTRO;
}
