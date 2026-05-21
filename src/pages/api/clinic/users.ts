import type { APIRoute } from 'astro';
import { requireStaffSession } from '@/lib/api/guards';
import { clinicBelongsToTenant } from '@/lib/services/branches';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { createClinicUser, listClinicUsersForScope } from '@/lib/services/clinicUsers';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { clinicUserCreateSchema } from '@/lib/validators';

export const prerender = false;

const USER_MANAGERS = new Set(['clinic_admin', 'owner', 'admin']);

export const GET: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

  try {
    const users = await listClinicUsersForScope(clinicId, gate.user.tenantId);
    return ok({ users });
  } catch (error) {
    logError('clinic.users.get', error);
    return fail('No se pudo cargar los usuarios.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;

  const staffRole = gate.user.staffRole ?? '';
  if (!USER_MANAGERS.has(staffRole)) {
    return fail('No tienes permiso para crear usuarios.', 403);
  }

  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

  try {
    const body = await context.request.json();
    const parsed = clinicUserCreateSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());

    const targetClinicId = parsed.data.clinicId ?? clinicId;
    if (targetClinicId !== clinicId) {
      if (!gate.user.tenantId || !(await clinicBelongsToTenant(targetClinicId, gate.user.tenantId))) {
        return fail('No puedes asignar usuarios a otra sede.', 403);
      }
    }

    const created = await createClinicUser({
      email: parsed.data.email,
      password: parsed.data.password,
      fullName: parsed.data.fullName,
      accessType: parsed.data.accessType,
      role: parsed.data.role,
      clinicId: targetClinicId,
      permission: parsed.data.permission,
      specialty: parsed.data.specialty
    });

    return ok(
      {
        user: created.profile,
        loginPath: created.loginPath,
        accessLabel: created.accessLabel
      },
      { message: 'Usuario creado correctamente.' }
    );
  } catch (error) {
    logError('clinic.users.post', error);
    const msg = error instanceof Error ? error.message : 'No se pudo crear el usuario.';
    return fail(msg, 500);
  }
};
