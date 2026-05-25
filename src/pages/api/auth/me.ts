import type { APIRoute } from 'astro';
import { getEffectiveSessionUser, getSessionUser } from '@/lib/auth';
import { fail, ok } from '@/lib/http';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) return fail('No autenticado.', 401);
  const effective = getEffectiveSessionUser(cookies) ?? user;
  const payload = {
    ...effective,
    baseRole: user.role,
    sessionPortal: user.sessionPortal ?? effective.sessionPortal,
    inspectActive: effective.platformInspect === true
  };
  return ok(payload, { authenticated: true });
};
