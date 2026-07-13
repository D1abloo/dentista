import type { APIRoute } from 'astro';
import { createSessionToken, getEffectiveSessionUser, sessionCookieName } from '@/lib/auth';
import { applyAdminPanelGateCookie, adminPanelGateCookieName } from '@/lib/auth/adminPanelGate';
import { shouldGrantAdminGateCookie } from '@/lib/auth/clinicPanelAccess';
import { AccountNotActivatedError } from '@/lib/auth/accountErrors';
import { completePortalLogin } from '@/lib/auth/loginComplete';
import { getIdentityFromSession } from '@/lib/auth/portalChoices';
import { platformInspectCookieName } from '@/lib/auth/platformInspect';
import { isCookieSecure, okWithCookies } from '@/lib/auth/cookieResponse';
import { fail } from '@/lib/http';
import { logError } from '@/lib/logger';
import { resolvePortalSwitchDestination } from '@/lib/services/clinicSwitch';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { selectPortalSchema } from '@/lib/validators';

export const prerender = false;

const SESSION_HOURS = 8;

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);

  const user = getEffectiveSessionUser(cookies);
  if (!user) return fail('Inicia sesión para continuar.', 401);

  try {
    const body = await request.json();
    const parsed = selectPortalSchema.safeParse(body);
    if (!parsed.success) return fail('Portal no válido.', 422, parsed.error.flatten());

    const identity = await getIdentityFromSession(user);
    if (!identity) return fail('No se pudo resolver la cuenta.', 403);

    let sessionUser;
    try {
      sessionUser = await completePortalLogin(identity, parsed.data.portal);
    } catch (err) {
      if (err instanceof AccountNotActivatedError) return fail(err.message, 403);
      throw err;
    }

    if (!sessionUser) return fail('No tienes acceso a ese portal.', 403);

    const maxAge = 60 * 60 * SESSION_HOURS;
    cookies.set(sessionCookieName, createSessionToken(sessionUser, maxAge), {
      httpOnly: true,
      sameSite: 'lax',
      secure: isCookieSecure(),
      path: '/',
      maxAge
    });

    if (shouldGrantAdminGateCookie(sessionUser)) {
      applyAdminPanelGateCookie(cookies, maxAge);
    } else {
      cookies.delete(adminPanelGateCookieName, { path: '/' });
    }

    cookies.delete(platformInspectCookieName, { path: '/' });

    const redirect = await resolvePortalSwitchDestination(sessionUser);
    return okWithCookies(cookies, { redirect }, { message: 'Portal seleccionado.' });
  } catch (error) {
    logError('auth.select-portal', error);
    return fail('No se pudo cambiar de portal.', 500);
  }
};
