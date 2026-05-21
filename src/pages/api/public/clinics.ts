import type { APIRoute } from 'astro';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { listPublicClinics } from '@/lib/services/patientRegistration';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async () => {
  if (!hasSupabaseConfig()) {
    return ok({ clinics: [], available: false });
  }
  try {
    const clinics = await listPublicClinics();
    return ok({ clinics, available: true });
  } catch (error) {
    logError('public.clinics', error);
    return fail('No se pudo cargar el listado de clínicas.', 500);
  }
};
