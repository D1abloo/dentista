import type { APIRoute } from 'astro'
import { clientIp } from '@/lib/audit/sanitize'
import { handleAppointmentsChat, monitorPatientAppointmentsError } from '@/lib/ai/appointmentsChatHandler'
import { logAiBookingMonitor } from '@/lib/ai/bookingMonitoring'
import { forwardAppointmentIntentToN8n, isN8nAutomationEnabled } from '@/lib/n8n/client'
import { mapN8nResponseToChatResult } from '@/lib/n8n/mapChatResponse'
import { fail, ok } from '@/lib/http'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { aiAppointmentsChatSchema } from '@/lib/validators'

export const prerender = false

const WINDOW_MS = 60_000
const chatRate = new Map<string, number[]>()

function isRateLimited(key: string, max: number) {
  const now = Date.now()
  const events = (chatRate.get(key) ?? []).filter((time) => now - time < WINDOW_MS)
  events.push(now)
  chatRate.set(key, events)
  return events.length > max
}

export const POST: APIRoute = async ({ request }) => {
  if (!hasSupabaseConfig()) {
    return fail('El asistente de citas no está disponible temporalmente.', 503)
  }

  const ip = clientIp(request) ?? 'unknown'
  if (isRateLimited(`appt-chat:${ip}`, 30)) {
    return fail('Has enviado demasiados mensajes. Espera unos segundos.', 429)
  }

  try {
    const body = await request.json()
    const parsed = aiAppointmentsChatSchema.safeParse(body)
    if (!parsed.success) return fail('Mensaje del chat inválido.', 422, parsed.error.flatten())

    if (isN8nAutomationEnabled()) {
      const clinicId = parsed.data.assistantState.bookingState.clinicId
      if (clinicId) {
        const n8nPayload = {
          userId: parsed.data.assistantState.assistantContext.verificationToken ? 'assistant-guest' : 'assistant-guest',
          companyId: clinicId,
          message: parsed.data.message,
          channel: 'assistant' as const,
          timezone: 'Europe/Madrid',
          metadata: {
            verificationToken: parsed.data.assistantState.assistantContext.verificationToken,
            conversationId: `ai-${ip}`,
            confirmation: parsed.data.assistantState.assistantContext.pendingIntent === 'confirm'
          }
        }
        const n8nResult = await forwardAppointmentIntentToN8n(n8nPayload)
        if (n8nResult) {
          const mapped = mapN8nResponseToChatResult(n8nResult, {
            bookingState: parsed.data.assistantState.bookingState,
            assistantContext: parsed.data.assistantState.assistantContext
          })
          return ok(mapped, { orchestrator: 'n8n' })
        }
      }
    }

    const result = await handleAppointmentsChat(parsed.data)
    return ok(result)
  } catch (error) {
    monitorPatientAppointmentsError('appointments-chat', error)
    await logAiBookingMonitor('ai.booking_failed', { scope: 'appointments-chat' })
    return fail('No se pudo contactar con el asistente.', 500)
  }
}
