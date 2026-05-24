import type { APIRoute } from 'astro';
import { loadClinicDemoState } from '@/lib/bootstrap/clinicState';
import { getEffectiveSessionUser } from '@/lib/auth';
import { enrichDualRoleClinicSession } from '@/lib/auth/dualRoleClinic';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) {
    return fail('Servicio no disponible.', 503);
  }

  let user = getEffectiveSessionUser(context.cookies);
  if (!user) return fail('No autenticado.', 401);

  if (user.role === 'super_admin' && !user.platformInspect) {
    user = await enrichDualRoleClinicSession(user);
  }

  if (user.role === 'super_admin' && !user.platformInspect && !user.clinicId) {
    return fail('Usa el panel /platform para administración global.', 400);
  }
  if (!user.clinicId) {
    return fail('Sesión sin clínica asignada.', 403);
  }

  try {
    const state = await loadClinicDemoState(user);
    return ok(
      {
        state,
        tenantId: user.tenantId ?? user.clinicId,
        clinicId: user.clinicId,
        patientId: user.role === 'patient' ? user.patientId : undefined,
        platformInspect: user.platformInspect ?? false
      },
      { source: 'supabase' }
    );
  } catch (error) {
    logError('clinic.bootstrap', error);
    return fail('No se pudo cargar los datos de la clínica.', 500, error instanceof Error ? error.message : error);
  }
};
