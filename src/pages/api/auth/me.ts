import type { APIRoute } from 'astro';
import { getEffectiveSessionUser, getSessionUser } from '@/lib/auth';
import { getIdentityFromSession, listPortalChoices, canUsePortalSwitcher, resolvePortalSwitcherOptions } from '@/lib/auth/portalChoices';
import { inferSessionPortal } from '@/lib/auth/sessionPortal';
import { fail, ok } from '@/lib/http';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) return fail('No autenticado.', 401);
  const effective = getEffectiveSessionUser(cookies) ?? user;
  const currentPortal = inferSessionPortal(effective);

  const identity = await getIdentityFromSession(user);
  const portalOptions = identity ? await listPortalChoices(identity) : [];
  const switcherAllowed = await canUsePortalSwitcher(user, identity);
  const resolvedOptions = switcherAllowed ? resolvePortalSwitcherOptions(user, portalOptions) : [];
  const portalSwitcher = {
    enabled: switcherAllowed && resolvedOptions.length >= 2,
    currentPortal,
    options: resolvedOptions
  };

  const payload = {
    ...effective,
    baseRole: user.role,
    sessionPortal: user.sessionPortal ?? effective.sessionPortal,
    inspectActive: effective.platformInspect === true,
    portalSwitcher
  };
  return ok(payload, { authenticated: true });
};
