import type { APIRoute } from 'astro'
import { clientIp } from '@/lib/audit/sanitize'
import { fail, ok } from '@/lib/http'
import {
  monitorPatientAppointmentsError,
  sendPatientSecureLink
} from '@/lib/services/patientAppointmentsPublic'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { patientSecureLinkSchema } from '@/lib/validators'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503)
  const ip = clientIp(request) ?? 'unknown'

  try {
    const body = await request.json()
    const parsed = patientSecureLinkSchema.safeParse(body)
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten())

    const result = await sendPatientSecureLink(parsed.data)
    return ok(result)
  } catch (error) {
    monitorPatientAppointmentsError('send-secure-link', error)
    return fail(error instanceof Error ? error.message : 'No se pudo enviar el enlace.', 401)
  }
}
