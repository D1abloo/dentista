import { afterPasswordChangeFields } from '@/lib/auth/passwordPolicy';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import { signInWithEmailPassword } from '@/lib/supabaseAuth';

export async function changeUserPassword(input: {
  profileId: string;
  authUserId: string;
  currentPassword: string;
  newPassword: string;
  email: string;
}) {
  if (!hasSupabaseConfig()) throw new Error('Servicio no disponible.');
  if (input.newPassword.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');

  const verify = await signInWithEmailPassword(input.email, input.currentPassword);
  if (verify.error || !verify.data.user) {
    throw new Error('La contraseña actual no es correcta.');
  }

  const db = getSupabaseAdmin();
  const { data: profile, error: profileErr } = await db
    .from('profiles')
    .select('id, role, auth_user_id')
    .eq('id', input.profileId)
    .maybeSingle();
  if (profileErr || !profile || profile.auth_user_id !== input.authUserId) {
    throw new Error('Perfil no encontrado.');
  }

  const { error: authErr } = await db.auth.admin.updateUserById(input.authUserId, {
    password: input.newPassword
  });
  if (authErr) throw authErr;

  const fields = afterPasswordChangeFields(profile.role as string);
  const { error: updErr } = await db.from('profiles').update(fields).eq('id', input.profileId);
  if (updErr) throw updErr;

  return { ok: true as const };
}
