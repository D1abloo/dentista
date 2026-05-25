import type { AstroCookies } from 'astro';

const NO_STORE = 'private, no-store, no-cache, must-revalidate';

/** Cookies seguras en Vercel/producción (HTTPS). */
export function isCookieSecure(): boolean {
  return import.meta.env.PROD === true || import.meta.env.VERCEL === '1';
}

export function applySetCookies(headers: Headers, cookies: AstroCookies) {
  for (const line of cookies.headers()) {
    headers.append('Set-Cookie', line);
  }
}

export function jsonWithCookies(
  cookies: AstroCookies,
  body: { data: unknown; error: unknown; meta?: Record<string, unknown> },
  status = 200
) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': NO_STORE
  });
  applySetCookies(headers, cookies);
  return new Response(JSON.stringify(body), { status, headers });
}

export function okWithCookies<T>(cookies: AstroCookies, data: T, meta: Record<string, unknown> = {}) {
  return jsonWithCookies(cookies, { data, error: null, meta }, 200);
}
