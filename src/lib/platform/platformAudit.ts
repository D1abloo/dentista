import { logFromLegacyPlatform } from '@/lib/audit/logEvent';
import { listMemoryAuditLogs } from '@/lib/audit/logEvent';

export type PlatformAuditInput = {
  action: string;
  entity: string;
  entityId?: string;
  clinicId?: string | null;
  metadata?: Record<string, unknown>;
  actorEmail?: string;
  route?: string;
  ip?: string;
  userAgent?: string;
};

export function listDemoPlatformAudit() {
  return listMemoryAuditLogs(100);
}

export async function logPlatformAudit(input: PlatformAuditInput): Promise<void> {
  await logFromLegacyPlatform({
    ...input,
    metadata: { ...input.metadata, scope: 'platform', actor_email: input.actorEmail }
  });
}
