import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, requireStaffSession, resolveStaffClinicId } from '@/lib/api/guards';
import { ok, fail } from '@/lib/http';
import { getAdminMetrics } from '@/lib/services/metrics';
import { clinicQuerySchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const gate = await requireStaffSession(context);
    if (gate.response) return gate.response;
    const parsed = clinicQuerySchema.safeParse(Object.fromEntries(context.url.searchParams));
    if (!parsed.success) return fail('Query de métricas inválida.', 422, parsed.error.flatten());
    const clinicId = resolveStaffClinicId(gate.user, parsed.data.clinicId);
    const scopeErr = await assertClinicScopeAsync(gate.user, clinicId);
    if (scopeErr) return scopeErr;
    const data = await getAdminMetrics(clinicId);
    return ok(data, { cache: 'redis-or-memory', clinicId });
  } catch (error) {
    return fail('No se pudieron cargar las métricas admin.', 500, error instanceof Error ? error.message : error);
  }
};
