import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, isPatientSession, requireSession, requireStaffSession } from '@/lib/api/guards';
import { ok, fail } from '@/lib/http';
import { listPatients } from '@/lib/services/catalog';
import { patientQuerySchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const parsed = patientQuerySchema.safeParse(Object.fromEntries(context.url.searchParams));
    if (!parsed.success) return fail('Query de pacientes inválida.', 422, parsed.error.flatten());

    const gate = requireSession(context);
    if (gate.response) return gate.response;
    const user = gate.user;

    if (isPatientSession(user)) {
      if (!user.patientId) return fail('Sesión de paciente incompleta.', 403);
      const clinicId = user.clinicId ?? parsed.data.clinicId;
      const scopeErr = await assertClinicScopeAsync(user, clinicId);
      if (scopeErr) return scopeErr;
      const allPatients = await listPatients({ ...parsed.data, clinicId });
      const data = allPatients.filter((patient) => patient.id === user.patientId);
      return ok(data, { count: data.length, clinicId });
    }

    const staffGate = requireStaffSession(context);
    if (staffGate.response) return staffGate.response;
    const scopeErr = await assertClinicScopeAsync(staffGate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;
    const data = await listPatients(parsed.data);
    return ok(data, { count: data.length, clinicId: parsed.data.clinicId });
  } catch (error) {
    return fail('No se pudieron cargar los pacientes.', 500, error instanceof Error ? error.message : error);
  }
};
