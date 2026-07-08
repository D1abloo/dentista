import { logError } from '@/lib/logger'
import type { N8nWebhookPayload, N8nWebhookResponse } from './types'

export function n8nAppointmentsWebhookUrl() {
  return import.meta.env.N8N_APPOINTMENTS_WEBHOOK_URL?.trim() || ''
}

export function isN8nAutomationEnabled() {
  return Boolean(n8nAppointmentsWebhookUrl())
}

export async function forwardAppointmentIntentToN8n(
  payload: N8nWebhookPayload
): Promise<N8nWebhookResponse | null> {
  const url = n8nAppointmentsWebhookUrl()
  if (!url) return null

  const secret = import.meta.env.N8N_WEBHOOK_SECRET?.trim()
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json'
  }
  if (secret) headers['x-n8n-webhook-token'] = secret

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25_000)
    })

    type N8nWebhookJson = {
      data?: N8nWebhookResponse
      reply?: string
      error?: { message?: string } | null
    }
    const text = await response.text()
    let json: N8nWebhookJson | null = null
    if (text) {
      try {
        json = JSON.parse(text) as N8nWebhookJson
      } catch {
        logError('n8n.webhook.parse', { status: response.status, body: text.slice(0, 200) })
        return null
      }
    }

    if (!response.ok) {
      logError('n8n.webhook.http', { status: response.status, body: json })
      return {
        reply: 'No pude completar la automatización en este momento. Inténtalo de nuevo.',
        error: json?.error?.message ?? `HTTP ${response.status}`
      }
    }

    if (json?.data) return json.data
    if (json?.reply) return { reply: json.reply, error: null }
    return {
      reply: 'He recibido tu solicitud. ¿Puedes darme un poco más de detalle?',
      intent: 'clarify'
    }
  } catch (error) {
    logError('n8n.webhook.fetch', error)
    return null
  }
}
