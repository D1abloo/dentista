import { interpretAppointmentsMessage } from '@/lib/ai/geminiAppointmentsAssistant'
import {
  bookingFieldsReady,
  patientFieldsReady,
  resolveBookingContext
} from '@/lib/ai/bookingIntentResolver'
import { logAiBookingMonitor } from '@/lib/ai/bookingMonitoring'
import { buildCatalogJson, buildSuggestedOptions, type SuggestedOption } from '@/lib/ai/suggestedOptions'
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
  intent: Awaited<ReturnType<typeof interpretAppointmentsMessage>>['intent']
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
  catalog?: {
    clinics: Awaited<ReturnType<typeof getPublicClinics>>
    treatments: Awaited<ReturnType<typeof getPublicTreatments>>
    professionals: Awaited<ReturnType<typeof getPublicProfessionals>>
  }
  suggestedOptions: SuggestedOption[]
  usedGemini?: boolean
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
  selection?: {
    clinicId?: string
    treatmentId?: string
    professionalId?: string
  }
}): Promise<AppointmentsChatResult> {
  const { bookingState, assistantContext } = input.assistantState
  const identityVerified = Boolean(assistantContext.verificationToken)
  const selection = input.selection

  let clinics: Awaited<ReturnType<typeof getPublicClinics>> = []
  let treatments: Awaited<ReturnType<typeof getPublicTreatments>> = []
  let professionals: Awaited<ReturnType<typeof getPublicProfessionals>> = []
  let clinicId = selection?.clinicId ?? bookingState.clinicId

  try {
    clinics = await getPublicClinics()
    if (!clinics.length) {
      throw new Error('No hay clínicas activas configuradas.')
    }
    clinicId = selection?.clinicId ?? bookingState.clinicId ?? clinics[0]?.id
    if (clinicId) {
      ;[treatments, professionals] = await Promise.all([
        getPublicTreatments(clinicId),
        getPublicProfessionals(clinicId)
      ])
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const isConnection =
      /fetch failed|ENOTFOUND|ECONNREFUSED|Tenant\/user|not found/i.test(message)
    const hint = isConnection
      ? ' La base de datos no responde (revisa DATABASE_URL en .env).'
      : ''
    return {
      assistantMessage: `No puedo consultar la agenda en este momento.${hint} Puedes llamar a la clínica o usar el formulario de contacto.`,
      intent: {
        intent: 'book_appointment',
        action: 'book',
        treatment: null,
        urgency: 'normal',
        clinic_preference: null,
        professional_preference: null,
        date_preference: null,
        time_preference: null,
        patient_name: null,
        patient_email: null,
        patient_phone: null,
        requires_identity_verification: false,
        missing_fields: ['database'],
        assistant_message: `No puedo consultar la agenda en este momento.${hint}`,
        should_fetch_availability: false,
        severe_symptoms: false
      },
      mode: 'book',
      activeTab: 'book',
      bookingState,
      assistantContext: { ...assistantContext, mode: 'book' },
      slots: [],
      appointments: [],
      nextAppointment: null,
      readyForSummary: false,
      requiresVerification: false,
      suggestedOptions: [],
      catalog: { clinics: [], treatments: [], professionals: [] }
    }
  }

  const catalogJson = buildCatalogJson({ clinics, treatments, professionals })
  const catalogSummary = [
    `Clínicas: ${clinics.map((c) => c.name).join(', ')}`,
    `Tratamientos: ${treatments.map((t) => t.name).join(', ') || '—'}`,
    `Profesionales: ${professionals.map((p) => p.fullName).join(', ') || '—'}`
  ].join('\n')

  const seededBookingState = {
    ...bookingState,
    clinicId: selection?.clinicId ?? bookingState.clinicId,
    treatmentId: selection?.treatmentId ?? bookingState.treatmentId,
    professionalId: selection?.professionalId ?? bookingState.professionalId,
    treatmentName:
      selection?.treatmentId != null
        ? treatments.find((t) => t.id === selection.treatmentId)?.name ?? bookingState.treatmentName
        : bookingState.treatmentName,
    professionalName:
      selection?.professionalId != null
        ? professionals.find((p) => p.id === selection.professionalId)?.fullName ??
          bookingState.professionalName
        : bookingState.professionalName,
    clinicName:
      selection?.clinicId != null
        ? clinics.find((c) => c.id === selection.clinicId)?.name ?? bookingState.clinicName
        : bookingState.clinicName
  }

  const currentStateSummary = JSON.stringify({
    bookingState: seededBookingState,
    assistantContext: {
      mode: assistantContext.mode,
      verified: identityVerified,
      selectedAppointmentId: assistantContext.selectedAppointmentId
    }
  })

  await logAiBookingMonitor('ai.booking_started', {})

  const { intent, usedGemini } = await interpretAppointmentsMessage({
    message: input.message,
    conversation: input.conversation,
    catalogSummary,
    catalogJson,
    catalogTreatments: treatments.map((t) => ({ id: t.id, name: t.name, clinic_id: t.clinicId })),
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
        bookingState: seededBookingState,
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
        requiresStrongVerification: lookup.requiresStrongVerification,
        catalog: { clinics, treatments, professionals },
        suggestedOptions: buildSuggestedOptions({
          mode: 'manage',
          clinics,
          treatments,
          professionals,
          bookingState: seededBookingState,
          intent,
          identityVerified: Boolean(lookup.verificationToken)
        }),
        usedGemini
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
      bookingState: seededBookingState,
      assistantContext: nextContext,
      slots: [],
      appointments: [],
      nextAppointment: null,
      readyForSummary: false,
      requiresVerification: true,
      catalog: { clinics, treatments, professionals },
      suggestedOptions: buildSuggestedOptions({
        mode: 'manage',
        clinics,
        treatments,
        professionals,
        bookingState: seededBookingState,
        intent,
        identityVerified: false
      }),
      usedGemini
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
    currentClinicId: seededBookingState.clinicId ?? clinicId,
    clinicId: intent.clinic_id ?? selection?.clinicId ?? seededBookingState.clinicId,
    treatmentId: intent.treatment_id ?? selection?.treatmentId ?? seededBookingState.treatmentId,
    professionalId: intent.professional_id ?? selection?.professionalId ?? seededBookingState.professionalId
  })

  const nextBookingState = {
    ...seededBookingState,
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
    datePreferenceLabel: intent.date_preference ?? seededBookingState.datePreferenceLabel,
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

  const suggestedOptions = buildSuggestedOptions({
    mode,
    clinics,
    treatments,
    professionals,
    bookingState: nextBookingState,
    intent,
    identityVerified,
    hasSlots: slots.length > 0
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
    requiresVerification: false,
    catalog: { clinics, treatments, professionals },
    suggestedOptions,
    usedGemini
  }
}

export { monitorPatientAppointmentsError }
