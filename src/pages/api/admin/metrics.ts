import type { APIRoute } from 'astro';
import { getSessionUser } from '@/lib/auth';
import { ok, fail } from '@/lib/http';
import { getAdminMetrics } from '@/lib/services/metrics';
import { clinicQuerySchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const user = getSessionUser(cookies);
    if (user?.role !== 'admin') return fail('No autorizado para métricas admin.', 401);
    const parsed = clinicQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return fail('Query de métricas inválida.', 422, parsed.error.flatten());
    const { clinicId } = parsed.data;
    const data = await getAdminMetrics(clinicId);
    return ok(data, { cache: 'redis-or-memory', clinicId });
  } catch (error) {
    return fail('No se pudieron cargar las métricas admin.', 500, error instanceof Error ? error.message : error);
  }
};
