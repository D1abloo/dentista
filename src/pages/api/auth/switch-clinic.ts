import type { APIRoute } from 'astro';
import { createSessionToken, sessionCookieName } from '@/lib/auth';
import { applyAdminPanelGateCookie } from '@/lib/auth/adminPanelGate';
import { requireStaffSession } from '@/lib/api/guards';
import { isCookieSecure, okWithCookies } from '@/lib/auth/cookieResponse';
import { fail } from '@/lib/http';
import { logError } from '@/lib/logger';
import { switchSessionToClinic } from '@/lib/services/clinicSwitch';
import { switchClinicSchema } from '@/lib/validators';

export const prerender = false;

const SESSION_HOURS = 8;

export const POST: APIRoute = async (context) => {
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = switchClinicSchema.safeParse(body);
    if (!parsed.success) return fail('Centro clínico no válido.', 422, parsed.error.flatten());

    const nextUser = await switchSessionToClinic(gate.user, parsed.data.clinicId);
    if (!nextUser) return fail('No tienes acceso a ese centro clínico.', 403);

    const maxAge = 60 * 60 * SESSION_HOURS;
    context.cookies.set(sessionCookieName, createSessionToken(nextUser, maxAge), {
      httpOnly: true,
      sameSite: 'lax',
      secure: isCookieSecure(),
      path: '/',
      maxAge
    });
    applyAdminPanelGateCookie(context.cookies, maxAge);

    return okWithCookies(
      context.cookies,
      {
        ...nextUser,
        clinicId: nextUser.clinicId,
        tenantId: nextUser.tenantId,
        profileId: nextUser.profileId
      },
      { message: 'Centro clínico actualizado.' }
    );
  } catch (error) {
    logError('auth.switch-clinic', error);
    return fail('No se pudo cambiar de centro.', 500);
  }
};
