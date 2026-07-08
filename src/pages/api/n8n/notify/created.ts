import type { APIRoute } from 'astro'
import { requireN8nService } from '@/lib/n8n/requireService'
import { ok, fail } from '@/lib/http'
import { notifyAppointmentCreatedByAutomation } from '@/lib/services/n8nAutomationNotifications'
import { n8nNotifyCreatedSchema } from '@/lib/validators'

export const prerender = false

export const POST: APIRoute = async (context) => {
  const denied = requireN8nService(context)
  if (denied) return denied
  try {
    const body = await context.request.json()
    const parsed = n8nNotifyCreatedSchema.safeParse(body)
    if (!parsed.success) return fail('Payload inválido.', 422, parsed.error.flatten())
    const data = await notifyAppointmentCreatedByAutomation(parsed.data)
    return ok(data, {
      message: 'Confirmación enviada al paciente y staff.',
      appointmentId: parsed.data.appointmentId
    })
  } catch (error) {
    return fail('No se pudo enviar la confirmación.', 500, error instanceof Error ? error.message : error)
  }
}
