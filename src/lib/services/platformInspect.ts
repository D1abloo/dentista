import { createPortalAccessCookie, generatePortalToken, type PortalAccessSession } from '@/lib/auth/portalAccess';
import { createPlatformInspectCookie, type PlatformInspectMode } from '@/lib/auth/platformInspect';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import { logPortalAccessAudit } from '@/lib/services/portalAccess';

export async function logPlatformInspectEvent(input: {
  actorEmail: string;
  actorName?: string;
  accessRole?: string;
  inspectMode: PlatformInspectMode;
  clinicId: string;
  tenantId?: string | null;
  patientId?: string | null;
  eventType: string;
  pagePath?: string;
  resourceLabel?: string;
  resourceId?: string;
  meta?: Record<string, unknown>;
}) {
  if (!hasSupabaseConfig()) return;
  const db = getSupabaseAdmin();
  await db.from('platform_inspect_audit').insert({
    actor_email: input.actorEmail,
    actor_name: input.actorName ?? null,
    access_role: input.accessRole ?? 'super_admin',
    inspect_mode: input.inspectMode,
    clinic_id: input.clinicId,
    tenant_id: input.tenantId ?? null,
    patient_id: input.patientId ?? null,
    event_type: input.eventType,
    page_path: input.pagePath ?? null,
    resource_label: input.resourceLabel ?? null,
    resource_id: input.resourceId ?? null,
    meta: input.meta ?? {}
  });
}

export async function startClinicInspect(input: {
  superAdminEmail: string;
  superAdminName: string;
  clinicId: string;
}) {
  if (!hasSupabaseConfig()) throw new Error('Servicio no disponible.');
  const db = getSupabaseAdmin();
  const { data: clinic, error } = await db
    .from('clinics')
    .select('id, tenant_id, name, status')
    .eq('id', input.clinicId)
    .maybeSingle();
  if (error || !clinic) throw new Error('Clínica no encontrada.');
  if (clinic.status !== 'active') throw new Error('La clínica no está activa.');

  await logPlatformInspectEvent({
    actorEmail: input.superAdminEmail,
    actorName: input.superAdminName,
    inspectMode: 'clinic_admin',
    clinicId: clinic.id,
    tenantId: clinic.tenant_id,
    eventType: 'inspect_clinic_start',
    resourceLabel: clinic.name as string,
    pagePath: '/admin'
  });

  const cookie = createPlatformInspectCookie({
    superAdminEmail: input.superAdminEmail,
    superAdminName: input.superAdminName,
    accessRole: 'super_admin',
    mode: 'clinic_admin',
    clinicId: clinic.id as string,
    tenantId: (clinic.tenant_id as string | null) ?? undefined
  });

  return { cookie, clinicName: clinic.name as string, redirect: '/admin' };
}

export async function startPatientPortalInspect(input: {
  superAdminEmail: string;
  superAdminName: string;
  clinicId: string;
  patientId: string;
  label?: string;
}) {
  if (!hasSupabaseConfig()) throw new Error('Servicio no disponible.');
  const db = getSupabaseAdmin();

  const { data: patient, error: pErr } = await db
    .from('profiles')
    .select('id, full_name, email, clinic_id, tenant_id, role')
    .eq('id', input.patientId)
    .maybeSingle();
  if (pErr || !patient || patient.role !== 'patient') throw new Error('Paciente no encontrado.');

  const { data: clinic } = await db.from('clinics').select('id, tenant_id, name').eq('id', input.clinicId).maybeSingle();

  const { raw, hash } = generatePortalToken();
  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

  const { data: tokenRow, error: tErr } = await db
    .from('patient_portal_access_tokens')
    .insert({
      clinic_id: input.clinicId,
      tenant_id: clinic?.tenant_id ?? patient.tenant_id ?? null,
      patient_id: input.patientId,
      staff_profile_id: null,
      token_hash: hash,
      label: input.label ?? `Inspección plataforma · ${input.superAdminEmail}`,
      expires_at: expiresAt
    })
    .select('id')
    .single();

  if (tErr || !tokenRow) throw new Error(tErr?.message ?? 'No se pudo crear acceso.');

  const tokenId = tokenRow.id as string;

  await logPortalAccessAudit({
    tokenId,
    clinicId: input.clinicId,
    tenantId: (clinic?.tenant_id as string | null) ?? undefined,
    patientId: input.patientId,
    eventType: 'platform_inspect_start',
    resourceLabel: patient.full_name as string,
    pagePath: '/paciente',
    meta: { access_role: 'super_admin', actor_email: input.superAdminEmail }
  });

  await logPlatformInspectEvent({
    actorEmail: input.superAdminEmail,
    actorName: input.superAdminName,
    inspectMode: 'patient_portal',
    clinicId: input.clinicId,
    tenantId: clinic?.tenant_id as string | null,
    patientId: input.patientId,
    eventType: 'inspect_pdp_start',
    resourceLabel: patient.full_name as string,
    pagePath: '/paciente'
  });

  const pdpSession: Omit<PortalAccessSession, 'expiresAt'> = {
    tokenId,
    patientId: input.patientId,
    staffProfileId: 'platform-inspect',
    clinicId: input.clinicId,
    tenantId: (clinic?.tenant_id as string | null) ?? undefined,
    patientName: patient.full_name as string
  };

  const inspectCookie = createPlatformInspectCookie({
    superAdminEmail: input.superAdminEmail,
    superAdminName: input.superAdminName,
    accessRole: 'super_admin',
    mode: 'patient_portal',
    clinicId: input.clinicId,
    tenantId: (clinic?.tenant_id as string | null) ?? undefined,
    patientId: input.patientId,
    tokenId,
    patientName: patient.full_name as string
  });

  return {
    rawToken: raw,
    pdpCookie: createPortalAccessCookie(pdpSession, 4),
    inspectCookie,
    redirect: `/paciente/acceso?token=${encodeURIComponent(raw)}`
  };
}

export async function listPlatformInspectAudit(limit = 200) {
  if (!hasSupabaseConfig()) return [];
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('platform_inspect_audit')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
