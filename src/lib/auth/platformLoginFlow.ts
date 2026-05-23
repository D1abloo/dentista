import type { SessionUser } from '@/lib/auth';
import { loginSuperAdmin } from '@/lib/auth';
import { authenticateCredentials } from '@/lib/auth/portalChoices';
import { loginWithSupabaseProfile } from '@/lib/auth/productionLogin';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import type { LoginInput } from '@/lib/validators';

/** Solo Super Admin de plataforma (env o tabla platform_admins). */
export async function loginSuperAdminOnly(
  input: LoginInput
): Promise<Omit<SessionUser, 'expiresAt'> | null> {
  if (input.role !== 'super_admin') return null;

  const envUser = loginSuperAdmin(input);
  if (envUser) return envUser;

  if (!hasSupabaseConfig()) return null;

  return loginWithSupabaseProfile({ ...input, role: 'super_admin' });
}

/** Credenciales válidas en Auth pero sin fila activa en platform_admins. */
export async function hasValidAuthWithoutPlatformAccess(
  email: string,
  password: string
): Promise<boolean> {
  if (!hasSupabaseConfig()) return false;
  const identity = await authenticateCredentials(email, password);
  return Boolean(identity);
}
