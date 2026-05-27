import { interpretAppointmentsMessage } from '@/lib/ai/geminiAppointmentsAssistant'
import {
  bookingFieldsReady,
  patientFieldsReady,
  resolveBookingContext
} from '@/lib/ai/bookingIntentResolver'
import { logAiBookingMonitor } from '@/lib/ai/bookingMonitoring'
import {
  getNextPatientAppointment,
  getPatientAppointments,
  monitorPatientAppointmentsError
} from '@/lib/services/patientAppointmentsPublic'
import { lookupPublicAppointments } from '@/lib/services/publicAppointmentLookup'
import {
  getAvailableSlotsForPublicBooking,
  getPublicClinics,
  getPublicProfessionals,
  getPublicTreatments
} from '@/lib/services/publicAiBooking'
import type { z } from 'zod'
import { aiAssistantStateSchema } from '@/lib/validators'

type AssistantState = z.infer<typeof aiAssistantStateSchema>

export type AppointmentsChatResult = {
  assistantMessage: string
  intent: Awaited<ReturnType<typeof interpretAppointmentsMessage>>
  mode: 'book' | 'manage' | 'help'
  activeTab: 'book' | 'mine' | 'change' | 'help'
  bookingState: AssistantState['bookingState']
  assistantContext: AssistantState['assistantContext']
  slots: Awaited<ReturnType<typeof getAvailableSlotsForPublicBooking>>
  appointments: Awaited<ReturnType<typeof getPatientAppointments>>
  nextAppointment: Awaited<ReturnType<typeof getNextPatientAppointment>> | null
  readyForSummary: boolean
  requiresVerification: boolean
  lookupPerformed?: boolean
  requiresStrongVerification?: boolean
}

function intentToTab(intent: string): AppointmentsChatResult['activeTab'] {
  if (intent === 'book_appointment' || intent === 'urgency_warning') return 'book'
  if (
    intent === 'review_appointments' ||
    intent === 'next_appointment' ||
    intent === 'appointment_status' ||
    intent === 'check_appointments'
  ) {
    return 'mine'
  }
  if (intent === 'reschedule_appointment' || intent === 'cancel_appointment') return 'change'
  return 'help'
}

function intentToMode(intent: string): AppointmentsChatResult['mode'] {
  if (intent === 'book_appointment' || intent === 'urgency_warning') return 'book'
  if (
    [
      'review_appointments',
      'next_appointment',
      'reschedule_appointment',
      'cancel_appointment',
      'appointment_status',
      'check_appointments'
    ].includes(intent)
  ) {
    return 'manage'
  }
  return 'help'
}

