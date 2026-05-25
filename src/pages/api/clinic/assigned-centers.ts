import type { APIRoute } from 'astro';
import { requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { isPlatformAppAdminSession } from '@/lib/auth/platformClinicAccess';
import { listAssignedCenters } from '@/lib/services/clinicSwitch';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Base de datos no configurada.', 503);

  try {
    const centers = await listAssignedCenters(gate.user);
    const allClinicsAccess = await isPlatformAppAdminSession(gate.user);
    return ok({ centers, allClinicsAccess });
  } catch (error) {
    logError('clinic.assigned-centers', error);
    return fail('No se pudieron cargar tus centros.', 500);
  }
};
