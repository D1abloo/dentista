import type { APIRoute } from 'astro';
import { requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import {
  createPortalAccessToken,
  listPortalAccessAudit,
  listPortalAccessTokens,
  listStaffProfilesForAudit,
  revokePortalAccessToken
} from '@/lib/services/portalAccess';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { portalAccessTokenCreateSchema, portalAccessTokenRevokeSchema } from '@/lib/validators';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export const prerender = false;

async function resolveCreatedBy(profileId: string | undefined, authEmail: string) {
  if (!profileId) return undefined;
  return profileId;
}

export const GET: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

  const auditOnly = context.url.searchParams.get('audit') === '1';
  const staffProfileId = context.url.searchParams.get('staffProfileId') ?? undefined;
  try {
    if (auditOnly) {
      const staffFilter =
        staffProfileId === 'me' ? gate.user.profileId : staffProfileId || undefined;
      const [rows, staffList] = await Promise.all([
        listPortalAccessAudit(clinicId, gate.user.tenantId, { staffProfileId: staffFilter }),
        listStaffProfilesForAudit(clinicId, gate.user.tenantId)
      ]);
      return ok({ audit: rows, staffProfiles: staffList });
    }
    const tokens = await listPortalAccessTokens(clinicId, gate.user.tenantId);
    return ok({ tokens });
  } catch (error) {
    logError('admin.portal-access.get', error);
    return fail('No se pudo cargar el acceso al portal.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

  try {
    const body = await context.request.json();
    const parsed = portalAccessTokenCreateSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());

    const db = getSupabaseAdmin();
    const { data: patient } = await db.from('profiles').select('id, clinic_id, tenant_id').eq('id', parsed.data.patientId).maybeSingle();
    if (!patient) return fail('Paciente no encontrado.', 404);

    let staffProfileId = parsed.data.staffProfileId;
    if (!staffProfileId && parsed.data.dentistId) {
      const { data: dentist } = await db.from('dentists').select('profile_id').eq('id', parsed.data.dentistId).maybeSingle();
      staffProfileId = dentist?.profile_id as string | undefined;
    }
    if (!staffProfileId) return fail('El profesional no tiene perfil vinculado.', 422);

    const { data: staff } = await db
      .from('profiles')
      .select('id, clinic_id, tenant_id, role')
      .eq('id', staffProfileId)
      .maybeSingle();
    if (!staff) return fail('Profesional no encontrado.', 404);

    const tenantId = gate.user.tenantId ?? patient.tenant_id ?? staff.tenant_id;
    if (tenantId && patient.tenant_id && patient.tenant_id !== tenantId && staff.tenant_id !== tenantId) {
      return fail('El paciente no pertenece a tu organización.', 403);
    }

    const created = await createPortalAccessToken({
      clinicId,
      tenantId,
      patientId: parsed.data.patientId,
      staffProfileId,
      targetClinicId: parsed.data.targetClinicId,
      label: parsed.data.label,
      expiresInHours: parsed.data.expiresInHours,
      createdByProfileId: await resolveCreatedBy(gate.user.profileId, gate.user.email)
    });

    return ok(
      {
        tokenId: created.tokenId,
        token: created.rawToken,
        expiresAt: created.expiresAt,
        portalUrl: `/paciente/acceso?token=${encodeURIComponent(created.rawToken)}`
      },
      { message: 'Token creado. Compártelo solo con el profesional autorizado.' }
    );
  } catch (error) {
    logError('admin.portal-access.post', error);
    return fail('No se pudo crear el token.', 500);
  }
};

export const PATCH: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

  try {
    const body = await context.request.json();
    const parsed = portalAccessTokenRevokeSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());
    await revokePortalAccessToken(parsed.data.tokenId, clinicId);
    return ok({ revoked: true }, { message: 'Token revocado.' });
  } catch (error) {
    logError('admin.portal-access.patch', error);
    return fail('No se pudo revocar el token.', 500);
  }
};
