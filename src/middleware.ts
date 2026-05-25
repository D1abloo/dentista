import { defineMiddleware } from 'astro:middleware';
import { getEffectiveSessionUser, getSessionUser } from '@/lib/auth';
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
import { inferSessionPortal } from '@/lib/auth/sessionPortal';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;

  if (isDemoGateBypass()) {
    return next();
  }

  const session = getSessionUser(context.cookies);
  const effective = getEffectiveSessionUser(context.cookies) ?? session;
  const portal = session ? inferSessionPortal(session) : null;

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

  if (session?.role === 'super_admin' && portal === 'platform') {
    return context.redirect('/platform');
  }

  if (await hasClinicPanelSession(context.cookies)) {
    if (
      effective &&
      portal === 'clinic' &&
      session?.role === 'super_admin' &&
      !session.clinicId &&
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
