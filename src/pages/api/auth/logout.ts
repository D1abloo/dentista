import type { APIRoute } from 'astro';
import { sessionCookieName } from '@/lib/auth';
import { okWithCookies } from '@/lib/auth/cookieResponse';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(sessionCookieName, { path: '/' });
  return okWithCookies(cookies, { loggedOut: true }, { message: 'Sesión cerrada.' });
};
