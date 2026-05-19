import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listClinics, setClinicPlan, setClinicStatus } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { clinicPlanSchema, clinicStatusSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);
  try {
    return ok(await listClinics());
  } catch (error) {
    logError('platform.clinics.list', error);
    return fail('No se pudieron listar las clínicas.', 500);
  }
};

export const PATCH: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);
  try {
    const body = await context.request.json();
    const statusParsed = clinicStatusSchema.safeParse(body);
    if (statusParsed.success) {
      await setClinicStatus(statusParsed.data.clinicId, statusParsed.data.status);
      return ok({ updated: true, field: 'status' });
    }
    const planParsed = clinicPlanSchema.safeParse(body);
    if (planParsed.success) {
      await setClinicPlan(planParsed.data.clinicId, planParsed.data.plan);
      return ok({ updated: true, field: 'plan' });
    }
    return fail('Payload inválido.', 422);
  } catch (error) {
    logError('platform.clinics.patch', error);
    return fail('No se pudo actualizar la clínica.', 500);
  }
};
