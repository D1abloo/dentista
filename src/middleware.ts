import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from '@/lib/auth';
import { clearPlatformInspectCookie } from '@/lib/auth/platformInspect';
import {
  hasAdminPanelGate,
  hasClinicPanelSession,
  isAdminCenterPickerPath,
  isAdminPanelProtectedPath,
  isDemoGateBypass,
  isPlatformProtectedPath,
  isPlatformPublicPath
} from '@/lib/auth/adminPanelGate';
import { hasClinicPanelAccess } from '@/lib/auth/clinicPanelAccess';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;

  if (isDemoGateBypass()) {
    return next();
  }

  const session = getSessionUser(context.cookies);

  if (isPlatformPublicPath(pathname)) {
    return next();
  }

  if (isPlatformProtectedPath(pathname)) {
    if (!session || session.role !== 'super_admin') {
      const nextTarget = encodeURIComponent(`${pathname}${search}`);
      return context.redirect(`/platform/login?next=${nextTarget}`);
    }
    clearPlatformInspectCookie(context.cookies);
    return next();
  }

  if (!isAdminPanelProtectedPath(pathname)) {
    return next();
  }

  if (session?.role === 'super_admin' && session.sessionPortal === 'platform') {
    return context.redirect('/platform');
  }

  if (await hasClinicPanelAccess(context.cookies)) {
    if (
      session?.role === 'super_admin' &&
      session.sessionPortal === 'clinic' &&
      !session.clinicId &&
      !isAdminCenterPickerPath(pathname)
    ) {
      return context.redirect('/admin/elegir-centro');
    }
    return next();
  }

  if (hasAdminPanelGate(context.cookies) && pathname.startsWith('/login/admin')) {
    return next();
  }

  if (hasAdminPanelGate(context.cookies) && session) {
    return next();
  }

  const nextTarget = encodeURIComponent(`${pathname}${search}`);
  return context.redirect(`/login/admin?next=${nextTarget}`);
});
