import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { fetchPlatformOverview } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) {
    return fail('Supabase no configurado. Completa las variables de entorno.', 503);
  }
  try {
    const data = await fetchPlatformOverview();
    return ok(data);
  } catch (error) {
    logError('platform.overview', error);
    return fail('No se pudo cargar el resumen.', 500, error instanceof Error ? error.message : error);
  }
};
