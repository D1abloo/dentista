import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listUsageMetrics } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);
  try {
    const limit = Math.min(100, Math.max(1, Number(context.url.searchParams.get('limit') ?? 30)));
    return ok(await listUsageMetrics(limit));
  } catch (error) {
    logError('platform.metrics', error);
    return fail('No se pudieron cargar las métricas.', 500);
  }
};
