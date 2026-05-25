import { defineMiddleware } from 'astro:middleware';
import { getEffectiveSessionUser, getSessionUser } from '@/lib/auth';
import {
  hasAdminPanelGate,
  hasClinicPanelSession,
  isAdminCenterPickerPath,
  isAdminPanelProtectedPath,
  isDemoGateBypass,
  isPlatformProtectedPath,
  isPlatformPublicPath
} from '@/lib/auth/adminPanelGate';
import {
  canAccessPlatformPanel,
  homePathForPortal,
  inferSessionPortal
} from '@/lib/auth/sessionPortal';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;

  if (isDemoGateBypass()) {
    return next();
  }

  const session = getSessionUser(context.cookies);
  const effective = getEffectiveSessionUser(context.cookies) ?? session;
  const portal = effective ? inferSessionPortal(effective) : null;

  if (isPlatformProtectedPath(pathname) && !isPlatformPublicPath(pathname)) {
    if (!session || session.role !== 'super_admin') {
      const nextTarget = encodeURIComponent(`${pathname}${search}`);
      return context.redirect(`/platform/login?next=${nextTarget}`);
    }
    if (!canAccessPlatformPanel(session)) {
      const sessionPortal = inferSessionPortal(session);
      if (sessionPortal === 'clinic') {
        return context.redirect(homePathForPortal('clinic', session.clinicId));
      }
      if (sessionPortal === 'patient') {
        return context.redirect('/paciente');
      }
      const nextTarget = encodeURIComponent(`${pathname}${search}`);
      return context.redirect(`/platform/login?next=${nextTarget}`);
    }
    return next();
  }

  if (!isAdminPanelProtectedPath(pathname)) {
    return next();
  }

  if (effective && portal === 'platform' && !effective.platformInspect) {
    return context.redirect('/platform');
  }

  if (await hasClinicPanelSession(context.cookies)) {
    if (
      effective &&
      portal === 'clinic' &&
      effective.role === 'super_admin' &&
      !effective.clinicId &&
      !effective.platformInspect &&
      !isAdminCenterPickerPath(pathname)
    ) {
      return context.redirect('/admin/elegir-centro');
    }
    return next();
  }

  if (hasAdminPanelGate(context.cookies)) {
    return next();
  }

  const nextTarget = encodeURIComponent(`${pathname}${search}`);
  return context.redirect(`/login/admin?next=${nextTarget}`);
});
