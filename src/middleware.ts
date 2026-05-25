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
import { homePathForPortal, inferSessionPortal } from '@/lib/auth/sessionPortal';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;

  if (isDemoGateBypass()) {
    return next();
  }

  const user = getEffectiveSessionUser(context.cookies) ?? getSessionUser(context.cookies);
  const portal = user ? inferSessionPortal(user) : null;

  if (isPlatformProtectedPath(pathname) && !isPlatformPublicPath(pathname)) {
    if (!user || user.role !== 'super_admin') {
      const nextTarget = encodeURIComponent(`${pathname}${search}`);
      return context.redirect(`/platform/login?next=${nextTarget}`);
    }
    if (portal === 'clinic' && !user.platformInspect) {
      return context.redirect(homePathForPortal('clinic', user.clinicId));
    }
    if (portal === 'patient') {
      return context.redirect('/paciente');
    }
    return next();
  }

  if (!isAdminPanelProtectedPath(pathname)) {
    return next();
  }

  if (user && portal === 'platform' && !user.platformInspect) {
    return context.redirect('/platform');
  }

  if (await hasClinicPanelSession(context.cookies)) {
    if (
      user &&
      portal === 'clinic' &&
      user.role === 'super_admin' &&
      !user.clinicId &&
      !user.platformInspect &&
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
