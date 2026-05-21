import { createHash, randomBytes } from 'node:crypto';

export function hashActivationToken(raw: string) {
  return createHash('sha256').update(raw.trim()).digest('hex');
}

export function generateActivationToken() {
  const raw = randomBytes(32).toString('base64url');
  return { raw, hash: hashActivationToken(raw) };
}

export function activationExpiresAt(hours = 48) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}
