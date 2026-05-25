function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const encoded =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value.trim());
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}

export async function hashActivationToken(raw: string) {
  return sha256Hex(raw);
}

export async function generateActivationToken() {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  const raw = toBase64Url(bytes);
  return { raw, hash: await hashActivationToken(raw) };
}

export function activationExpiresAt(hours = 48) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}
