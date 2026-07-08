import type { APIRoute } from 'astro'
import { requireN8nService } from '@/lib/n8n/requireService'
import { ok, fail } from '@/lib/http'
import {
  buildCalendarEventPayload,
  loadAppointmentBundle
} from '@/lib/services/n8nAutomationNotifications'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { n8nCalendarEventSchema } from '@/lib/validators'

export const prerender = false

export const POST: APIRoute = async (context) => {
  const denied = requireN8nService(context)
  if (denied) return denied
  if (!hasSupabaseConfig()) return fail('Calendario no disponible.', 503)
  try {
    const body = await context.request.json()
    const parsed = n8nCalendarEventSchema.safeParse(body)
    if (!parsed.success) return fail('Payload inválido.', 422, parsed.error.flatten())

    const appt = await loadAppointmentBundle(parsed.data.appointmentId, parsed.data.clinicId)
    const payload = buildCalendarEventPayload(appt)

    return ok(payload, {
      message: 'Payload listo para n8n Google Calendar.',
      hint: 'Conecta credenciales Google Calendar en n8n y mapea summary, start, end, location.'
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Cita no encontrada.') {
      return fail('Cita no encontrada.', 404)
    }
    return fail('No se pudo generar el evento de calendario.', 500, error instanceof Error ? error.message : error)
  }
}
