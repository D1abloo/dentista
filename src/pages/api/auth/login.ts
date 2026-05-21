import type { APIRoute } from 'astro';
import { createSessionToken, loginProductionUser, sessionCookieName } from '@/lib/auth';
import { AccountNotActivatedError } from '@/lib/auth/accountErrors';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { loginSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const payload = await request.json();
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) return fail('Credenciales inválidas.', 422, parsed.error.flatten());

    let user;
    try {
      user = await loginProductionUser(parsed.data);
    } catch (err) {
      if (err instanceof AccountNotActivatedError) {
        return fail(err.message, 403);
      }
      throw err;
    }
    if (!user) return fail('Email, contraseña o tipo de acceso incorrecto.', 401);

    cookies.set(sessionCookieName, createSessionToken(user), {
      httpOnly: true,
      sameSite: 'lax',
      secure: import.meta.env.PROD,
      path: '/',
      maxAge: 60 * 60 * 8
    });

    return ok(user, { message: 'Sesión iniciada correctamente.' });
  } catch (error) {
    logError('auth.login', error);
    return fail('No se pudo iniciar sesión.', 500, error instanceof Error ? error.message : error);
  }
};
