import type { APIRoute } from 'astro'
import { requireN8nService } from '@/lib/n8n/requireService'
import { ok, fail } from '@/lib/http'
import { listDueAppointmentReminders } from '@/lib/services/n8nAutomationNotifications'
import { n8nRemindersDueQuerySchema } from '@/lib/validators'

export const prerender = false

export const GET: APIRoute = async (context) => {
  const denied = requireN8nService(context)
  if (denied) return denied
  try {
    const parsed = n8nRemindersDueQuerySchema.safeParse(Object.fromEntries(context.url.searchParams))
    if (!parsed.success) return fail('Query inválida.', 422, parsed.error.flatten())
    const data = await listDueAppointmentReminders(parsed.data)
    return ok(data, { count: data.length, hoursBefore: parsed.data.hoursBefore })
  } catch (error) {
    return fail('No se pudieron listar recordatorios.', 500, error instanceof Error ? error.message : error)
  }
}
