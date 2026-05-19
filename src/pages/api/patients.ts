import type { APIRoute } from 'astro';
import { getSessionUser } from '@/lib/auth';
import { ok, fail } from '@/lib/http';
import { listPatients } from '@/lib/services/catalog';
import { patientQuerySchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const user = getSessionUser(cookies);
    if (!user || (user.role !== 'admin' && user.role !== 'patient')) return fail('No autorizado para pacientes.', 401);
    const parsed = patientQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return fail('Query de pacientes inválida.', 422, parsed.error.flatten());
    const allPatients = await listPatients(parsed.data);
    const data = user.role === 'patient' ? allPatients.filter((patient) => patient.id === (user.patientId ?? 'p-maria')) : allPatients;
    return ok(data, { count: data.length, clinicId: parsed.data.clinicId });
  } catch (error) {
    return fail('No se pudieron cargar los pacientes.', 500, error instanceof Error ? error.message : error);
  }
};
