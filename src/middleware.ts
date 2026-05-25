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
import { homePathForPortal, inferSessionPortal } from '@/lib/auth/sessionPortal';

function safePlatformNext(search: string): string | null {
  const next = new URLSearchParams(search).get('next');
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  if (!next.startsWith('/platform')) return null;
  return next;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;

  if (isDemoGateBypass()) {
    return next();
  }

  const session = getSessionUser(context.cookies);
  const effective = getEffectiveSessionUser(context.cookies) ?? session;
  const portal = effective ? inferSessionPortal(effective) : null;

  if (isPlatformPublicPath(pathname)) {
    if (session?.role === 'super_admin') {
      clearPlatformInspectCookie(context.cookies);
      const dest = safePlatformNext(search) ?? '/platform';
      return context.redirect(dest);
    }
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
