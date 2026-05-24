import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, requireStaffSession } from '@/lib/api/guards';
import { created, fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import {
  createClinicalProfessionalRecord,
  linkClinicalProfessionalUser,
  listClinicalProfessionals,
  mapDentistRow,
  unlinkClinicalProfessionalUser,
  updateClinicalProfessionalRecord
} from '@/lib/services/clinicalProfessionals';
import { hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer';
import type { Dentist } from '@/types/demo';
import {
  clinicalProfessionalBodySchema,
  linkProfessionalUserSchema,
  unlinkProfessionalUserSchema
} from '@/lib/validators';

export const prerender = false;

function bodyToDentist(
  parsed: ReturnType<typeof clinicalProfessionalBodySchema.parse>,
  tenantId: string,
  existingId?: string
): Dentist {
  return {
    id: existingId ?? parsed.dentistId ?? crypto.randomUUID(),
    clinicId: parsed.clinicId,
    tenantId,
    profileId: parsed.profileId,
    fullName: parsed.fullName,
    visibleTitle: parsed.visibleTitle,
    collegiateNumber: parsed.collegiateNumber,
    professionalCollege: parsed.professionalCollege,
    specialty: parsed.specialty,
    secondarySpecialties: parsed.secondarySpecialties ?? [],
    languages: parsed.languages ?? [],
    email: parsed.email ?? '',
    phone: parsed.phone ?? '',
    reportBio: parsed.reportBio,
    agendaColor: parsed.agendaColor ?? '#14b8a6',
    photoRef: parsed.photoRef,
    signatureRef: parsed.signatureRef,
    photoName: parsed.photoName,
    signatureName: parsed.signatureName,
    schedule: 'Lun–Vie 09:00–17:00',
    active: parsed.active
  };
}

export const GET: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = context.url.searchParams.get('clinicId') ?? gate.user.clinicId;
  if (!clinicId) return fail('Clínica requerida.', 422);
  const scopeErr = await assertClinicScopeAsync(gate.user, clinicId);
  if (scopeErr) return scopeErr;

  try {
    const rows = await listClinicalProfessionals(clinicId);
    const tenantId = gate.user.tenantId ?? '';
    const professionals = rows.map((r) => mapDentistRow(r, tenantId || r.tenant_id || ''));
    return ok({ professionals });
  } catch (error) {
    logError('clinical-professionals.get', error);
    return fail('No se pudieron cargar los perfiles.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  if (isDemoMode()) return fail('En modo demo guarda desde el panel.', 400);
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = clinicalProfessionalBodySchema.safeParse(body);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());
    const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;

    const tenantId = gate.user.tenantId ?? '';
    const dentist = bodyToDentist(parsed.data, tenantId);
    const row = await createClinicalProfessionalRecord(gate.user, parsed.data.clinicId, dentist);
    return created(mapDentistRow(row, tenantId || row.tenant_id || ''), { message: 'Profesional creado.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear.';
    return fail(message, 500);
  }
};

export const PATCH: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  if (isDemoMode()) return fail('En modo demo guarda desde el panel.', 400);
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const action = typeof body?.action === 'string' ? body.action : '';

    if (action === 'link') {
      const parsed = linkProfessionalUserSchema.safeParse(body);
      if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());
      const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
      if (scopeErr) return scopeErr;
      const row = await linkClinicalProfessionalUser(
        gate.user,
        parsed.data.clinicId,
        parsed.data.dentistId,
        parsed.data.profileId
      );
      const tenantId = gate.user.tenantId ?? '';
      return ok(mapDentistRow(row, tenantId || row.tenant_id || ''), { message: 'Usuario vinculado.' });
    }

    if (action === 'unlink') {
      const parsed = unlinkProfessionalUserSchema.safeParse(body);
      if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());
      const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
      if (scopeErr) return scopeErr;
      const row = await unlinkClinicalProfessionalUser(
        gate.user,
        parsed.data.clinicId,
        parsed.data.dentistId
      );
      const tenantId = gate.user.tenantId ?? '';
      return ok(mapDentistRow(row, tenantId || row.tenant_id || ''), { message: 'Usuario desvinculado.' });
    }

    const parsed = clinicalProfessionalBodySchema.safeParse(body);
    if (!parsed.success || !parsed.data.dentistId) {
      return fail('Informe dentistId para actualizar.', 422, parsed.success ? undefined : parsed.error.flatten());
    }
    const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;

    const tenantId = gate.user.tenantId ?? '';
    const dentist = bodyToDentist(parsed.data, tenantId, parsed.data.dentistId);
    const row = await updateClinicalProfessionalRecord(gate.user, parsed.data.clinicId, dentist);
    return ok(mapDentistRow(row, tenantId || row.tenant_id || ''), { message: 'Perfil guardado correctamente.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar el perfil.';
    return fail(message, 500);
  }
};
