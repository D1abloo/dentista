import { logEvent, logLoginEvent } from './logEvent';
import { clientIp, parseDevice } from './sanitize';

export async function auditAuthSuccess(input: {
  request: Request;
  email: string;
  role: string;
  clinicId?: string | null;
  tenantId?: string | null;
  patientId?: string | null;
  userId?: string | null;
  route?: string;
}) {
  const ip = clientIp(input.request);
  const ua = input.request.headers.get('user-agent');
  await logLoginEvent({
    email: input.email,
    user_role: input.role,
    clinic_id: input.clinicId,
    tenant_id: input.tenantId,
    patient_id: input.patientId,
    user_id: input.userId,
    status: 'success',
    route: input.route,
    ip_address: ip,
    user_agent: ua,
    device: parseDevice(ua)
  });
  await logEvent({
    event_type: 'auth.login_success',
    module: 'auth',
    action: `Login correcto · ${input.email}`,
    severity: 'info',
    result: 'ok',
    message: `Login correcto · ${input.email} · ${input.role}`,
    user_email: input.email,
    user_role: input.role,
    clinic_id: input.clinicId,
    tenant_id: input.tenantId,
    patient_id: input.patientId,
    route: input.route,
    ip_address: ip,
    user_agent: ua
  });
}

export async function auditAuthFailure(input: {
  request: Request;
  email: string;
  role: string;
  reason: string;
  denied?: boolean;
  route?: string;
}) {
  const ip = clientIp(input.request);
  const ua = input.request.headers.get('user-agent');
  const status = input.denied ? 'denied' : 'failed';
  await logLoginEvent({
    email: input.email,
    user_role: input.role,
    status,
    failure_reason: input.reason,
    route: input.route,
    ip_address: ip,
    user_agent: ua,
    device: parseDevice(ua)
  });
  await logEvent({
    event_type: input.denied ? 'auth.access_denied' : 'auth.login_failed',
    module: 'auth',
    action: input.denied ? 'Acceso denegado' : 'Login fallido',
    severity: input.denied ? 'high' : 'medium',
    result: input.denied ? 'denied' : 'error',
    message: `${input.denied ? 'Acceso denegado' : 'Login fallido'} · ${input.email}`,
    user_email: input.email,
    user_role: input.role,
    route: input.route,
    ip_address: ip,
    user_agent: ua,
    metadata: { reason: input.reason }
  });
}
