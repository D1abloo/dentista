import type { APIRoute } from 'astro'
import { requireN8nService } from '@/lib/n8n/requireService'
import { ok, fail } from '@/lib/http'
import { sendAppointmentReminderBatch } from '@/lib/services/n8nAutomationNotifications'
import { n8nRemindersSendSchema } from '@/lib/validators'

export const prerender = false

export const POST: APIRoute = async (context) => {
  const denied = requireN8nService(context)
  if (denied) return denied
  try {
    const body = await context.request.json()
    const parsed = n8nRemindersSendSchema.safeParse(body)
    if (!parsed.success) return fail('Payload inválido.', 422, parsed.error.flatten())
    const data = await sendAppointmentReminderBatch(parsed.data)
    return ok(data, { message: 'Recordatorios enviados.' })
  } catch (error) {
    return fail('No se pudieron enviar recordatorios.', 500, error instanceof Error ? error.message : error)
  }
}
