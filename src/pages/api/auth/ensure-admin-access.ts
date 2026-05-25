import type { APIRoute } from 'astro';
import { applyAdminPanelGateCookie, hasClinicPanelSession } from '@/lib/auth/adminPanelGate';
import { fail, ok } from '@/lib/http';

export const prerender = false;

const SESSION_HOURS = 8;

/** Refresca la cookie de acceso al panel clínica tras login o cambio de centro. */
export const POST: APIRoute = async ({ cookies }) => {
  if (!(await hasClinicPanelSession(cookies))) {
    return fail('No tienes acceso al panel administrativo.', 403);
  }
  const maxAge = 60 * 60 * SESSION_HOURS;
  applyAdminPanelGateCookie(cookies, maxAge);
  return ok({ granted: true });
};
