import type { APIRoute } from 'astro';
import { requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { revokeStaffClinicAccess } from '@/lib/services/staffClinicAccess';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { staffClinicAccessRevokeSchema } from '@/lib/validators';

export const prerender = false;

const MANAGER_ROLES = new Set(['clinic_admin', 'admin', 'owner']);

export const DELETE: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

  const role = gate.user.staffRole ?? gate.user.role;
  if (!MANAGER_ROLES.has(role) && gate.user.role !== 'admin' && gate.user.role !== 'super_admin') {
    return fail('Solo administración puede revocar accesos.', 403);
  }

  try {
    const body = await context.request.json();
    const parsed = staffClinicAccessRevokeSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());

    await revokeStaffClinicAccess({
      manager: gate.user,
      profileId: parsed.data.profileId,
      scopeClinicId: clinicId
    });

    return ok({ revoked: true }, { message: 'Acceso revocado.' });
  } catch (error) {
    logError('clinic.users.revoke-access', error);
    return fail(error instanceof Error ? error.message : 'No se pudo revocar el acceso.', 500);
  }
};
