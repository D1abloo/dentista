import type { APIRoute } from 'astro';
import { getSessionUser } from '@/lib/auth';
import { fail, ok } from '@/lib/http';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) return fail('No autenticado.', 401);
  return ok(user);
};
