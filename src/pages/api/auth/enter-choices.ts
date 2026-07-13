import type { APIRoute } from 'astro';
import { getEffectiveSessionUser, getSessionUser } from '@/lib/auth';
import { getIdentityFromSession, listPortalChoices } from '@/lib/auth/portalChoices';
import { inferSessionPortal } from '@/lib/auth/sessionPortal';
import { fail, ok } from '@/lib/http';
import { resolveEnterDestination } from '@/lib/services/clinicSwitch';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, url }) => {
  const baseUser = getSessionUser(cookies);
  if (!baseUser) return fail('Inicia sesión para continuar.', 401);

  const effective = getEffectiveSessionUser(cookies) ?? baseUser;
  const switcher = url.searchParams.get('switcher') === '1';

  if (baseUser.mustChangePassword || baseUser.passwordExpired) {
    const redirect = baseUser.passwordExpired ? '/login/cambiar-password?expired=1' : '/login/cambiar-password';
    return ok({ redirect, options: [], email: baseUser.email, name: baseUser.name });
  }

  if (!hasSupabaseConfig()) {
    const redirect = await resolveEnterDestination(effective);
    return ok({ redirect, options: [], email: baseUser.email, name: baseUser.name });
  }

  if (switcher) {
    const identity = await getIdentityFromSession(baseUser);
    if (!identity) {
      return ok({
        options: [],
        email: baseUser.email,
        name: baseUser.name,
        currentPortal: inferSessionPortal(effective)
      });
    }
    const options = await listPortalChoices(identity);
    return ok({
      options,
      email: baseUser.email,
      name: baseUser.name,
      currentPortal: inferSessionPortal(effective)
    });
  }

  if (effective.platformInspect) {
    const redirect = await resolveEnterDestination(effective);
    return ok({ redirect, options: [], email: baseUser.email, name: baseUser.name });
  }

  const options = await listEnterPortalChoicesFromUser(baseUser);
  if (options.length <= 1) {
    const redirect = await resolveEnterDestination(effective);
    return ok({ redirect, options, email: baseUser.email, name: baseUser.name });
  }

  return ok({ options, email: baseUser.email, name: baseUser.name });
};

async function listEnterPortalChoicesFromUser(
  user: NonNullable<ReturnType<typeof getSessionUser>>
) {
  const identity = await getIdentityFromSession(user);
  if (!identity) return [];
  return listPortalChoices(identity);
}
