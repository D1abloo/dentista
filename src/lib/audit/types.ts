export type AuditSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type AuditResult = 'ok' | 'blocked' | 'error' | 'denied';

export type LogEventInput = {
  event_type: string;
  module: string;
  action: string;
  severity?: AuditSeverity;
  result?: AuditResult;
  message?: string;
  user_id?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  tenant_id?: string | null;
  clinic_id?: string | null;
  patient_id?: string | null;
  professional_id?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
  route?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown>;
  actor_profile_id?: string | null;
};

export type LoginEventInput = {
  user_id?: string | null;
  email?: string | null;
  user_role?: string | null;
  tenant_id?: string | null;
  clinic_id?: string | null;
  patient_id?: string | null;
  status: 'success' | 'failed' | 'denied' | 'logout';
  failure_reason?: string | null;
  route?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  device?: string | null;
};

export type AuditListFilters = {
  clinic_id?: string;
  tenant_id?: string;
  event_type?: string;
  module?: string;
  severity?: string;
  result?: string;
  user_email?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
};
