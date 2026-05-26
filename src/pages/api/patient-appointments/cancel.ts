import type { APIRoute } from 'astro'
import { clientIp } from '@/lib/audit/sanitize'
import { fail, ok } from '@/lib/http'
import {
  cancelAppointmentPublic,
  monitorPatientAppointmentsError
} from '@/lib/services/patientAppointmentsPublic'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { patientAppointmentsCancelSchema } from '@/lib/validators'

export const prerender = false

const WINDOW_MS = 60_000
const cancelRate = new Map<string, number[]>()

function isRateLimited(key: string, max: number) {
  const now = Date.now()
  const events = (cancelRate.get(key) ?? []).filter((time) => now - time < WINDOW_MS)
  events.push(now)
  cancelRate.set(key, events)
  return events.length > max
}

export const POST: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) return fail('Cancelación no disponible.', 503)
  const ip = clientIp(request) ?? 'unknown'
  if (isRateLimited(`cancel:${ip}`, 8)) return fail('Demasiados intentos.', 429)

  try {
    const body = await request.json()
    const parsed = patientAppointmentsCancelSchema.safeParse(body)
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten())

    await cancelAppointmentPublic(parsed.data)
    return ok({ message: 'Cita cancelada correctamente.' })
  } catch (error) {
    monitorPatientAppointmentsError('cancel', error)
    const message = error instanceof Error ? error.message : 'No se pudo cancelar.'
    const status = message.includes('no se puede cancelar') ? 409 : 500
    return fail(message, status)
  }
}
