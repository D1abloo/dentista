import type { APIRoute } from 'astro';
import { isPatientSession, requireSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { listLinkedClinicsForPatient } from '@/lib/services/patientClinics';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const gate = requireSession(context);
    if (gate.response) return gate.response;
    if (!isPatientSession(gate.user) || !gate.user.patientId) {
      return fail('Se requiere sesión de paciente.', 403);
    }
    const patientId = gate.user.patientId;
    const clinics = await listLinkedClinicsForPatient(patientId);
    return ok({ clinics });
  } catch (error) {
    return fail(
      'No se pudieron cargar tus clínicas.',
      500,
      error instanceof Error ? error.message : error
    );
  }
};
