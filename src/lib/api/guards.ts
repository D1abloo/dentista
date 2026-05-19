import type { APIContext } from 'astro';
import { getSessionUser, type SessionUser } from '@/lib/auth';
import { fail } from '@/lib/http';

export function requireSession(context: APIContext) {
  const user = getSessionUser(context.cookies);
  if (!user) return { user: null as null, response: fail('No autenticado.', 401) };
  return { user, response: null as null };
}

/** Impide acceder a datos de otra clínica. */
export function assertClinicScope(user: SessionUser, clinicId: string) {
  if (user.role === 'super_admin') return null;
  if (!user.clinicId || user.clinicId !== clinicId) {
    return fail('No tienes permiso para esta clínica.', 403);
  }
  return null;
}

export function requireClinicSession(context: APIContext, clinicId: string) {
  const gate = requireSession(context);
  if (gate.response) return gate;
  const scope = assertClinicScope(gate.user, clinicId);
  if (scope) return { user: null as null, response: scope };
  return gate;
}
