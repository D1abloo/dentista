import type { APIRoute } from 'astro'
import { requireAppointmentAccess } from '@/lib/api/appointmentAccess'
import { fail, ok } from '@/lib/http'
import { getScopedAppointment } from '@/lib/services/appointmentAutomation'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { clinicQuerySchema } from '@/lib/validators'

export const prerender = false

export const GET: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Cita no disponible.', 503)

  const appointmentId = context.params.id
  if (!appointmentId) return fail('ID de cita obligatorio.', 400)

  try {
    const parsed = clinicQuerySchema.safeParse(Object.fromEntries(context.url.searchParams))
    if (!parsed.success) return fail('clinicId es obligatorio.', 422, parsed.error.flatten())

    const accessGate = await requireAppointmentAccess(context, parsed.data.clinicId)
    if (accessGate.response || !accessGate.access) return accessGate.response ?? fail('No autorizado.', 401)

    const appointment = await getScopedAppointment(
      accessGate.access.actor,
      parsed.data.clinicId,
      appointmentId
    )
    return ok(appointment)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cita no encontrada.'
    const status = message.includes('permiso') || message.includes('encontrada') ? 404 : 500
    return fail(message, status)
  }
}
