import type { APIRoute } from 'astro';
import { getSessionUser } from '@/lib/auth';
import { changeUserPassword } from '@/lib/auth/changePassword';
import { evaluatePasswordStatus } from '@/lib/auth/passwordPolicy';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import { changePasswordSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);

  const session = getSessionUser(cookies);
  if (!session?.profileId || session.role === 'super_admin') {
    return fail('Debes iniciar sesión como usuario de clínica o paciente.', 401);
  }

  try {
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());

    const db = getSupabaseAdmin();
    const { data: profile } = await db
      .from('profiles')
      .select('id, auth_user_id, email, role')
      .eq('id', session.profileId)
      .maybeSingle();
    if (!profile?.auth_user_id) return fail('Perfil no encontrado.', 404);

    await changeUserPassword({
      profileId: profile.id,
      authUserId: profile.auth_user_id,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      email: profile.email
    });

    const pwd = evaluatePasswordStatus({
      role: profile.role,
      must_change_password: false,
      password_expires_at: null
    });

    return ok(
      { mustChangePassword: pwd.mustChangePassword, passwordExpired: pwd.passwordExpired },
      { message: 'Contraseña actualizada correctamente.' }
    );
  } catch (error) {
    logError('auth.change-password', error);
    return fail(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.', 400);
  }
};
