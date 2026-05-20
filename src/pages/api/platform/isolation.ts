import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { fetchIsolationReport } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);
  try {
    return ok(await fetchIsolationReport());
  } catch (error) {
    logError('platform.isolation', error);
    return fail('No se pudo cargar el informe de aislamiento.', 500);
  }
};
