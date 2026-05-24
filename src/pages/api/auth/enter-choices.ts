import type { APIRoute } from 'astro';
import { getEffectiveSessionUser } from '@/lib/auth';
import { listEnterPortalChoices } from '@/lib/auth/portalChoices';
import { fail, ok } from '@/lib/http';
import { resolveEnterDestination } from '@/lib/services/clinicSwitch';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const user = getEffectiveSessionUser(cookies);
  if (!user) return fail('Inicia sesión para continuar.', 401);

  if (user.mustChangePassword || user.passwordExpired) {
    const redirect = user.passwordExpired ? '/login/cambiar-password?expired=1' : '/login/cambiar-password';
    return ok({ redirect, options: [], email: user.email, name: user.name });
  }

  if (!hasSupabaseConfig() || user.platformInspect) {
    const redirect = await resolveEnterDestination(user);
    return ok({ redirect, options: [], email: user.email, name: user.name });
  }

  const options = await listEnterPortalChoices(user);
  if (options.length <= 1) {
    const redirect = await resolveEnterDestination(user);
    return ok({ redirect, options, email: user.email, name: user.name });
  }

  return ok({ options, email: user.email, name: user.name });
};
