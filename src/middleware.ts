import { defineMiddleware } from 'astro:middleware';
import {
  hasAdminPanelGate,
  hasClinicPanelSession,
  isAdminPanelProtectedPath,
  isDemoGateBypass
} from '@/lib/auth/adminPanelGate';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;

  if (isDemoGateBypass() || !isAdminPanelProtectedPath(pathname)) {
    return next();
  }

  if (await hasClinicPanelSession(context.cookies)) {
    return next();
  }

  if (hasAdminPanelGate(context.cookies)) {
    return next();
  }

  const nextTarget = encodeURIComponent(`${pathname}${search}`);
  return context.redirect(`/login/admin?next=${nextTarget}`);
});
