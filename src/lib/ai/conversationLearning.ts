import { logEvent } from '@/lib/audit/logEvent'
import { logError } from '@/lib/logger'

type LearningPattern = {
  intent: string
  treatmentLabel?: string
  matchedTreatmentId?: string
  userMessageLength: number
  usedGemini: boolean
  at: number
}

const MAX_PATTERNS = 40
const patterns: LearningPattern[] = []

function sanitizeMessage(message: string) {
  return message
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
    .replace(/\b\d{7,}\b/g, '[num]')
    .slice(0, 120)
}

export async function recordConversationTurn(input: {
  userMessage: string
  intent: string
  treatmentLabel?: string | null
  matchedTreatmentId?: string | null
  usedGemini: boolean
  missingFields?: string[]
}) {
  const entry: LearningPattern = {
    intent: input.intent,
    treatmentLabel: input.treatmentLabel ?? undefined,
    matchedTreatmentId: input.matchedTreatmentId ?? undefined,
    userMessageLength: input.userMessage.trim().length,
    usedGemini: input.usedGemini,
    at: Date.now()
  }

  patterns.push(entry)
  if (patterns.length > MAX_PATTERNS) patterns.shift()

  try {
    await logEvent({
      event_type: 'ai.conversation_turn',
      module: 'public_ai_booking',
      action: 'learn',
      severity: 'info',
      result: 'ok',
      metadata: {
        intent: input.intent,
        treatment: input.treatmentLabel ?? null,
        treatment_id: input.matchedTreatmentId ?? null,
        message_preview: sanitizeMessage(input.userMessage),
        missing_fields: input.missingFields ?? [],
        engine: input.usedGemini ? 'gemini' : 'fallback'
      }
    })
  } catch (error) {
    logError('ai.conversation.learn', error)
  }
}

/** Resumen breve para enriquecer el prompt del LLM con patrones recientes. */
export function getLearningContextSummary(): string {
  const recent = patterns.slice(-12)
  if (!recent.length) return 'Sin patrones previos en esta sesión.'

  const lines = recent.map((p) => {
    const parts = [`intención=${p.intent}`]
    if (p.treatmentLabel) parts.push(`tratamiento="${p.treatmentLabel}"`)
    if (p.matchedTreatmentId) parts.push(`id=${p.matchedTreatmentId}`)
    parts.push(`motor=${p.usedGemini ? 'gemini' : 'regex'}`)
    return `- ${parts.join(', ')}`
  })

  return [
    'Patrones recientes de esta sesión (usa sinónimos y mapea al catálogo):',
    ...lines
  ].join('\n')
}
