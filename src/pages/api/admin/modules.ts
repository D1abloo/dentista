import type { APIRoute } from 'astro';
import { getSessionUser } from '@/lib/auth';
import { ok, fail } from '@/lib/http';
import { listAdminModules, listIntegrations, listRolePermissions, listSystemLogs } from '@/lib/services/catalog';
import { clinicQuerySchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const user = getSessionUser(cookies);
    if (user?.role !== 'admin') return fail('No autorizado para módulos admin.', 401);
    const parsed = clinicQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return fail('Query de módulos inválida.', 422, parsed.error.flatten());
    const { clinicId } = parsed.data;
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