export async function handleAppointmentsChat(input: {
  message: string
  conversation: Array<{ role: 'user' | 'assistant'; text: string }>
  assistantState: AssistantState
}): Promise<AppointmentsChatResult> {
  const { bookingState, assistantContext } = input.assistantState
  const identityVerified = Boolean(assistantContext.verificationToken)

  const clinics = await getPublicClinics()
  if (!clinics.length) throw new Error('No hay clínicas disponibles.')

  const clinicId = bookingState.clinicId ?? clinics[0]?.id
  const [treatments, professionals] = clinicId
    ? await Promise.all([getPublicTreatments(clinicId), getPublicProfessionals(clinicId)])
    : [[], []]

  const catalogSummary = [
    `Clínicas: ${clinics.map((c) => c.name).join(', ')}`,
    `Tratamientos: ${treatments.map((t) => t.name).join(', ') || '—'}`,
    `Profesionales: ${professionals.map((p) => p.fullName).join(', ') || '—'}`
  ].join('\n')

  const currentStateSummary = JSON.stringify({
    bookingState,
    assistantContext: {
      mode: assistantContext.mode,
      verified: identityVerified,
      selectedAppointmentId: assistantContext.selectedAppointmentId
    }
  })

  await logAiBookingMonitor('ai.booking_started', {})

  const intent = await interpretAppointmentsMessage({
    message: input.message,
    conversation: input.conversation,
    catalogSummary,
    currentStateSummary,
    identityVerified
  })

  await logAiBookingMonitor('ai.intent_detected', { intent: intent.intent })

  const mode = intentToMode(intent.intent)
  const activeTab = intentToTab(intent.intent)

  const nextContext = {
    ...assistantContext,
    mode,
    pendingIntent: intent.intent
  }

  let assistantMessage = intent.assistant_message
  let slots: Awaited<ReturnType<typeof getAvailableSlotsForPublicBooking>> = []
  let appointments: Awaited<ReturnType<typeof getPatientAppointments>> = []
  let nextAppointment: AppointmentsChatResult['nextAppointment'] = null

  const manageIntents = [
    'review_appointments',
    'next_appointment',
    'cancel_appointment',
    'reschedule_appointment',
    'appointment_status',
    'check_appointments'
  ]

  const identifierLike =
    input.message.trim().length >= 3 &&
    (input.message.includes('@') || /^[0-9a-zA-Z@.\-_]+$/.test(input.message.trim()))

  if (!identityVerified && manageIntents.includes(intent.intent) && identifierLike) {
    try {
      const lookup = await lookupPublicAppointments(input.message.trim())
      return {
        assistantMessage: lookup.message,
        intent,
        mode: 'manage',
        activeTab: intent.intent === 'next_appointment' ? 'mine' : intentToTab(intent.intent),
        bookingState,
        assistantContext: {
          ...nextContext,
          mode: 'manage',
          verificationToken: lookup.verificationToken,
          verificationScope: lookup.verificationToken ? 'lookup' : undefined
        },
        slots: [],
        appointments: lookup.appointments,
        nextAppointment: lookup.appointments[0] ?? null,
        readyForSummary: false,
        requiresVerification: lookup.requiresExtraVerification,
        lookupPerformed: true,
        requiresStrongVerification: lookup.requiresStrongVerification
      }
    } catch {
      /* continúa con flujo normal */
    }
  }

  const requiresVerification =
    intent.requires_identity_verification && !identityVerified

  if (requiresVerification) {
    return {
      assistantMessage:
        intent.assistant_message ||
        'Para proteger tus datos, necesito identificarte antes de mostrar tus citas.',
      intent,
      mode: 'manage',
      activeTab: activeTab === 'book' ? 'mine' : activeTab,
      bookingState,
      assistantContext: nextContext,
      slots: [],
      appointments: [],
      nextAppointment: null,
      readyForSummary: false,
      requiresVerification: true
    }
  }

  if (identityVerified && assistantContext.verificationToken) {
    const token = assistantContext.verificationToken
    if (intent.intent === 'next_appointment') {
      nextAppointment = await getNextPatientAppointment(token)
      if (nextAppointment) {
        assistantMessage = `Tu próxima cita es el ${new Date(nextAppointment.startsAt).toLocaleString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} con ${nextAppointment.professionalName} en ${nextAppointment.clinicName}.`
      } else {
        assistantMessage = 'No he encontrado citas próximas asociadas a tus datos.'
      }
    }

    if (
      intent.intent === 'review_appointments' ||
      intent.intent === 'cancel_appointment' ||
      intent.intent === 'reschedule_appointment' ||
      intent.intent === 'appointment_status'
    ) {
      appointments = await getPatientAppointments({ verificationToken: token })
      await logAiBookingMonitor('ai.appointment_review', { count: appointments.length })
      if (!appointments.length) {
        assistantMessage = 'No he encontrado citas próximas asociadas a tus datos.'
      } else if (intent.intent === 'review_appointments') {
        assistantMessage = `He encontrado ${appointments.length} cita(s) próxima(s). Selecciona una para ver detalle o gestionarla.`
      } else if (intent.intent === 'cancel_appointment') {
        assistantMessage = 'Selecciona la cita que quieres cancelar.'
      } else if (intent.intent === 'reschedule_appointment') {
        assistantMessage = 'Selecciona la cita que quieres cambiar.'
      }
    }
  }

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

  const nextBookingState = {
    ...bookingState,
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
    datePreferenceLabel: intent.date_preference ?? bookingState.datePreferenceLabel,
    timePreferenceLabel:
      intent.time_preference === 'morning'
        ? 'Por la mañana'
        : intent.time_preference === 'afternoon'
          ? 'Por la tarde'
          : intent.time_preference === 'any'
            ? 'Cualquier hora'
            : bookingState.timePreferenceLabel,
    selectedSlot: bookingState.selectedSlot
  }

  const readyForSlots =
    (intent.intent === 'book_appointment' || intent.intent === 'reschedule_appointment') &&
    bookingFieldsReady(resolved) &&
    intent.should_fetch_availability

  if (readyForSlots && nextBookingState.clinicId && nextBookingState.treatmentId && nextBookingState.dateRange) {
    await logAiBookingMonitor('ai.availability_requested', {
      clinicId: nextBookingState.clinicId
    })
    slots = await getAvailableSlotsForPublicBooking({
      clinicId: nextBookingState.clinicId,
      treatmentId: nextBookingState.treatmentId,
      professionalId: nextBookingState.professionalId,
      dateRange: nextBookingState.dateRange,
      preferredTime: nextBookingState.preferredTime
    }).then((rows) =>
      rows.map((slot) => ({
        ...slot,
        clinicName:
          nextBookingState.clinicName ?? clinics.find((c) => c.id === slot.clinicId)?.name ?? ''
      }))
    )

    if (!slots.length) {
      await logAiBookingMonitor('ai.no_slots_found', { clinicId: nextBookingState.clinicId })
      assistantMessage =
        'No hay huecos disponibles con esos filtros. Puedo buscar otro día, otro profesional o la primera cita disponible.'
    } else {
      assistantMessage = `He encontrado ${slots.length} huecos disponibles. Elige uno para continuar.`
    }
  }

  const readyForSummary =
    Boolean(nextBookingState.selectedSlot) &&
    patientFieldsReady({
      patientName: nextBookingState.patientName,
      patientEmail: nextBookingState.patientEmail,
      patientPhone: nextBookingState.patientPhone
    })

  return {
    assistantMessage,
    intent,
    mode,
    activeTab,
    bookingState: nextBookingState,
    assistantContext: {
      ...nextContext,
      mode,
      verificationScope: identityVerified ? assistantContext.verificationScope : undefined
    },
    slots,
    appointments,
    nextAppointment,
    readyForSummary,
    requiresVerification: false
  }
}

export { monitorPatientAppointmentsError }
