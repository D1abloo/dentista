import type { APIContext } from 'astro';
import { getEffectiveSessionUser, getSessionUser, type SessionUser } from '@/lib/auth';
import { enrichDualRoleClinicSession } from '@/lib/auth/dualRoleClinic';
import { hasGlobalClinicAdministratorAccess } from '@/lib/auth/platformClinicAccess';
import { fail } from '@/lib/http';
import { listAssignedClinicIdsForSession } from '@/lib/services/staffContext';

const STAFF_ROLES = new Set(['clinic_admin', 'admin', 'owner', 'dentist', 'receptionist']);

export function requireSession(context: APIContext) {
  const user = getSessionUser(context.cookies);
  if (!user) return { user: null as null, response: fail('No autenticado.', 401) };
  return { user, response: null as null };
}

export async function requireStaffSession(context: APIContext) {
  let user = getEffectiveSessionUser(context.cookies);
  if (!user) return { user: null as null, response: fail('No autenticado.', 401) };

  if (user.role === 'super_admin' && !user.platformInspect) {
    user = await enrichDualRoleClinicSession(user);
  }

  const role = user.staffRole ?? user.role;
  if (user.platformInspect && user.inspectMode === 'clinic_admin') {
    if (!user.clinicId) return { user: null as null, response: fail('Inspección sin clínica.', 403) };
    return { user, response: null as null };
  }
  if (await hasGlobalClinicAdministratorAccess(user)) {
    return { user, response: null as null };
  }
  if (user.role === 'super_admin' && user.clinicId) {
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

/** Impide acceder a datos de otra clínica. Cada clínica es independiente (sin cruce por tenant). */
export function assertClinicScope(user: SessionUser, clinicId: string) {
  if (user.role === 'super_admin') return null;
  if (user.clinicId && user.clinicId === clinicId) return null;
  return fail('No tienes permiso para esta clínica.', 403);
}

export async function assertClinicScopeAsync(user: SessionUser, clinicId: string) {
  if (await hasGlobalClinicAdministratorAccess(user)) return null;
  if (user.role === 'super_admin') return null;
  if (user.clinicId === clinicId) return null;
  const assigned = await listAssignedClinicIdsForSession(user);
  if (assigned.includes(clinicId)) return null;
  return fail('No tienes permiso para esta clínica.', 403);
}

/** Staff de clínica o el propio paciente (solo su patientId). */
export async function assertStaffOrOwnPatient(
  user: SessionUser,
  clinicId: string,
  patientId: string
) {
  if (user.role === 'super_admin') return null;
  if (user.role === 'patient' || user.patientId) {
    if (user.patientId !== patientId) return fail('No puedes actuar sobre otro paciente.', 403);
    if (user.clinicId && user.clinicId !== clinicId) {
      return fail('Sede no válida para tu sesión.', 403);
    }
    return null;
  }
  const role = user.staffRole ?? user.role;
  if (STAFF_ROLES.has(role) || user.role === 'admin') {
    return assertClinicScopeAsync(user, clinicId);
  }
  return fail('No autorizado.', 403);
}

export function isPatientSession(user: SessionUser) {
  return user.role === 'patient' || Boolean(user.patientId);
}

export function assertOwnPatient(user: SessionUser, patientId: string) {
  if (user.role === 'super_admin') return null;
  if (!isPatientSession(user)) return fail('Se requiere sesión de paciente.', 403);
  if (!user.patientId) return fail('Sesión de paciente incompleta.', 403);
  if (user.patientId !== patientId) return fail('No puedes actuar sobre otro paciente.', 403);
  return null;
}

/** Sede efectiva para staff: query o sesión. */
export function resolveStaffClinicId(user: SessionUser, requestedClinicId?: string) {
  return requestedClinicId ?? user.clinicId ?? '';
}

export async function requireClinicSessionAsync(context: APIContext, clinicId: string) {
  const gate = await requireStaffSession(context);
  if (gate.response) return gate;
  const scope = await assertClinicScopeAsync(gate.user, clinicId);
  if (scope) return { user: null as null, response: scope };
  return gate;
}

/** @deprecated Usa requireClinicSessionAsync (clínicas siempre independientes). */
export async function requireClinicSession(context: APIContext, clinicId: string) {
  const gate = await requireStaffSession(context);
  if (gate.response) return gate;
  const scope = assertClinicScope(gate.user, clinicId);
  if (scope) return { user: null as null, response: scope };
  return gate;
}
