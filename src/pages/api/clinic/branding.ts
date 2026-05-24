import type { APIRoute } from 'astro';
import { requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { getClinicLogo, updateClinicLogo } from '@/lib/services/clinicBranding';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { clinicLogoSchema } from '@/lib/validators';

export const prerender = false;

const MANAGERS = new Set(['clinic_admin', 'owner', 'admin']);

export const GET: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);
  try {
    return ok({ logoUrl: await getClinicLogo(clinicId) });
  } catch (error) {
    logError('clinic.branding.get', error);
    return fail('No se pudo cargar el logo.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;
  const staffRole = gate.user.staffRole ?? '';
  if (!MANAGERS.has(staffRole)) return fail('No tienes permiso para cambiar el logo.', 403);
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

  try {
    const body = await context.request.json();
    const parsed = clinicLogoSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());

    const logoUrl = parsed.data.clear ? null : (parsed.data.logoDataUrl ?? null);
    if (!logoUrl && !parsed.data.clear) return fail('Indica una imagen o marca clear.', 422);

    const result = await updateClinicLogo(clinicId, logoUrl);
    return ok(result, { message: logoUrl ? 'Logo actualizado.' : 'Logo eliminado.' });
  } catch (error) {
    logError('clinic.branding.post', error);
    return fail('No se pudo guardar el logo.', 500);
  }
};
