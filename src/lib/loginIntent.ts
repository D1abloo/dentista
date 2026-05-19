import type { DemoRole } from '@/types/demo';
import { TENANT_CENTRO, VALID_TENANT_IDS } from '@/lib/tenantIds';

export function loginPath(role: DemoRole, tenantId?: string): string {
  if (role === 'admin') {
    return tenantId ? `/login/admin?tenant=${tenantId}` : '/login/admin';
  }
  return '/login/paciente';
}

/** @deprecated Usar loginPath('/admin') o loginPath('paciente') */
export function loginUrl(role: DemoRole, opts?: { tenantId?: string }): string {
  return loginPath(role, opts?.tenantId);
}

export function parseTenantFromSearch(search = ''): string {
  const tenantParam = new URLSearchParams(search).get('tenant');
  return tenantParam && VALID_TENANT_IDS.has(tenantParam) ? tenantParam : TENANT_CENTRO;
}
