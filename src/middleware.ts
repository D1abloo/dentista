import { defineMiddleware } from 'astro:middleware';
import {
  hasAdminPanelGate,
  isAdminEntryPath,
  isAdminPanelProtectedPath,
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

  return context.redirect('/');
});
