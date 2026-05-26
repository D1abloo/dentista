import { defineMiddleware } from 'astro:middleware';
import {
  applyAdminPanelGateCookie,
  hasAdminPanelGate,
  isDemoGateBypass
} from '@/lib/auth/adminPanelGate';
import {
  hasClinicPanelHtmlAccess,
  hasPatientPortalHtmlAccess,
  isAdminAuthPage,
  isAdminPanelHtmlPath,
  isPatientAuthPage,
  isPatientPortalHtmlPath,
  normalizePanelPath
} from '@/lib/auth/panelRouteAccess';

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = normalizePanelPath(context.url.pathname);
  const { search } = context.url;

  if (isDemoGateBypass()) {
    return next();
  }

  if (isAdminAuthPage(pathname) || isPatientAuthPage(pathname) || pathname === '/login') {
    return next();
  }

  if (isAdminPanelHtmlPath(pathname)) {
    if (await hasClinicPanelHtmlAccess(context.cookies)) {
      if (!hasAdminPanelGate(context.cookies)) {
        applyAdminPanelGateCookie(context.cookies);
      }
      return next();
    }
    if (hasAdminPanelGate(context.cookies)) {
      return next();
    }
    const nextTarget = encodeURIComponent(`${pathname}${search}`);
    return context.redirect(`/login/admin?next=${nextTarget}`);
  }

  if (isPatientPortalHtmlPath(pathname)) {
    if (hasPatientPortalHtmlAccess(context.cookies)) {
      return next();
    }
    const nextTarget = encodeURIComponent(`${pathname}${search}`);
    return context.redirect(`/portal-paciente?next=${nextTarget}`);
  }

  return next();
});
