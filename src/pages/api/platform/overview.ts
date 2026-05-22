import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { fetchPlatformOverview } from '@/lib/platform/service';
import { buildPlatformDashboard } from '@/lib/platform/buildDashboard';
import { ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  try {
    const overview = hasSupabaseConfig() ? await fetchPlatformOverview() : null;
    const dashboard = buildPlatformDashboard(overview, { useDemo: !overview });
    return ok(dashboard);
  } catch (error) {
    logError('platform.overview', error);
    return ok(buildPlatformDashboard(null, { useDemo: true }));
  }
};
