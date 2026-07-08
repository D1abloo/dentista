import type { APIRoute } from 'astro'
import { requireAppointmentAccess } from '@/lib/api/appointmentAccess'
import { created, fail } from '@/lib/http'
import { cancelAppointmentWithValidation } from '@/lib/services/appointmentAutomation'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { appointmentAutomationCancelSchema } from '@/lib/validators'

export const prerender = false

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Cancelación no disponible.', 503)

  const appointmentId = context.params.id
  if (!appointmentId) return fail('ID de cita obligatorio.', 400)

  try {
    const body = await context.request.json()
    const parsed = appointmentAutomationCancelSchema.safeParse(body)
    if (!parsed.success) return fail('Cancelación inválida.', 422, parsed.error.flatten())

    const accessGate = await requireAppointmentAccess(context, parsed.data.clinicId)
    if (accessGate.response || !accessGate.access) return accessGate.response ?? fail('No autorizado.', 401)

    const appointment = await cancelAppointmentWithValidation(accessGate.access.actor, {
      clinicId: parsed.data.clinicId,
      appointmentId,
      reason: parsed.data.reason,
      channel: parsed.data.channel
    })

    return created(appointment, { message: 'Tu cita ha sido cancelada correctamente.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo cancelar la cita.'
    const status = message.includes('permiso') ? 403 : message.includes('no se puede') ? 409 : 500
    return fail(message, status)
  }
}
