import type { APIRoute } from 'astro';
import { ok, fail } from '@/lib/http';
import { listDentists } from '@/lib/services/catalog';
import { clinicQuerySchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const parsed = clinicQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return fail('Query de odontólogos inválida.', 422, parsed.error.flatten());
    const data = await listDentists(parsed.data.clinicId);
    return ok(data, { count: data.length, clinicId: parsed.data.clinicId });
  } catch (error) {
    return fail('No se pudieron cargar los odontólogos.', 500, error instanceof Error ? error.message : error);
  }
};
