import type { APIRoute } from 'astro';
import { createSessionToken, loginProductionUser, loginProductionUserWithPortal, sessionCookieName } from '@/lib/auth';
import { isPortalChoiceLogin } from '@/lib/auth/loginResolve';
import {
  hasValidAuthWithoutPlatformAccess,
  loginSuperAdminOnly
} from '@/lib/auth/platformLoginFlow';
import { AccountNotActivatedError } from '@/lib/auth/accountErrors';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { logPlatformAudit } from '@/lib/platform/platformAudit';
import { loginSchema } from '@/lib/validators';

export const prerender = false;

const SESSION_HOURS = 8;
const REMEMBER_DAYS = 30;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const payload = await request.json();
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) return fail('Credenciales inválidas.', 422, parsed.error.flatten());

    const remember = Boolean(parsed.data.remember);
    const maxAge = remember ? 60 * 60 * 24 * REMEMBER_DAYS : 60 * 60 * SESSION_HOURS;

    if (parsed.data.role === 'super_admin') {
      let user;
      try {
        user = await loginSuperAdminOnly(parsed.data);
      } catch (err) {
        if (err instanceof AccountNotActivatedError) {
          return fail(err.message, 403);
        }
        throw err;
      }

      if (!user) {
        const email = parsed.data.email.trim().toLowerCase();
        if (await hasValidAuthWithoutPlatformAccess(email, parsed.data.password)) {
          await logPlatformAudit({
            action: 'auth.login_denied',
            entity: 'platform_admin',
            metadata: { reason: 'not_platform_admin' },
            actorEmail: email
          });
          return fail('Tu cuenta no tiene acceso a plataforma.', 403);
        }
        await logPlatformAudit({
          action: 'auth.login_failed',
          entity: 'platform_admin',
          metadata: { reason: 'invalid_credentials' },
          actorEmail: email
        });
        return fail('Credenciales incorrectas.', 401);
      }

      await logPlatformAudit({
        action: 'auth.login_success',
        entity: 'platform_admin',
        actorEmail: user.email,
        metadata: { remember }
      });

      cookies.set(sessionCookieName, createSessionToken(user), {
        httpOnly: true,
        sameSite: 'lax',
        secure: import.meta.env.PROD,
        path: '/',
        maxAge
      });

      return ok(user, { message: 'Sesión iniciada correctamente.' });
    }

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
      maxAge
    });

    return ok(user, { message: 'Sesión iniciada correctamente.' });
  } catch (error) {
    logError('auth.login', error);
    return fail('No se pudo iniciar sesión. Inténtalo de nuevo.', 500, error instanceof Error ? error.message : error);
  }
};
