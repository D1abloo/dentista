import { logEvent } from './logEvent';
import type { SessionUser } from '@/lib/auth';

export async function logSecurityDenial(input: {
  reason: string;
  route?: string;
  clinicId?: string;
  patientId?: string;
  resourceType?: string;
  resourceId?: string;
  user?: SessionUser | null;
  ip?: string | null;
  userAgent?: string | null;
  crossTenant?: boolean;
}) {
  const eventType = input.crossTenant
    ? 'security.cross_tenant_attempt'
    : input.reason.includes('RLS')
      ? 'security.rls_blocked'
      : 'auth.access_denied';

  await logEvent({
    event_type: eventType,
    module: 'security',
    action: input.reason,
    severity: input.crossTenant ? 'critical' : 'high',
    result: 'denied',
    message: input.reason,
    user_id: input.user?.profileId ?? null,
    user_email: input.user?.email ?? null,
    user_role: input.user?.staffRole ?? input.user?.role ?? null,
    tenant_id: input.user?.tenantId ?? null,
    clinic_id: input.clinicId ?? input.user?.clinicId ?? null,
    patient_id: input.patientId ?? input.user?.patientId ?? null,
    resource_type: input.resourceType,
    resource_id: input.resourceId,
    route: input.route,
    ip_address: input.ip,
    user_agent: input.userAgent
  });
}
