import type { APIRoute } from 'astro';
import { getEffectiveSessionUser } from '@/lib/auth';
import { ok } from '@/lib/http';
import { resolveEnterDestination } from '@/lib/services/clinicSwitch';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const user = getEffectiveSessionUser(cookies);
  const redirect = await resolveEnterDestination(user);
  return ok({ redirect, authenticated: Boolean(user) });
};
