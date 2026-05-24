import type { APIRoute } from 'astro';
import { requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { createClinicUser, listClinicUsersForScope } from '@/lib/services/clinicUsers';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { clinicUserCreateSchema } from '@/lib/validators';

export const prerender = false;

const MANAGER_ROLES = new Set(['clinic_admin', 'admin', 'owner']);

function canManageUsers(role: string) {
  return MANAGER_ROLES.has(role);
}

export const GET: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

  try {
    const users = await listClinicUsersForScope(clinicId, gate.user.tenantId);
    return ok({ users });
  } catch (error) {
    logError('clinic.users.get', error);
    return fail('No se pudieron listar los usuarios.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

  const role = gate.user.staffRole ?? gate.user.role;
  if (!canManageUsers(role) && gate.user.role !== 'admin') {
    return fail('Solo administración de clínica puede dar de alta usuarios.', 403);
  }

  try {
    const body = await context.request.json();
    const parsed = clinicUserCreateSchema.safeParse({ ...body, clinicId });
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());

    if (body?.accessType === 'patient' || body?.role === 'patient') {
      return fail(
        'En Dentista+ PRO los pacientes no se crean desde el panel. Usa reserva online o el proceso de alta acordado.',
        403
      );
    }

    const created = await createClinicUser({
      email: parsed.data.email,
      password: parsed.data.password,
      fullName: parsed.data.fullName,
      accessType: parsed.data.accessType,
      role: parsed.data.role,
      clinicId,
      permission: parsed.data.permission,
      specialty: parsed.data.specialty,
      collegiateNumber: parsed.data.collegiateNumber,
      sendEmail: parsed.data.sendEmail
    });

    return ok(
      {
        user: created.profile,
        loginPath: created.loginPath,
        accessLabel: created.accessLabel,
        emailSent: created.emailSent,
        temporaryPassword: created.temporaryPassword
      },
      {
        message: created.emailSent
          ? 'Usuario creado. Se envió email con contraseña temporal.'
          : 'Usuario creado. Guarda la contraseña temporal si no hay SMTP.'
      }
    );
  } catch (error) {
    logError('clinic.users.post', error);
    const msg = error instanceof Error ? error.message : 'No se pudo crear el usuario.';
    return fail(msg, 500);
  }
};
