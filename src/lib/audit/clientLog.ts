import type { LogEventInput } from './types';

type ClientLogPayload = Pick<
  LogEventInput,
  | 'event_type'
  | 'module'
  | 'action'
  | 'severity'
  | 'result'
  | 'message'
  | 'resource_type'
  | 'resource_id'
  | 'route'
  | 'metadata'
>;

let jsErrorHooked = false;

export function logClientEvent(payload: ClientLogPayload) {
  if (typeof window === 'undefined') return;
  const body = {
    ...payload,
    route: payload.route ?? window.location.pathname
  };
  void fetch('/api/audit/log', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }).catch(() => {
    /* silencioso: no console en producción */
  });
}

export function installClientErrorMonitoring() {
  if (typeof window === 'undefined' || jsErrorHooked) return;
  jsErrorHooked = true;
  window.addEventListener('error', (ev) => {
    logClientEvent({
      event_type: 'error.render',
      module: 'frontend',
      action: 'Error JS capturado',
      severity: 'high',
      result: 'error',
      message: ev.message?.slice(0, 200) ?? 'Error desconocido',
      route: window.location.pathname,
      metadata: { source: ev.filename, line: ev.lineno }
    });
  });
  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason instanceof Error ? ev.reason.message : String(ev.reason);
    logClientEvent({
      event_type: 'error.promise',
      module: 'frontend',
      action: 'Promesa rechazada',
      severity: 'medium',
      result: 'error',
      message: reason.slice(0, 200),
      route: window.location.pathname
    });
  });
}
