import type { APIRoute } from 'astro';
import { loadClinicDemoState } from '@/lib/bootstrap/clinicState';
import { requireSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) {
    return fail('Servicio no disponible.', 503);
  }

  const gate = requireSession(context);
  if (gate.response) return gate.response;
  if (gate.user.role === 'super_admin') {
    return fail('Usa el panel /platform para administración global.', 400);
  }
  if (!gate.user.clinicId) {
    return fail('Sesión sin clínica asignada.', 403);
  }

  try {
    const state = await loadClinicDemoState(gate.user);
    return ok(
      { state, tenantId: gate.user.tenantId ?? gate.user.clinicId, clinicId: gate.user.clinicId },
      { source: 'supabase' }
    );
  } catch (error) {
    logError('clinic.bootstrap', error);
    return fail('No se pudo cargar los datos de la clínica.', 500, error instanceof Error ? error.message : error);
  }
};
