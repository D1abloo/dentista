import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listPlatformSettings, updatePlatformSetting } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { platformSettingsPatchSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);
  try {
    return ok(await listPlatformSettings());
  } catch (error) {
    logError('platform.settings.list', error);
    return fail('No se pudo cargar la configuración.', 500);
  }
};

export const PATCH: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);
  try {
    const body = await context.request.json();
    const parsed = platformSettingsPatchSchema.safeParse(body);
    if (!parsed.success) return fail('Payload inválido.', 422, parsed.error.flatten());
    await updatePlatformSetting(parsed.data.key, parsed.data.value);
    return ok({ updated: true, key: parsed.data.key });
  } catch (error) {
    logError('platform.settings.patch', error);
    return fail('No se pudo actualizar la configuración.', 500);
  }
};
