import { defineMiddleware } from 'astro:middleware';
import {
  hasAdminPanelGate,
  hasClinicPanelSession,
  isAdminEntryPath,
  isAdminPanelProtectedPath,
  isAdminPanelRoute,
  isDemoGateBypass
} from '@/lib/auth/adminPanelGate';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (isDemoGateBypass() || !isAdminPanelProtectedPath(pathname)) {
    return next();
  }

  if (isAdminEntryPath(pathname) || hasAdminPanelGate(context.cookies)) {
    return next();
  }

  if (isAdminPanelRoute(pathname) && hasClinicPanelSession(context.cookies)) {
    return next();
  }

  return context.redirect('/');
});
