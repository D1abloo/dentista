import type { APIRoute } from 'astro';
import { getSessionUser } from '@/lib/auth';
import { applyAdminPanelGateCookie } from '@/lib/auth/adminPanelGate';
import { hasClinicPanelAccess, shouldGrantAdminGateCookie } from '@/lib/auth/clinicPanelAccess';
import { okWithCookies } from '@/lib/auth/cookieResponse';
import { ok } from '@/lib/http';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const user = getSessionUser(cookies);
  if (!user || !(await hasClinicPanelAccess(cookies))) {
    return ok({ allowed: false as const });
  }

  if (shouldGrantAdminGateCookie(user)) {
    applyAdminPanelGateCookie(cookies);
  }

  return okWithCookies(
    cookies,
    {
      allowed: true as const,
      role: user.role,
      sessionPortal: user.sessionPortal ?? 'clinic',
      clinicId: user.clinicId
    },
    { authenticated: true }
  );
};
