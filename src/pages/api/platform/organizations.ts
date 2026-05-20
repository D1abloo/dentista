import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listOrganizations } from '@/lib/platform/service';
import { createBranch, createOrganizationWithBranches } from '@/lib/services/branches';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { organizationCreateSchema, platformBranchCreateSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);
  try {
    return ok(await listOrganizations());
  } catch (error) {
    logError('platform.organizations.list', error);
    return fail('No se pudieron listar las organizaciones.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);
  try {
    const body = await context.request.json();
    const orgParsed = organizationCreateSchema.safeParse(body);
    if (orgParsed.success) {
      const result = await createOrganizationWithBranches(orgParsed.data);
      return ok(result, { message: 'Organización creada con sus sedes.' });
    }
    const branchParsed = platformBranchCreateSchema.safeParse(body);
    if (branchParsed.success) {
      const branch = await createBranch(branchParsed.data.tenantId, branchParsed.data);
      return ok(branch, { message: 'Sede añadida a la organización.' });
    }
    return fail('Payload inválido.', 422);
  } catch (error) {
    logError('platform.organizations.create', error);
    return fail('No se pudo crear la organización o sede.', 500);
  }
};
