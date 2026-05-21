import type { APIRoute } from 'astro';
import { createSessionToken, loginProductionUser, loginProductionUserWithPortal, sessionCookieName } from '@/lib/auth';
import { isPortalChoiceLogin } from '@/lib/auth/loginResolve';
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
      if (parsed.data.portal) {
        user = await loginProductionUserWithPortal(
          { email: parsed.data.email, password: parsed.data.password, role: 'auto' },
          parsed.data.portal
        );
      } else {
        user = await loginProductionUser(parsed.data);
      }
    } catch (err) {
      if (err instanceof AccountNotActivatedError) {
        return fail(err.message, 403);
      }
      throw err;
    }
    if (!user) return fail('Email, contraseña o tipo de acceso incorrecto.', 401);

    if (isPortalChoiceLogin(user)) {
      return ok(
        {
          choosePortal: true,
          email: user.email,
          name: user.name,
          options: user.options
        },
        { message: 'Selecciona el portal al que quieres acceder.' }
      );
    }

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
