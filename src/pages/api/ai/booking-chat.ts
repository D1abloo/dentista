import type { APIRoute } from 'astro'
import { clientIp } from '@/lib/audit/sanitize'
import { interpretBookingMessage } from '@/lib/ai/geminiBookingAssistant'
import {
  bookingFieldsReady,
  patientFieldsReady,
  resolveBookingContext
} from '@/lib/ai/bookingIntentResolver'
import { logAiBookingMonitor } from '@/lib/ai/bookingMonitoring'
import { fail, ok } from '@/lib/http'
import {
  getAvailableSlotsForPublicBooking,
  getPublicClinics,
  getPublicProfessionals,
  getPublicTreatments,
  monitorAiBookingError
} from '@/lib/services/publicAiBooking'
import { hasSupabaseConfig } from '@/lib/supabaseServer'
import { aiBookingChatSchema } from '@/lib/validators'

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
  if (isRateLimited(`chat:${ip}`, 30)) {
    return fail('Has enviado demasiados mensajes. Espera unos segundos.', 429)
  }

  try {
    const body = await request.json()
    const parsed = aiBookingChatSchema.safeParse(body)
    if (!parsed.success) return fail('Mensaje del chat inválido.', 422, parsed.error.flatten())

    const { message, conversation, bookingState } = parsed.data
    const clinics = await getPublicClinics()
    if (!clinics.length) return fail('No hay clínicas disponibles para reserva pública.', 503)

    const clinicId = bookingState.clinicId ?? clinics[0]?.id
    const [treatments, professionals] = clinicId
      ? await Promise.all([getPublicTreatments(clinicId), getPublicProfessionals(clinicId)])
      : [[], []]

    const catalogSummary = [
      `Clínicas: ${clinics.map((c) => c.name).join(', ')}`,
      `Tratamientos: ${treatments.map((t) => t.name).join(', ') || 'consultar al elegir clínica'}`,
      `Profesionales: ${professionals.map((p) => p.fullName).join(', ') || 'consultar al elegir clínica'}`
    ].join('\n')

    const currentStateSummary = JSON.stringify({
      clinicId: bookingState.clinicId,
      treatmentId: bookingState.treatmentId,
      professionalId: bookingState.professionalId,
      patientName: bookingState.patientName,
      patientEmail: bookingState.patientEmail,
      patientPhone: bookingState.patientPhone,
      selectedSlot: bookingState.selectedSlot ?? null
    })

    await logAiBookingMonitor('ai.booking_started', { ip })

    const intent = await interpretBookingMessage({
      message,
      conversation,
      catalogSummary,
      currentStateSummary
    })

    await logAiBookingMonitor('ai.intent_detected', {
      intent: intent.intent,
      treatment: intent.treatment,
      urgency: intent.urgency
    })

    const resolved = resolveBookingContext({
      clinics,
      treatments,
      professionals,
      clinicPreference: intent.clinic_preference,
      treatmentQuery: intent.treatment,
      professionalPreference: intent.professional_preference,
      datePreference: intent.date_preference,
      timePreference: intent.time_preference ?? undefined,
      currentClinicId: bookingState.clinicId ?? clinicId
    })

    const nextState = {
      clinicId: resolved.clinicId ?? bookingState.clinicId,
      clinicName: resolved.clinicName,
      treatmentId: resolved.treatmentId ?? bookingState.treatmentId,
      treatmentName: resolved.treatmentName,
      professionalId: resolved.professionalId ?? bookingState.professionalId,
      professionalName: resolved.professionalName,
      preferredTime: resolved.preferredTime,
      dateRange: resolved.dateRange,
      patientName: intent.patient_name ?? bookingState.patientName,
      patientEmail: intent.patient_email ?? bookingState.patientEmail,
      patientPhone: intent.patient_phone ?? bookingState.patientPhone,
      patientDni: intent.patient_dni ?? bookingState.patientDni,
      reason: intent.reason ?? bookingState.reason ?? intent.treatment ?? undefined,
      notes: intent.notes ?? bookingState.notes,
      selectedSlot: bookingState.selectedSlot
    }

    let assistantMessage = intent.assistant_message
    let slots: Awaited<ReturnType<typeof getAvailableSlotsForPublicBooking>> = []
    const readyForSlots = bookingFieldsReady(resolved) && intent.should_fetch_availability

    if (readyForSlots && nextState.clinicId && nextState.treatmentId && nextState.dateRange) {
      await logAiBookingMonitor('ai.availability_requested', {
        clinicId: nextState.clinicId,
        treatmentId: nextState.treatmentId
      })
      slots = await getAvailableSlotsForPublicBooking({
        clinicId: nextState.clinicId,
        treatmentId: nextState.treatmentId,
        professionalId: nextState.professionalId,
        dateRange: nextState.dateRange,
        preferredTime: nextState.preferredTime
      }).then((rows) =>
        rows.map((slot) => ({
          ...slot,
          clinicName: nextState.clinicName ?? clinics.find((c) => c.id === slot.clinicId)?.name ?? ''
        }))
      )

      if (!slots.length) {
        await logAiBookingMonitor('ai.no_slots_found', { clinicId: nextState.clinicId })
        assistantMessage =
          'No he encontrado huecos disponibles con esos filtros. ¿Quieres que busque otro día, otro profesional o la primera cita disponible?'
      } else {
        assistantMessage = `He encontrado ${slots.length} huecos disponibles para ${nextState.treatmentName ?? 'tu tratamiento'}. Elige uno para continuar.`
      }
    }

    const readyForSummary =
      Boolean(nextState.selectedSlot) &&
      patientFieldsReady({
        patientName: nextState.patientName,
        patientEmail: nextState.patientEmail,
        patientPhone: nextState.patientPhone
      })

    return ok({
      assistantMessage,
      intent,
      bookingState: nextState,
      slots,
      readyForSummary,
      clinics,
      treatments,
      professionals
    })
  } catch (error) {
    monitorAiBookingError('booking-chat', error)
    await logAiBookingMonitor('ai.booking_failed', { scope: 'booking-chat' })
    return fail('No se pudo contactar con el asistente.', 500)
  }
}
