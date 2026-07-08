import type { APIRoute } from 'astro'
import { requireN8nService } from '@/lib/n8n/requireService'
import { ok, fail } from '@/lib/http'
import { notifyAppointmentCancelledByAutomation } from '@/lib/services/n8nAutomationNotifications'
import { n8nNotifyCancelledSchema } from '@/lib/validators'

export const prerender = false

export const POST: APIRoute = async (context) => {
  const denied = requireN8nService(context)
  if (denied) return denied
  try {
    const body = await context.request.json()
    const parsed = n8nNotifyCancelledSchema.safeParse(body)
    if (!parsed.success) return fail('Payload inválido.', 422, parsed.error.flatten())
    const data = await notifyAppointmentCancelledByAutomation(parsed.data)
    return ok(data, { message: 'Aviso de cancelación enviado.' })
  } catch (error) {
    return fail('No se pudo enviar el aviso de cancelación.', 500, error instanceof Error ? error.message : error)
  }
}
