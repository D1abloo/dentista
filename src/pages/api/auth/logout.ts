import type { APIRoute } from 'astro';
import { sessionCookieName } from '@/lib/auth';
import { ok } from '@/lib/http';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(sessionCookieName, { path: '/' });
  return ok({ loggedOut: true }, { message: 'Sesión cerrada.' });
};
