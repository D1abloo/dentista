import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listClinicUsers } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { platformUsersQuerySchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);
  try {
    const clinicId = context.url.searchParams.get('clinicId') ?? undefined;
    const parsed = platformUsersQuerySchema.safeParse({ clinicId });
    if (!parsed.success) return fail('Parámetros inválidos.', 422);
    return ok(await listClinicUsers(parsed.data.clinicId));
  } catch (error) {
    logError('platform.users.list', error);
    return fail('No se pudieron listar los usuarios.', 500);
  }
};
