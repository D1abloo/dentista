import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, requireStaffSession, resolveStaffClinicId } from '@/lib/api/guards';
import { ok, fail } from '@/lib/http';
import { listAdminModules, listIntegrations, listRolePermissions, listSystemLogs } from '@/lib/services/catalog';
import { clinicQuerySchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const gate = requireStaffSession(context);
    if (gate.response) return gate.response;
    const parsed = clinicQuerySchema.safeParse(Object.fromEntries(context.url.searchParams));
    if (!parsed.success) return fail('Query de módulos inválida.', 422, parsed.error.flatten());
    const clinicId = resolveStaffClinicId(gate.user, parsed.data.clinicId);
    const scopeErr = await assertClinicScopeAsync(gate.user, clinicId);
    if (scopeErr) return scopeErr;
    const data = {
      modules: listAdminModules(clinicId),
      logs: listSystemLogs(clinicId),
      rolePermissions: listRolePermissions(clinicId),
      integrations: listIntegrations(clinicId)
    };
    return ok(data, { clinicId });
  } catch (error) {
    return fail('No se pudieron cargar los módulos admin.', 500, error instanceof Error ? error.message : error);
  }
};
