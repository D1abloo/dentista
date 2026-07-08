import type { APIRoute } from 'astro'
import { clientIp } from '@/lib/audit/sanitize'
import { handleAppointmentsChat, monitorPatientAppointmentsError } from '@/lib/ai/appointmentsChatHandler'
import { logAiBookingMonitor } from '@/lib/ai/bookingMonitoring'
import { fail, ok } from '@/lib/http'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { aiAppointmentsChatSchema } from '@/lib/validators'

export const prerender = false

const WINDOW_MS = 60_000
const chatRate = new Map<string, number[]>()

function isRateLimited(key: string, max: number) {
  const now = Date.now()
  const events = (chatRate.get(key) ?? []).filter((time) => now - time < WINDOW_MS)
  events.push(now)
  chatRate.set(key, events)
  return events.length > max
}

export const POST: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) {
    return fail('El asistente de citas no está disponible temporalmente.', 503)
  }

  const ip = clientIp(request) ?? 'unknown'
  if (isRateLimited(`appt-chat:${ip}`, 30)) {
    return fail('Has enviado demasiados mensajes. Espera unos segundos.', 429)
  }

  try {
    const body = await request.json()
    const parsed = aiAppointmentsChatSchema.safeParse(body)
    if (!parsed.success) return fail('Mensaje del chat inválido.', 422, parsed.error.flatten())

    const result = await handleAppointmentsChat(parsed.data)
    return ok(result)
  } catch (error) {
    monitorPatientAppointmentsError('appointments-chat', error)
    await logAiBookingMonitor('ai.booking_failed', { scope: 'appointments-chat' })
    const detail = error instanceof Error ? error.message : String(error)
    if (/fetch failed|ENOTFOUND|No hay clínicas|Supabase/i.test(detail)) {
      return fail(
        'No se pudo conectar con la base de datos. Revisa PUBLIC_SUPABASE_URL en .env (el proyecto Supabase no responde).',
        503,
        detail
      )
    }
    return fail('No se pudo contactar con el asistente.', 500, detail)
  }
}
