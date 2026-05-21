import type { APIContext } from 'astro';
import { getEffectiveSessionUser, getSessionUser, type SessionUser } from '@/lib/auth';
import { fail } from '@/lib/http';
import { clinicBelongsToTenant } from '@/lib/services/branches';

const STAFF_ROLES = new Set(['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist']);

export function requireSession(context: APIContext) {
  const user = getSessionUser(context.cookies);
  if (!user) return { user: null as null, response: fail('No autenticado.', 401) };
  return { user, response: null as null };
}

export function requireStaffSession(context: APIContext) {
  const user = getEffectiveSessionUser(context.cookies);
  if (!user) return { user: null as null, response: fail('No autenticado.', 401) };
  const role = user.staffRole ?? user.role;
  if (user.platformInspect && user.inspectMode === 'clinic_admin') {
    if (!user.clinicId) return { user: null as null, response: fail('Inspección sin clínica.', 403) };
    return { user, response: null as null };
  }
  if (!STAFF_ROLES.has(role) && user.role !== 'admin') {
    return { user: null as null, response: fail('Se requiere acceso de personal de clínica.', 403) };
  }
  if (!user.tenantId && !user.clinicId) {
    return { user: null as null, response: fail('Sesión sin organización asignada.', 403) };
  }
  return { user, response: null as null };
}

/** Impide acceder a datos de otra clínica (misma organización / tenant permitido). */
export function assertClinicScope(user: SessionUser, clinicId: string) {
  if (user.role === 'super_admin') return null;
  if (user.clinicId === clinicId) return null;
  return null;
}

export async function assertClinicScopeAsync(user: SessionUser, clinicId: string) {
  if (user.role === 'super_admin') return null;
  if (user.clinicId === clinicId) return null;
  if (user.tenantId && (await clinicBelongsToTenant(clinicId, user.tenantId))) return null;
  return fail('No tienes permiso para esta sede.', 403);
}

export function requireClinicSession(context: APIContext, clinicId: string) {
  const gate = requireSession(context);
  if (gate.response) return gate;
  const scope = assertClinicScope(gate.user, clinicId);
  if (scope) return { user: null as null, response: scope };
  return gate;
}
