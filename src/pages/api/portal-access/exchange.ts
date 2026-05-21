import type { APIRoute } from 'astro';
import { createPortalAccessCookie, portalAccessCookieName } from '@/lib/auth/portalAccess';
import { requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { exchangePortalToken } from '@/lib/services/portalAccess';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { portalAccessExchangeSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = portalAccessExchangeSchema.safeParse(body);
    if (!parsed.success) return fail('Token inválido.', 422, parsed.error.flatten());

    const session = await exchangePortalToken(parsed.data.token);
    if (!session) return fail('Token no válido, expirado o revocado.', 401);
    if (gate.user.profileId && session.staffProfileId !== gate.user.profileId) {
      return fail('Este token no está asignado a tu usuario.', 403);
    }

    const cookie = createPortalAccessCookie(session, 8);
    context.cookies.set(portalAccessCookieName, cookie, {
      httpOnly: true,
      sameSite: 'lax',
      secure: import.meta.env.PROD,
      path: '/',
      maxAge: 60 * 60 * 8
    });

    return ok({
      patientId: session.patientId,
      patientName: session.patientName,
      redirectTo: '/paciente'
    });
  } catch (error) {
    logError('portal-access.exchange', error);
    return fail('No se pudo activar el acceso.', 500);
  }
};
