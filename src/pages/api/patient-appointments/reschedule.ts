import type { APIRoute } from 'astro'
import { clientIp } from '@/lib/audit/sanitize'
import { fail, ok } from '@/lib/http'
import {
  monitorPatientAppointmentsError,
  rescheduleAppointmentPublic
} from '@/lib/services/patientAppointmentsPublic'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { patientAppointmentsRescheduleSchema } from '@/lib/validators'

export const prerender = false

const WINDOW_MS = 60_000
const rate = new Map<string, number[]>()

function isRateLimited(key: string, max: number) {
  const now = Date.now()
  const events = (rate.get(key) ?? []).filter((time) => now - time < WINDOW_MS)
  events.push(now)
  rate.set(key, events)
  return events.length > max
}

export const POST: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) return fail('Reprogramación no disponible.', 503)
  const ip = clientIp(request) ?? 'unknown'
  if (isRateLimited(`reschedule:${ip}`, 8)) return fail('Demasiados intentos.', 429)

  try {
    const body = await request.json()
    const parsed = patientAppointmentsRescheduleSchema.safeParse(body)
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten())

    await rescheduleAppointmentPublic(parsed.data)
    return ok({ message: 'Cita cambiada correctamente.' })
  } catch (error) {
    monitorPatientAppointmentsError('reschedule', error)
    const message = error instanceof Error ? error.message : 'No se pudo cambiar la cita.'
    const status = message.includes('no está disponible') || message.includes('no se puede') ? 409 : 500
    return fail(message, status)
  }
}
