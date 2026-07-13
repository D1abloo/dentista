import { logEvent } from '@/lib/audit/logEvent'
import { logError } from '@/lib/logger'

export type AiBookingMonitorEvent =
  | 'ai.booking_started'
  | 'ai.intent_detected'
  | 'ai.availability_requested'
  | 'ai.no_slots_found'
  | 'ai.appointment_confirmed'
  | 'ai.appointment_review'
  | 'ai.booking_failed'
  | 'ai.conversation_turn'

export async function logAiBookingMonitor(
  eventType: AiBookingMonitorEvent,
  meta: Record<string, unknown> = {}
) {
  try {
    await logEvent({
      event_type: eventType,
      module: 'public_ai_booking',
      action: eventType,
      severity: eventType === 'ai.booking_failed' ? 'medium' : 'info',
      result: eventType === 'ai.booking_failed' ? 'error' : 'ok',
      metadata: meta
    })
  } catch (error) {
    logError('ai.booking.monitor', error)
  }
}
