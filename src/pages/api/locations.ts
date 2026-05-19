import type { APIRoute } from 'astro';
import { ok, fail } from '@/lib/http';
import { listLocations } from '@/lib/services/catalog';
import { clinicQuerySchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const parsed = clinicQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return fail('Query de ubicaciones inválida.', 422, parsed.error.flatten());
    const data = await listLocations(parsed.data.clinicId);
    return ok(data, { count: data.length, clinicId: parsed.data.clinicId });
  } catch (error) {
    return fail('No se pudieron cargar las ubicaciones.', 500, error instanceof Error ? error.message : error);
  }
};
