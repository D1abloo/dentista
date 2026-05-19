export interface ActivationTokenPayload {
  patientId: string;
  appointmentId?: string;
  issuedAt?: string;
}

function encodeBase64Url(value: string) {
  if (typeof Buffer !== 'undefined') return Buffer.from(value, 'utf8').toString('base64url');
  const bytes = new TextEncoder().encode(value);
  const encoded = btoa(String.fromCharCode(...bytes));
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  if (typeof Buffer !== 'undefined') return Buffer.from(normalized, 'base64').toString('utf8');
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function createActivationToken(payload: ActivationTokenPayload) {
  return encodeBase64Url(JSON.stringify({ ...payload, issuedAt: payload.issuedAt ?? new Date().toISOString() }));
}

export function parseActivationToken(token: string): ActivationTokenPayload | null {
  try {
    const parsed = JSON.parse(decodeBase64Url(token)) as Partial<ActivationTokenPayload>;
    if (!parsed.patientId) return null;
    return {
      patientId: parsed.patientId,
      appointmentId: parsed.appointmentId,
      issuedAt: parsed.issuedAt
    };
  } catch {
    return null;
  }
}

export function buildActivationUrl(baseUrl: string, payload: ActivationTokenPayload, next = '/paciente/citas') {
  const url = new URL('/activar', baseUrl);
  url.searchParams.set('token', createActivationToken(payload));
  url.searchParams.set('next', next);
  return url.toString();
}
