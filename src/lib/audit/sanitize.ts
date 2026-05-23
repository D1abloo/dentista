const SENSITIVE_KEYS = /password|token|secret|authorization|cookie|pdf|diagnosis|dni|nhc|body|content/i;

export function sanitizeMetadata(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!meta) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.test(k)) {
      out[k] = '[redacted]';
      continue;
    }
    if (typeof v === 'string' && v.length > 500) {
      out[k] = `${v.slice(0, 120)}…`;
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function parseDevice(userAgent: string | null | undefined): string {
  if (!userAgent) return 'Desconocido';
  const ua = userAgent.toLowerCase();
  const browser = ua.includes('firefox')
    ? 'Firefox'
    : ua.includes('edg')
      ? 'Edge'
      : ua.includes('chrome')
        ? 'Chrome'
        : ua.includes('safari')
          ? 'Safari'
          : 'Navegador';
  const os = ua.includes('windows')
    ? 'Windows'
    : ua.includes('mac')
      ? 'macOS'
      : ua.includes('android')
        ? 'Android'
        : ua.includes('iphone') || ua.includes('ipad')
          ? 'iOS'
          : ua.includes('linux')
            ? 'Linux'
            : 'SO';
  return `${browser} · ${os}`;
}

export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return request.headers.get('x-real-ip');
}
