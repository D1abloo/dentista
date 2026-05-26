import type { APIRoute } from 'astro'
import { fail, ok } from '@/lib/http'
import {
  getNextPatientAppointment,
  monitorPatientAppointmentsError
} from '@/lib/services/patientAppointmentsPublic'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { patientAppointmentsListSchema } from '@/lib/validators'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) return fail('Consulta no disponible.', 503)

  try {
    const token = new URL(request.url).searchParams.get('verificationToken') ?? ''
    const parsed = patientAppointmentsListSchema.safeParse({ verificationToken: token })
    if (!parsed.success) return fail('Token inválido.', 422)

    const appointment = await getNextPatientAppointment(parsed.data.verificationToken)
    return ok({ appointment })
  } catch (error) {
    monitorPatientAppointmentsError('next', error)
    return fail(error instanceof Error ? error.message : 'No se pudo consultar.', 401)
  }
}
