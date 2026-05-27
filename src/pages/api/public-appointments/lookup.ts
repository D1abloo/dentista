import type { APIRoute } from 'astro'
import { clientIp } from '@/lib/audit/sanitize'
import { fail, ok } from '@/lib/http'
import { lookupPublicAppointments } from '@/lib/services/publicAppointmentLookup'
import { publicAppointmentLookupSchema } from '@/lib/validators'

export const prerender = false

const WINDOW_MS = 60_000
const lookupRate = new Map<string, number[]>()

function isRateLimited(key: string, max: number) {
  const now = Date.now()
  const events = (lookupRate.get(key) ?? []).filter((time) => now - time < WINDOW_MS)
  events.push(now)
  lookupRate.set(key, events)
  return events.length > max
}

export const POST: APIRoute = async ({ request }) => {
  const ip = clientIp(request) ?? 'unknown'
  if (isRateLimited(`public-lookup:${ip}`, 30)) {
    return fail('Demasiadas consultas. Espera un momento e inténtalo de nuevo.', 429)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('Cuerpo JSON inválido.', 400)
  }

  const parsed = publicAppointmentLookupSchema.safeParse(body)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Datos inválidos.', 400)
  }

  try {
    const result = await lookupPublicAppointments(parsed.data.identifier)
    return ok(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo consultar la cita.'
    return fail(message, 400)
  }
}
