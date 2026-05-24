import type { APIRoute } from 'astro';
import { createPortalAccessCookie, portalAccessCookieName } from '@/lib/auth/portalAccess';
import { requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { createPortalAccessToken, exchangePortalToken } from '@/lib/services/portalAccess';
import { getStaffContextForSession } from '@/lib/services/staffContext';
import { hasSupabaseConfig, getSupabaseAdmin } from '@/lib/supabaseServer';
import { z } from 'zod';

export const prerender = false;

const enterSchema = z.object({
  patientId: z.string().uuid().optional()
});

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = gate.user.clinicId;
  const profileId = gate.user.profileId;
  if (!clinicId || !profileId) return fail('Sesión incompleta.', 403);

  try {
    const staffCtx = await getStaffContextForSession(gate.user);
    if (!staffCtx?.canAccessPatientPortal) {
      return fail('Tu usuario no tiene perfil vinculado para acceder al portal del paciente.', 403);
    }
    if (staffCtx.role === 'dentist' && !staffCtx.hasLinkedDentist) {
      return fail('Debes tener un perfil de dentista vinculado. Contacta con administración.', 403);
    }
    const body = await context.request.json().catch(() => ({}));
    const parsed = enterSchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());

    const db = getSupabaseAdmin();
    let patientId = parsed.data.patientId;

    if (!patientId) {
      let q = db
        .from('profiles')
        .select('id')
        .eq('role', 'patient')
        .order('created_at', { ascending: true })
        .limit(1);
      if (gate.user.tenantId) {
        q = q.eq('tenant_id', gate.user.tenantId);
      } else {
        q = q.eq('clinic_id', clinicId);
      }
      const { data: patientRow } = await q.maybeSingle();
      if (!patientRow?.id) {
        return fail('No hay pacientes en tu clínica para abrir el portal.', 404);
      }
      patientId = patientRow.id as string;
    }

    const { data: patient } = await db
      .from('profiles')
      .select('id, tenant_id, clinic_id')
      .eq('id', patientId)
      .eq('role', 'patient')
      .maybeSingle();
    if (!patient) return fail('Paciente no encontrado.', 404);

    const tenantId = gate.user.tenantId ?? (patient.tenant_id as string | null) ?? undefined;

    const created = await createPortalAccessToken({
      clinicId,
      tenantId,
      patientId,
      staffProfileId: profileId,
      label: 'Acceso rápido desde panel admin',
      expiresInHours: 8,
      createdByProfileId: profileId
    });

    const session = await exchangePortalToken(created.rawToken);
    if (!session) return fail('No se pudo activar la sesión en el portal.', 500);

    const cookie = createPortalAccessCookie(session, 8);
    context.cookies.set(portalAccessCookieName, cookie, {
      httpOnly: true,
      sameSite: 'lax',
      secure: import.meta.env.PROD,
      path: '/',
      maxAge: 60 * 60 * 8
    });

    return ok({
      patientId: session.patientId,
      patientName: session.patientName,
      redirectTo: '/paciente'
    });
  } catch (error) {
    logError('admin.portal-access.enter', error);
    return fail('No se pudo abrir el portal del paciente.', 500);
  }
};
