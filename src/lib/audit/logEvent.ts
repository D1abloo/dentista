import { getSupabaseAdmin, hasSupabaseConfig } from '@/lib/supabaseServer';
import { logError } from '@/lib/logger';
import type { LogEventInput, LoginEventInput } from './types';
import { parseDevice, sanitizeMetadata } from './sanitize';

const memoryLogs: Array<LogEventInput & { id: string; created_at: string }> = [];
const memoryLogins: Array<LoginEventInput & { id: string; created_at: string }> = [];

export function listMemoryAuditLogs(limit = 200) {
  return memoryLogs.slice(0, limit);
}

export function listMemoryLoginEvents(limit = 100) {
  return memoryLogins.slice(0, limit);
}

function severityToRisk(severity: string): 'low' | 'medium' | 'high' {
  if (severity === 'critical' || severity === 'high') return 'high';
  if (severity === 'medium') return 'medium';
  return 'low';
}

export function severityToRiskExport(severity: string) {
  return severityToRisk(severity);
}

export async function logEvent(input: LogEventInput): Promise<string | null> {
  const severity = input.severity ?? 'info';
  const result = input.result ?? 'ok';
  const meta = sanitizeMetadata({
    ...input.metadata,
    module: input.module,
    severity,
    result,
    user_role: input.user_role,
    user_email: input.user_email,
    tenant_id: input.tenant_id,
    patient_id: input.patient_id,
    professional_id: input.professional_id,
    resource_type: input.resource_type,
    route: input.route,
    ip_address: input.ip_address,
    user_agent: input.user_agent,
    device: parseDevice(input.user_agent),
    reviewed: false,
    risk: severityToRisk(severity)
  });

  const row = {
    clinic_id: input.clinic_id ?? null,
    actor_profile_id: input.actor_profile_id ?? input.user_id ?? null,
    action: input.action,
    entity: input.resource_type ?? input.module,
    entity_id: input.resource_id ?? null,
    event_type: input.event_type,
    module: input.module,
    severity,
    result,
    message: input.message ?? input.action,
    user_id: input.user_id ?? null,
    user_email: input.user_email ?? null,
    user_role: input.user_role ?? null,
    tenant_id: input.tenant_id ?? null,
    patient_id: input.patient_id ?? null,
    professional_id: input.professional_id ?? null,
    resource_type: input.resource_type ?? null,
    route: input.route ?? null,
    ip_address: input.ip_address ?? null,
    user_agent: input.user_agent ?? null,
    metadata: meta
  };

  if (!hasSupabaseConfig()) {
    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    memoryLogs.unshift({ ...input, id, created_at: new Date().toISOString() });
    if (memoryLogs.length > 500) memoryLogs.length = 500;
    return id;
  }

  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('audit_logs').insert(row).select('id').single();
    if (error) {
      logError('audit.logEvent.insert', error);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    logError('audit.logEvent', err);
    return null;
  }
}

export async function logLoginEvent(input: LoginEventInput): Promise<void> {
  if (!hasSupabaseConfig()) {
    const id = `login-${Date.now()}`;
    memoryLogins.unshift({ ...input, id, created_at: new Date().toISOString() });
    if (memoryLogins.length > 300) memoryLogins.length = 300;
    return;
  }
  try {
    const db = getSupabaseAdmin();
    await db.from('login_events').insert({
      user_id: input.user_id ?? null,
      email: input.email ?? null,
      user_role: input.user_role ?? null,
      tenant_id: input.tenant_id ?? null,
      clinic_id: input.clinic_id ?? null,
      patient_id: input.patient_id ?? null,
      login_at: new Date().toISOString(),
      ip_address: input.ip_address ?? null,
      user_agent: input.user_agent ?? null,
      device: input.device ?? parseDevice(input.user_agent),
      status: input.status,
      failure_reason: input.failure_reason ?? null,
      route: input.route ?? null
    });
  } catch (err) {
    logError('audit.logLoginEvent', err);
  }
}

/** Compatibilidad con logPlatformAudit existente */
export async function logFromLegacyPlatform(input: {
  action: string;
  entity: string;
  entityId?: string;
  clinicId?: string | null;
  metadata?: Record<string, unknown>;
  actorEmail?: string;
  route?: string;
  ip?: string;
  userAgent?: string;
}) {
  const eventType = input.action.startsWith('auth.') || input.action.startsWith('security.')
    ? input.action
    : `${input.entity}.${input.action.replace(/\./g, '_')}`;
  await logEvent({
    event_type: eventType,
    module: input.metadata?.scope === 'platform' ? 'platform' : (input.entity || 'platform'),
    action: input.action,
    severity: input.action.includes('failed') || input.action.includes('denied') ? 'medium' : 'info',
    result: input.action.includes('failed') ? 'error' : input.action.includes('denied') ? 'denied' : 'ok',
    message: input.action,
    user_email: input.actorEmail,
    clinic_id: input.clinicId,
    resource_type: input.entity,
    resource_id: input.entityId,
    route: input.route,
    ip_address: input.ip,
    user_agent: input.userAgent,
    metadata: input.metadata
  });
}
