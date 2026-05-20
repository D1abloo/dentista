import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { branchCreateSchema, branchPatchSchema } from '@/lib/validators';
import { createBranch, listBranchesByTenant, updateBranch } from '@/lib/services/branches';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Base de datos no configurada.', 503);
  const tenantId = gate.user.tenantId;
  if (!tenantId) return fail('Tu usuario no tiene organización asignada.', 403);
  try {
    return ok(await listBranchesByTenant(tenantId));
  } catch (error) {
    logError('clinic.branches.list', error);
    return fail('No se pudieron listar las sedes.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Base de datos no configurada.', 503);
  const tenantId = gate.user.tenantId;
  if (!tenantId) return fail('Tu usuario no tiene organización asignada.', 403);
  try {
    const body = await context.request.json();
    const parsed = branchCreateSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());
    const branch = await createBranch(tenantId, parsed.data);
    return ok(branch, { message: 'Sede creada correctamente.' });
  } catch (error) {
    logError('clinic.branches.create', error);
    return fail('No se pudo crear la sede.', 500);
  }
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
