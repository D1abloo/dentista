import type { APIRoute } from 'astro';
import { ok, fail } from '@/lib/http';
import { listAvailability } from '@/lib/services/catalog';
import { availabilityQuerySchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const parsed = availabilityQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return fail('Query de disponibilidad inválida.', 422, parsed.error.flatten());
    const data = await listAvailability(parsed.data);
    return ok(data, { count: data.length, clinicId: parsed.data.clinicId, date: parsed.data.date });
  } catch (error) {
    return fail('No se pudo cargar la disponibilidad.', 500, error instanceof Error ? error.message : error);
  }
};
