import type { APIRoute } from 'astro'
import { requireAppointmentAccess } from '@/lib/api/appointmentAccess'
import { ok, fail } from '@/lib/http'
import { rescheduleAppointmentWithValidation } from '@/lib/services/appointmentAutomation'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { appointmentAutomationRescheduleSchema } from '@/lib/validators'

export const prerender = false

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Reprogramación no disponible.', 503)

  const appointmentId = context.params.id
  if (!appointmentId) return fail('ID de cita obligatorio.', 400)

  try {
    const body = await context.request.json()
    const parsed = appointmentAutomationRescheduleSchema.safeParse({
      ...body,
      appointmentId
    })
    if (!parsed.success) return fail('Reprogramación inválida.', 422, parsed.error.flatten())

    const accessGate = await requireAppointmentAccess(context, parsed.data.clinicId)
    if (accessGate.response || !accessGate.access) return accessGate.response ?? fail('No autorizado.', 401)

    const appointment = await rescheduleAppointmentWithValidation(accessGate.access.actor, parsed.data)
    return ok(appointment, { message: 'Tu cita ha sido reprogramada correctamente.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo reprogramar la cita.'
    const status = message.includes('permiso') ? 403 : message.includes('disponible') ? 409 : 500
    return fail(message, status)
  }
}
