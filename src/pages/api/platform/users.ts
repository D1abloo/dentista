import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listClinicUsers } from '@/lib/platform/service';
import { createClinicUser } from '@/lib/services/clinicUsers';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { clinicUserCreateSchema, platformUsersQuerySchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);
  try {
    const clinicId = context.url.searchParams.get('clinicId') ?? undefined;
    const parsed = platformUsersQuerySchema.safeParse({ clinicId });
    if (!parsed.success) return fail('Parámetros inválidos.', 422);
    return ok(await listClinicUsers(parsed.data.clinicId));
  } catch (error) {
    logError('platform.users.list', error);
    return fail('No se pudieron listar los usuarios.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);

  try {
    const body = await context.request.json();
    const parsed = clinicUserCreateSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());
    if (!parsed.data.clinicId) {
      return fail('Indica la clínica (clinicId) a la que pertenece el usuario.', 422);
    }

    const created = await createClinicUser({
      email: parsed.data.email,
      password: parsed.data.password,
      fullName: parsed.data.fullName,
      accessType: parsed.data.accessType,
      role: parsed.data.role,
      clinicId: parsed.data.clinicId,
      permission: parsed.data.permission,
      specialty: parsed.data.specialty,
      sendEmail: parsed.data.sendEmail
    });

    return ok(
      {
        user: created.profile,
        loginPath: created.loginPath,
        accessLabel: created.accessLabel,
        emailSent: created.emailSent
      },
      {
        message: created.emailSent
          ? 'Usuario creado. Se ha enviado un email con la contraseña temporal.'
          : 'Usuario creado. Configura SMTP para enviar credenciales por correo.'
      }
    );
  } catch (error) {
    logError('platform.users.post', error);
    const msg = error instanceof Error ? error.message : 'No se pudo crear el usuario.';
    return fail(msg, 500);
  }
};
