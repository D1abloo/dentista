import type { APIRoute } from 'astro';
import { requireClinicSessionAsync, requireStaffSession } from '@/lib/api/guards';
import { created, fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { createTreatmentRecord, listTreatments } from '@/lib/services/catalog';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { clinicQuerySchema, treatmentCreateSchema } from '@/lib/validators';

export const prerender = false;

const MANAGERS = new Set(['clinic_admin', 'owner', 'admin']);

export const GET: APIRoute = async ({ url }) => {
  try {
    const parsed = clinicQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return fail('Query de tratamientos inválida.', 422, parsed.error.flatten());
    const data = await listTreatments(parsed.data.clinicId);
    return ok(data, { count: data.length, clinicId: parsed.data.clinicId });
  } catch (error) {
    return fail('No se pudieron cargar los tratamientos.', 500, error instanceof Error ? error.message : error);
  }
};

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;

  const staffRole = gate.user.staffRole ?? '';
  if (!MANAGERS.has(staffRole)) return fail('No tienes permiso para gestionar tratamientos.', 403);

  try {
    const body = await context.request.json();
    const parsed = treatmentCreateSchema.safeParse(body);
    if (!parsed.success) return fail('Datos de tratamiento inválidos.', 422, parsed.error.flatten());

    const clinicId = parsed.data.clinicId ?? gate.user.clinicId;
    if (!clinicId) return fail('Indica la sede.', 422);

    const scopeGate = await requireClinicSessionAsync(context, clinicId);
    if (scopeGate.response) return scopeGate.response;

    const priceCents = Math.round(parsed.data.price * 100);
    const row = await createTreatmentRecord({
      clinicId,
      name: parsed.data.name,
      description: parsed.data.description,
      durationMinutes: parsed.data.durationMinutes,
      priceCents,
      active: parsed.data.active
    });

    return created(
      {
        treatment: {
          id: row.id,
          clinicId: row.clinicId,
          name: row.name,
          description: row.description,
          durationMinutes: row.durationMinutes,
          price: Math.round(row.priceCents / 100),
          active: parsed.data.active
        }
      },
      { message: 'Tratamiento guardado.' }
    );
  } catch (error) {
    logError('treatments.post', error);
    return fail('No se pudo guardar el tratamiento.', 500, error instanceof Error ? error.message : error);
  }
};
