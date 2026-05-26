import type { APIRoute } from 'astro'
import { clientIp } from '@/lib/audit/sanitize'
import { fail, ok } from '@/lib/http'
import {
  getPatientAppointments,
  monitorPatientAppointmentsError
} from '@/lib/services/patientAppointmentsPublic'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { patientAppointmentsListSchema } from '@/lib/validators'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) return fail('Listado no disponible.', 503)
  const ip = clientIp(request) ?? 'unknown'

  try {
    const params = Object.fromEntries(new URL(request.url).searchParams)
    const parsed = patientAppointmentsListSchema.safeParse({
      verificationToken: params.verificationToken,
      upcomingOnly: params.upcomingOnly === 'false' ? false : true
    })
    if (!parsed.success) return fail('Parámetros inválidos.', 422, parsed.error.flatten())

    const appointments = await getPatientAppointments(parsed.data)
    return ok({ appointments, ip })
  } catch (error) {
    monitorPatientAppointmentsError('list', error)
    return fail(error instanceof Error ? error.message : 'No se pudieron cargar las citas.', 401)
  }
}
