import { generatePortalToken, hashPortalToken } from '@/lib/auth/portalAccess';
import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';

export type PortalAccessTokenRow = {
  id: string;
  clinic_id: string;
  tenant_id: string | null;
  patient_id: string;
  staff_profile_id: string;
  target_clinic_id: string | null;
  label: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  last_used_at: string | null;
  patient?: { full_name: string; email: string };
  staff?: { full_name: string; email: string };
};

export type PortalAccessAuditRow = {
  id: string;
  token_id: string | null;
  clinic_id: string | null;
  staff_profile_id: string | null;
  patient_id: string | null;
  event_type: string;
  page_path: string | null;
  resource_label: string | null;
  resource_id: string | null;
  created_at: string;
  staff?: { full_name: string };
  patient?: { full_name: string };
};

function requireDb() {
  if (!hasSupabaseConfig()) throw new Error('Servicio no disponible.');
  return getSupabaseAdmin();
}

export async function createPortalAccessToken(input: {
  clinicId: string;
  tenantId?: string | null;
  patientId: string;
  staffProfileId: string;
  targetClinicId?: string | null;
  label?: string;
  expiresInHours: number;
  createdByProfileId?: string;
}) {
  const db = requireDb();
  const { raw, hash } = generatePortalToken();
  const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from('patient_portal_access_tokens')
    .insert({
      clinic_id: input.clinicId,
      tenant_id: input.tenantId ?? null,
      patient_id: input.patientId,
      staff_profile_id: input.staffProfileId,
      target_clinic_id: input.targetClinicId ?? null,
      token_hash: hash,
      label: input.label ?? null,
      expires_at: expiresAt,
      created_by: input.createdByProfileId ?? null
    })
    .select('id, expires_at, patient_id, staff_profile_id')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'No se pudo crear el token.');

  await logPortalAccessAudit({
    tokenId: data.id,
    clinicId: input.clinicId,
    tenantId: input.tenantId,
    staffProfileId: input.staffProfileId,
    patientId: input.patientId,
    eventType: 'token_created',
    resourceLabel: input.label ?? 'Token de acceso al portal del paciente'
  });

  return { tokenId: data.id as string, rawToken: raw, expiresAt: data.expires_at as string };
}

export async function listPortalAccessTokens(clinicId: string, tenantId?: string | null) {
  const db = requireDb();
  let q = db
    .from('patient_portal_access_tokens')
    .select(
      'id, clinic_id, tenant_id, patient_id, staff_profile_id, target_clinic_id, label, expires_at, revoked_at, created_at, last_used_at'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (tenantId) {
    q = q.or(`clinic_id.eq.${clinicId},tenant_id.eq.${tenantId}`);
  } else {
    q = q.eq('clinic_id', clinicId);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as PortalAccessTokenRow[];
}

export async function revokePortalAccessToken(tokenId: string, clinicId: string) {
  const db = requireDb();
  const { data, error } = await db
    .from('patient_portal_access_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', tokenId)
    .eq('clinic_id', clinicId)
    .select('id, staff_profile_id, patient_id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Token no encontrado.');
  await logPortalAccessAudit({
    tokenId,
    clinicId,
    staffProfileId: data.staff_profile_id as string,
    patientId: data.patient_id as string,
    eventType: 'token_revoked',
    resourceLabel: 'Revocación de token'
  });
}

export async function exchangePortalToken(rawToken: string) {
  const db = requireDb();
  const hash = hashPortalToken(rawToken.trim());
  const now = new Date().toISOString();

  const { data: row, error } = await db
    .from('patient_portal_access_tokens')
    .select(
      'id, clinic_id, tenant_id, patient_id, staff_profile_id, target_clinic_id, expires_at, revoked_at'
    )
    .eq('token_hash', hash)
    .maybeSingle();

  if (error || !row) return null;
  if (row.revoked_at) return null;
  if (row.expires_at < now) return null;

  await db
    .from('patient_portal_access_tokens')
    .update({ last_used_at: now })
    .eq('id', row.id);

  const { data: patientRow } = await db.from('profiles').select('full_name').eq('id', row.patient_id).maybeSingle();
  const patientName = patientRow?.full_name as string | undefined;

  await logPortalAccessAudit({
    tokenId: row.id as string,
    clinicId: row.clinic_id as string,
    tenantId: row.tenant_id as string | null,
    staffProfileId: row.staff_profile_id as string,
    patientId: row.patient_id as string,
    eventType: 'portal_open',
    pagePath: '/paciente',
    resourceLabel: 'Apertura del portal del paciente'
  });

  return {
    tokenId: row.id as string,
    patientId: row.patient_id as string,
    staffProfileId: row.staff_profile_id as string,
    clinicId: row.clinic_id as string,
    tenantId: (row.tenant_id as string | null) ?? undefined,
    targetClinicId: (row.target_clinic_id as string | null) ?? undefined,
    patientName
  };
}

export async function logPortalAccessAudit(input: {
  tokenId?: string | null;
  clinicId?: string | null;
  tenantId?: string | null;
  staffProfileId?: string | null;
  patientId?: string | null;
  eventType: string;
  pagePath?: string;
  resourceLabel?: string;
  resourceId?: string;
  accessRole?: string | null;
  actorEmail?: string | null;
  meta?: Record<string, unknown>;
}) {
  const db = requireDb();
  const meta = {
    ...(input.meta ?? {}),
    ...(input.accessRole ? { access_role: input.accessRole } : {}),
    ...(input.actorEmail ? { actor_email: input.actorEmail } : {})
  };
  await db.from('patient_portal_access_audit').insert({
    token_id: input.tokenId ?? null,
    clinic_id: input.clinicId ?? null,
    tenant_id: input.tenantId ?? null,
    staff_profile_id:
      input.staffProfileId && input.staffProfileId !== 'platform-inspect' ? input.staffProfileId : null,
    patient_id: input.patientId ?? null,
    event_type: input.eventType,
    page_path: input.pagePath ?? null,
    resource_label: input.resourceLabel ?? null,
    resource_id: input.resourceId ?? null,
    access_role: input.accessRole ?? (meta.access_role as string | undefined) ?? null,
    actor_email: input.actorEmail ?? (meta.actor_email as string | undefined) ?? null,
    meta
  });
}

export async function listPortalAccessAudit(clinicId: string, tenantId?: string | null, limit = 300) {
  const db = requireDb();
  let q = db
    .from('patient_portal_access_audit')
    .select(
      'id, token_id, clinic_id, staff_profile_id, patient_id, event_type, page_path, resource_label, resource_id, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (tenantId) {
    q = q.or(`clinic_id.eq.${clinicId},tenant_id.eq.${tenantId}`);
  } else {
    q = q.eq('clinic_id', clinicId);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as PortalAccessAuditRow[];
}

export async function listTokensForStaff(staffProfileId: string) {
  const db = requireDb();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('patient_portal_access_tokens')
    .select('id, label, expires_at, revoked_at, patient_id')
    .eq('staff_profile_id', staffProfileId)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .order('expires_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
