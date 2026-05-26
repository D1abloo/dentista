import type { APIRoute } from 'astro'
import { clientIp } from '@/lib/audit/sanitize'
import { getSessionUser } from '@/lib/auth'
import { isPatientSession } from '@/lib/api/guards'
import { fail, ok } from '@/lib/http'
import {
  monitorPatientAppointmentsError,
  verifyPatientIdentity
} from '@/lib/services/patientAppointmentsPublic'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { patientAppointmentsVerifySchema } from '@/lib/validators'

export const prerender = false

const WINDOW_MS = 60_000
const verifyRate = new Map<string, number[]>()

function isRateLimited(key: string, max: number) {
  const now = Date.now()
  const events = (verifyRate.get(key) ?? []).filter((time) => now - time < WINDOW_MS)
  events.push(now)
  verifyRate.set(key, events)
  return events.length > max
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!hasSupabaseConfig()) return fail('Verificación no disponible.', 503)
  const ip = clientIp(request) ?? 'unknown'
  if (isRateLimited(`verify:${ip}`, 12)) {
    return fail('Demasiados intentos de verificación.', 429)
  }

  try {
    const body = await request.json()
    const parsed = patientAppointmentsVerifySchema.safeParse(body)
    if (!parsed.success) return fail('Datos de verificación inválidos.', 422, parsed.error.flatten())

    const session = getSessionUser(cookies)
    if (session && isPatientSession(session) && session.patientId && session.email) {
      const verified = await verifyPatientIdentity({
        patientId: session.patientId,
        email: session.email
      })
      return ok({
        verified: true,
        verificationToken: verified.verificationToken,
        patientIds: verified.patientIds,
        source: 'session'
      })
    }

    if (parsed.data.verificationToken) {
      return ok({ verified: true, verificationToken: parsed.data.verificationToken, source: 'token' })
    }

    const verified = await verifyPatientIdentity({
      email: parsed.data.email,
      phone: parsed.data.phone
    })
    return ok({
      verified: true,
      verificationToken: verified.verificationToken,
      patientIds: verified.patientIds,
      source: 'email_phone'
    })
  } catch (error) {
    monitorPatientAppointmentsError('verify', error)
    const message = error instanceof Error ? error.message : 'No se pudo verificar.'
    return fail(message, 401)
  }
}
