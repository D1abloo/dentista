import type { APIRoute } from 'astro'
import { clientIp } from '@/lib/audit/sanitize'
import { resolveClinicIdFromContext } from '@/lib/api/appointmentAccess'
import { sessionToAutomationActor } from '@/lib/n8n/actorContext'
import { forwardAppointmentIntentToN8n, isN8nAutomationEnabled } from '@/lib/n8n/client'
import { requireSession } from '@/lib/api/guards'
import { fail, ok } from '@/lib/http'
import { logAutomationAudit } from '@/lib/services/appointmentAutomation'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { appointmentAutomationIntentSchema } from '@/lib/validators'

export const prerender = false

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) {
    return fail('Automatización de citas no disponible temporalmente.', 503)
  }

  const gate = requireSession(context)
  const body = await context.request.json().catch(() => ({}))
  const parsedPreview = appointmentAutomationIntentSchema.safeParse(body)
  const isAssistantGuest =
    parsedPreview.success &&
    parsedPreview.data.channel === 'assistant' &&
    Boolean(parsedPreview.data.verificationToken)

  if (gate.response && !isAssistantGuest) {
    return gate.response
  }

  try {
    const parsed = parsedPreview.success
      ? parsedPreview
      : appointmentAutomationIntentSchema.safeParse(body)
    if (!parsed.success) return fail('Intent de cita inválido.', 422, parsed.error.flatten())

    const clinicId =
      parsed.data.companyId ??
      parsed.data.clinicId ??
      resolveClinicIdFromContext(context, parsed.data.companyId)
    if (!clinicId) return fail('companyId / clinicId es obligatorio.', 422)

    const user = gate.user
    const userId = user?.profileId ?? user?.patientId ?? 'assistant-guest'

    const payload = {
      userId,
      companyId: clinicId,
      message: parsed.data.message,
      channel: parsed.data.channel,
      timezone: parsed.data.timezone,
      metadata: {
        verificationToken: parsed.data.verificationToken,
        confirmation: parsed.data.confirmation,
        pendingIntent: parsed.data.pendingIntent,
        pendingPayload: parsed.data.pendingPayload,
        conversationId: parsed.data.conversationId,
        role: user?.role
      }
    }

    if (!isN8nAutomationEnabled()) {
      return fail(
        'n8n no está configurado. Define N8N_APPOINTMENTS_WEBHOOK_URL en el entorno del servidor.',
        503
      )
    }

    const result = await forwardAppointmentIntentToN8n(payload)
    if (!result) {
      return fail('No se pudo contactar con el orquestador n8n. Inténtalo de nuevo.', 502)
    }

    if (user) {
      const actor = sessionToAutomationActor(user, clinicId)
      await logAutomationAudit(actor, {
        action: 'intent.forwarded',
        clinicId,
        channel: parsed.data.channel,
        metadata: {
          intent: result.intent,
          ip: clientIp(context.request),
          needsConfirmation: result.needsConfirmation
        },
        message: parsed.data.message.slice(0, 240)
      })
    }

    return ok(result, { orchestrator: 'n8n', clinicId })
  } catch (error) {
    return fail('No se pudo procesar el intent de cita.', 500, error instanceof Error ? error.message : error)
  }
}
