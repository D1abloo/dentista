import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const TOKEN_TTL_MS = 15 * 60 * 1000

function secret() {
  const s = import.meta.env.AUTH_SESSION_SECRET
  if (!s || s === 'change-me-local-dev') return 'dentalflow-patient-verify-dev'
  return s
}

export function hashVerificationToken(raw: string) {
  return createHmac('sha256', secret()).update(raw).digest('hex')
}

export function createRawVerificationToken() {
  return randomBytes(24).toString('base64url')
}

export function signVerificationPayload(payload: { patientIds: string[]; email: string; exp: number }) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifySignedPayload(token: string): { patientIds: string[]; email: string; exp: number } | null {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', secret()).update(body).digest('base64url')
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      patientIds: string[]
      email: string
      exp: number
    }
    if (!parsed.exp || Date.now() > parsed.exp) return null
    if (!Array.isArray(parsed.patientIds) || !parsed.patientIds.length) return null
    return parsed
  } catch {
    return null
  }
}

export function verificationExpiresAt() {
  return new Date(Date.now() + TOKEN_TTL_MS).toISOString()
}

export function verificationExpMs() {
  return Date.now() + TOKEN_TTL_MS
}
