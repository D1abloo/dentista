import type { APIRoute } from 'astro';
import { createSessionToken, loginProductionUser, loginProductionUserWithPortal, sessionCookieName } from '@/lib/auth';
import { applyAdminPanelGateCookie } from '@/lib/auth/adminPanelGate';
import { shouldGrantAdminGateCookie } from '@/lib/auth/clinicPanelAccess';
import { isPortalChoiceLogin } from '@/lib/auth/loginResolve';
import {
  detectClinicLoginDenial,
  isPortalChoiceLogin as isClinicPortalChoice,
  loginClinicAdminOnly
} from '@/lib/auth/clinicLoginFlow';
import {
  hasValidAuthWithoutPlatformAccess,
  loginSuperAdminOnly
} from '@/lib/auth/platformLoginFlow';
import { AccountNotActivatedError } from '@/lib/auth/accountErrors';
import { isCookieSecure, okWithCookies } from '@/lib/auth/cookieResponse';
import { clearPlatformInspectCookie } from '@/lib/auth/platformInspect';
import { isPlatformAppAdminEmail } from '@/lib/auth/platformClinicAccess';
import { fail } from '@/lib/http';
import { logError } from '@/lib/logger';
import { auditAuthFailure, auditAuthSuccess } from '@/lib/audit/authAudit';
import { loginSchema } from '@/lib/validators';

export const prerender = false;

const SESSION_HOURS = 8;
const REMEMBER_DAYS = 30;

function setSessionCookie(
  cookies: Parameters<APIRoute>[0]['cookies'],
  user: Parameters<typeof createSessionToken>[0],
  maxAge: number,
  grantAdminGate = false
) {
  cookies.set(sessionCookieName, createSessionToken(user, maxAge), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isCookieSecure(),
    path: '/',
    maxAge
  });
  if (grantAdminGate) applyAdminPanelGateCookie(cookies, maxAge);
}

export const POST: APIRoute = async (context) => {
  const { request, cookies } = context;
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
          await auditAuthFailure({
            request,
            email,
            role: 'super_admin',
            reason: 'not_platform_admin',
            denied: true,
            route: '/platform/login'
          });
          return fail('Tu cuenta no tiene acceso a plataforma.', 403);
        }
        await auditAuthFailure({
          request,
          email,
          role: 'super_admin',
          reason: 'invalid_credentials',
          route: '/platform/login'
        });
        return fail('Credenciales incorrectas.', 401);
      }

      await auditAuthSuccess({
        request,
        email: user.email,
        role: 'super_admin',
        userId: user.profileId,
        route: '/platform/login'
      });

      clearPlatformInspectCookie(cookies);
      const platformUser = { ...user, sessionPortal: 'platform' as const };
      setSessionCookie(cookies, platformUser, maxAge);

      return okWithCookies(cookies, platformUser, { message: 'Sesión iniciada correctamente.' });
    }

    if (parsed.data.role === 'admin') {
      const email = parsed.data.email.trim().toLowerCase();
      let user;
      try {
        user = await loginClinicAdminOnly(parsed.data);
      } catch (err) {
        if (err instanceof AccountNotActivatedError) {
          return fail(err.message, 403);
        }
        throw err;
      }

      if (!user) {
        const denial = await detectClinicLoginDenial(email, parsed.data.password);
        if (denial === 'not_clinic_staff' || denial === 'platform_only') {
          await auditAuthFailure({
            request,
            email,
            role: 'admin',
            reason: denial,
            denied: true,
            route: '/login/admin'
          });
          return fail('Tu cuenta no tiene acceso al panel clínica.', 403);
        }
        await auditAuthFailure({
          request,
          email,
          role: 'admin',
          reason: 'invalid_credentials',
          route: '/login/admin'
        });
        return fail('Credenciales incorrectas.', 401);
      }

      if (isClinicPortalChoice(user)) {
        const adminOpts = user.options.filter((o) => o.id === 'admin');
        if (!adminOpts.length) {
          return fail('Tu cuenta no tiene acceso al panel clínica.', 403);
        }
        if (adminOpts.length === 1) {
          const completed = await loginProductionUserWithPortal(
            { email: parsed.data.email, password: parsed.data.password, role: 'admin' },
            'admin'
          );
          if (!completed || isPortalChoiceLogin(completed)) {
            return fail('Tu cuenta no tiene acceso al panel clínica.', 403);
          }
          if (completed.role === 'patient') {
            return fail('Tu cuenta no tiene acceso al panel clínica.', 403);
          }
          if (completed.role === 'super_admin' && !(await isPlatformAppAdminEmail(completed.email))) {
            return fail('Tu cuenta no tiene acceso al panel clínica.', 403);
          }
          await auditAuthSuccess({
            request,
            email: completed.email,
            role: completed.staffRole ?? 'clinic_admin',
            clinicId: completed.clinicId,
            tenantId: completed.tenantId,
            userId: completed.profileId,
            route: '/login/admin'
          });
          setSessionCookie(cookies, completed, maxAge, shouldGrantAdminGateCookie(completed));
          return okWithCookies(cookies, completed, { message: 'Sesión iniciada correctamente.' });
        }
        return okWithCookies(
          cookies,
          {
            choosePortal: true,
            email: user.email,
            name: user.name,
            options: adminOpts
          },
          { message: 'Selecciona el portal al que quieres acceder.' }
        );
      }

      if (user.role === 'patient') {
        return fail('Tu cuenta no tiene acceso al panel clínica.', 403);
      }
      if (user.role === 'super_admin' && !(await isPlatformAppAdminEmail(user.email))) {
        return fail('Tu cuenta no tiene acceso al panel clínica.', 403);
      }

      await auditAuthSuccess({
        request,
        email: user.email,
        role: user.role === 'super_admin' ? 'super_admin' : (user.staffRole ?? user.role),
        clinicId: user.clinicId,
        tenantId: user.tenantId,
        userId: user.profileId,
        route: '/login/admin'
      });

      setSessionCookie(cookies, user, maxAge, shouldGrantAdminGateCookie(user));

      return okWithCookies(cookies, user, { message: 'Sesión iniciada correctamente.' });
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
    if (!user) {
      await auditAuthFailure({
        request,
        email: parsed.data.email.trim().toLowerCase(),
        role: parsed.data.portal ?? 'patient',
        reason: 'invalid_credentials',
        route: '/login/paciente'
      });
      return fail('Email, contraseña o tipo de acceso incorrecto.', 401);
    }

    if (isPortalChoiceLogin(user)) {
      return okWithCookies(
        cookies,
        {
          choosePortal: true,
          email: user.email,
          name: user.name,
          options: user.options
        },
        { message: 'Selecciona el portal al que quieres acceder.' }
      );
    }

    await auditAuthSuccess({
      request,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
      tenantId: user.tenantId,
      patientId: user.patientId,
      userId: user.profileId,
      route: parsed.data.portal === 'patient' ? '/login/paciente' : '/login'
    });

    setSessionCookie(cookies, user, maxAge, shouldGrantAdminGateCookie(user));

    return okWithCookies(cookies, user, { message: 'Sesión iniciada correctamente.' });
  } catch (error) {
    logError('auth.login', error);
    return fail('No se pudo iniciar sesión. Inténtalo de nuevo.', 500, error instanceof Error ? error.message : error);
  }
};
