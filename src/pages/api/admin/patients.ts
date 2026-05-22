import type { APIRoute } from 'astro';
import { requireStaffSession } from '@/lib/api/guards';
import { created, fail } from '@/lib/http';
import { logError } from '@/lib/logger';
import { registerPatientByStaff } from '@/lib/services/patientRegistration';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { adminPatientCreateSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

  try {
    const body = await context.request.json();
    const parsed = adminPatientCreateSchema.safeParse({ ...body, clinic_id: body?.clinic_id ?? clinicId });
    if (!parsed.success) return fail('Datos de paciente inválidos.', 422, parsed.error.flatten());

    const result = await registerPatientByStaff({
      ...parsed.data,
      clinic_id: parsed.data.clinic_id ?? clinicId
    });

    return created(
      { profileId: result.profileId, email: result.email, nhc: result.nhc },
      {
        message: result.activationEmailSent
          ? 'Paciente creado. Se envió email de activación del portal.'
          : 'Paciente creado. Comparte el acceso al portal manualmente si no llegó el email.'
      }
    );
  } catch (error) {
    logError('admin.patients.post', error);
    const msg = error instanceof Error ? error.message : 'No se pudo crear el paciente.';
    if (msg.includes('ya existe') || msg.includes('registrado')) return fail(msg, 409);
    return fail(msg, 500);
  }
};
