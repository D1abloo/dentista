import type { AppointmentsChatResult } from '@/lib/ai/appointmentsChatHandler'
import type { GeminiAppointmentsIntent } from '@/lib/ai/geminiAppointmentsAssistant'
import type { N8nAppointmentIntent, N8nWebhookResponse } from './types'

function mapN8nIntent(intent: N8nAppointmentIntent | undefined): GeminiAppointmentsIntent['intent'] {
  switch (intent) {
    case 'check_availability':
    case 'create_appointment':
      return 'book_appointment'
    case 'get_appointments':
      return 'review_appointments'
    case 'cancel_appointment':
      return 'cancel_appointment'
    case 'reschedule_appointment':
      return 'reschedule_appointment'
    case 'clarify':
    case 'confirm_action':
      return 'unknown'
    default:
      return 'unknown'
  }
}

export function mapN8nResponseToChatResult(
  n8n: N8nWebhookResponse,
  base: Pick<AppointmentsChatResult, 'bookingState' | 'assistantContext'>
): AppointmentsChatResult {
  const mappedIntent = mapN8nIntent(n8n.intent)
  const manageIntents = new Set([
    'get_appointments',
    'cancel_appointment',
    'reschedule_appointment'
  ])
  const mode =
    n8n.intent === 'create_appointment' || n8n.intent === 'check_availability'
      ? 'book'
      : manageIntents.has(n8n.intent ?? '')
        ? 'manage'
        : 'help'

  const intent: GeminiAppointmentsIntent = {
    intent: mappedIntent,
    assistant_message: n8n.reply,
    should_fetch_availability: n8n.intent === 'check_availability',
    requires_identity_verification: Boolean(n8n.data?.requiresVerification),
    missing_fields: n8n.missingFields ?? [],
    urgency: 'normal',
    severe_symptoms: false
  }

  return {
    assistantMessage: n8n.reply,
    intent,
    mode,
    activeTab: mode === 'book' ? 'book' : mode === 'manage' ? 'change' : 'help',
    bookingState: base.bookingState,
    assistantContext: {
      ...base.assistantContext,
      mode,
      pendingIntent: n8n.needsConfirmation ? n8n.intent : base.assistantContext.pendingIntent
    },
    slots: Array.isArray(n8n.data?.slots) ? (n8n.data?.slots as AppointmentsChatResult['slots']) : [],
    appointments: Array.isArray(n8n.data?.appointments)
      ? (n8n.data?.appointments as AppointmentsChatResult['appointments'])
      : [],
    nextAppointment: (n8n.data?.nextAppointment as AppointmentsChatResult['nextAppointment']) ?? null,
    readyForSummary: Boolean(n8n.data?.readyForSummary),
    requiresVerification: Boolean(n8n.data?.requiresVerification),
    lookupPerformed: Boolean(n8n.data?.lookupPerformed),
    requiresStrongVerification: Boolean(n8n.data?.requiresStrongVerification),
    suggestedOptions: [],
    catalog: { clinics: [], treatments: [], professionals: [] }
  }
}
