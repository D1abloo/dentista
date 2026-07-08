import type { APIRoute } from 'astro'
import { requireAppointmentAccess } from '@/lib/api/appointmentAccess'
import { fail, ok } from '@/lib/http'
import { checkAppointmentAvailability } from '@/lib/services/appointmentAutomation'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { appointmentAutomationAvailabilitySchema } from '@/lib/validators'

export const prerender = false

export const GET: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Disponibilidad no disponible.', 503)

  try {
    const parsed = appointmentAutomationAvailabilitySchema.safeParse(
      Object.fromEntries(context.url.searchParams)
    )
    if (!parsed.success) return fail('Consulta de disponibilidad inválida.', 422, parsed.error.flatten())

    const professionalId = parsed.data.professionalId ?? parsed.data.dentistId
    const input = { ...parsed.data, professionalId }

    const accessGate = await requireAppointmentAccess(context, input.clinicId)
    if (accessGate.response || !accessGate.access) return accessGate.response ?? fail('No autorizado.', 401)

    const data = await checkAppointmentAvailability(accessGate.access.actor, input)
    return ok(data, {
      clinicId: input.clinicId,
      timezone: input.timezone,
      count: data.slots.length
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo consultar disponibilidad.'
    const status = message.includes('permiso') ? 403 : 500
    return fail(message, status)
  }
}
