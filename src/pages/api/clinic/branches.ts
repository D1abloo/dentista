import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { branchPatchSchema } from '@/lib/validators';
import { listAssignedClinicIdsForSession } from '@/lib/services/staffContext';
import { updateBranch } from '@/lib/services/branches';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Base de datos no configurada.', 503);
  try {
    const ids = await listAssignedClinicIdsForSession(gate.user);
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('clinics')
      .select('id, tenant_id, name, slug, email, phone, address, city, status, is_main_branch, subscription_plan, created_at')
      .in('id', ids);
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    logError('clinic.branches.list', error);
    return fail('No se pudieron listar las sedes.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;
  return fail(
    'Cada clínica es independiente. Registra una nueva clínica desde Plataforma → Organizaciones o el alta pública.',
    422
  );
};

export const PATCH: APIRoute = async (context) => {
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Base de datos no configurada.', 503);
  try {
    const body = await context.request.json();
    const parsed = branchPatchSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());
    const scope = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scope) return scope;
    await updateBranch(parsed.data.clinicId, parsed.data);
    return ok({ updated: true });
  } catch (error) {
    logError('clinic.branches.patch', error);
    return fail('No se pudo actualizar la sede.', 500);
  }
};
