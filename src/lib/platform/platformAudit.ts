import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';

export type PlatformAuditInput = {
  action: string;
  entity: string;
  entityId?: string;
  clinicId?: string | null;
  metadata?: Record<string, unknown>;
  actorEmail?: string;
};

type AuditRow = PlatformAuditInput & { created_at: string };
const demoAudit: AuditRow[] = [];

export function listDemoPlatformAudit() {
  return [...demoAudit].reverse().slice(0, 100);
}

export async function logPlatformAudit(input: PlatformAuditInput): Promise<void> {
  const row: AuditRow = { ...input, created_at: new Date().toISOString() };
  if (!hasSupabaseConfig()) {
    demoAudit.unshift(row);
    if (demoAudit.length > 200) demoAudit.length = 200;
    return;
  }
  const db = getSupabaseAdmin();
  await db.from('audit_logs').insert({
    clinic_id: input.clinicId ?? null,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    metadata: {
      ...input.metadata,
      actor_email: input.actorEmail ?? 'super_admin@platform',
      scope: 'platform'
    }
  });
}
