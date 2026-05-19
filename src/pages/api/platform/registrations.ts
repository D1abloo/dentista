import type { APIRoute } from 'astro';
import { requireSuperAdmin } from '@/lib/platform/auth';
import { listRegistrations, reviewRegistration } from '@/lib/platform/service';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { registrationReviewSchema } from '@/lib/validators';
import { hasSupabaseConfig } from '@/lib/supabaseServer';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);
  try {
    const status = context.url.searchParams.get('status') ?? undefined;
    const list = await listRegistrations(
      status === 'pending' || status === 'approved' || status === 'rejected' ? status : undefined
    );
    return ok(list);
  } catch (error) {
    logError('platform.registrations.list', error);
    return fail('No se pudieron listar los registros.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  const gate = requireSuperAdmin(context);
  if (gate.response) return gate.response;
  if (!hasSupabaseConfig()) return fail('Supabase no configurado.', 503);
  try {
    const body = await context.request.json();
    const parsed = registrationReviewSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());
    const result = await reviewRegistration(parsed.data.id, parsed.data.decision, parsed.data.review_notes);
    return ok(result, { message: parsed.data.decision === 'approved' ? 'Clínica aprobada.' : 'Solicitud rechazada.' });
  } catch (error) {
    logError('platform.registrations.review', error);
    return fail('No se pudo procesar la solicitud.', 500);
  }
};
