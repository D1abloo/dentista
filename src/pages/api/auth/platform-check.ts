import type { APIRoute } from 'astro';
import { getSessionUser } from '@/lib/auth';
import { clearPlatformInspectCookie } from '@/lib/auth/platformInspect';
import { okWithCookies } from '@/lib/auth/cookieResponse';
import { ok } from '@/lib/http';

export const prerender = false;

/** Comprueba acceso al panel plataforma solo con la cookie base (sin sesión de inspección). */
export const GET: APIRoute = async ({ cookies }) => {
  const user = getSessionUser(cookies);
  if (!user || user.role !== 'super_admin') {
    return ok({ allowed: false as const });
  }

  clearPlatformInspectCookie(cookies);

  return okWithCookies(
    cookies,
    {
      allowed: true as const,
      email: user.email,
      name: user.name,
      sessionPortal: user.sessionPortal ?? 'platform'
    },
    { authenticated: true }
  );
};
