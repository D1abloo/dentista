import type { APIRoute } from 'astro'
import { isN8nServiceRequest, readAutomationActorHeaders } from '@/lib/n8n/serviceAuth'
import { resolveAutomationActor } from '@/lib/n8n/actorContext'
import { fail, ok } from '@/lib/http'
import { logAutomationAuditEntry } from '@/lib/services/appointmentAutomation'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { appointmentAutomationAuditSchema } from '@/lib/validators'

export const prerender = false

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Auditoría no disponible.', 503)
  if (!isN8nServiceRequest(context.request)) {
    return fail('Solo el servicio n8n puede registrar auditoría de automatización.', 403)
  }

  try {
    const body = await context.request.json()
    const parsed = appointmentAutomationAuditSchema.safeParse(body)
    if (!parsed.success) return fail('Evento de auditoría inválido.', 422, parsed.error.flatten())

    const headers = readAutomationActorHeaders(context.request)
    const actor =
      headers.userId && headers.companyId
        ? await resolveAutomationActor({
            userId: headers.userId,
            companyId: headers.companyId
          })
        : null

    await logAutomationAuditEntry(actor, parsed.data)
    return ok({ logged: true })
  } catch (error) {
    return fail('No se pudo registrar auditoría.', 500, error instanceof Error ? error.message : error)
  }
}
