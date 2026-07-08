import { useCallback, useEffect, useMemo, useState } from 'react'
import { validatePatientForm } from './patientValidation'
import { AI_APPOINTMENTS_QUICK_REPLIES } from './quickReplies'
import type {
  AssistantContext,
  AssistantMode,
  AssistantTab,
  AssistantUiState,
  BookingState,
  ChatEntry,
  PatientAppointment,
  PatientFormValue,
  SlotOption,
  SuccessKind
} from './types'
import type { PatientFormErrors } from './patientValidation'

export { AI_APPOINTMENTS_QUICK_REPLIES, AI_BOOKING_QUICK_REPLIES } from './quickReplies'

export const AI_APPOINTMENTS_INITIAL_MESSAGE =
  'Hola, soy el asistente de AgendaClinic. Puedo ayudarte a reservar una cita, revisar tus citas actuales o cambiar una cita existente. ¿Qué necesitas hacer?'

const WELCOME_MESSAGE_ID = 'assistant-welcome'

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const initialMessages = (): ChatEntry[] => [
  { id: WELCOME_MESSAGE_ID, role: 'assistant', text: AI_APPOINTMENTS_INITIAL_MESSAGE }
]

const emptyPatient = (): PatientFormValue => ({
  fullName: '',
  email: '',
  phone: '',
  dni: '',
  reason: '',
  notes: '',
  hasPortalAccount: null
})

type Options = { initialQuery?: string }

export function useAiAppointmentsFlow(options: Options = {}) {
  const [status, setStatus] = useState<AssistantUiState>('idle')
  const [messages, setMessages] = useState<ChatEntry[]>(initialMessages)
  const [chatInput, setChatInput] = useState('')
  const [bookingState, setBookingState] = useState<BookingState>({})
  const [assistantContext, setAssistantContext] = useState<AssistantContext>({ mode: 'book' })
  const [activeTab, setActiveTab] = useState<AssistantTab>('book')
  const [mode, setMode] = useState<AssistantMode>('book')
  const [slots, setSlots] = useState<SlotOption[]>([])
  const [appointments, setAppointments] = useState<PatientAppointment[]>([])
  const [nextAppointment, setNextAppointment] = useState<PatientAppointment | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<PatientAppointment | null>(null)
  const [readyForSummary, setReadyForSummary] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [hasPortalAccount, setHasPortalAccount] = useState(false)
  const [patientForm, setPatientForm] = useState<PatientFormValue>(emptyPatient)
  const [lookupIdentifier, setLookupIdentifier] = useState('')
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyPhone, setVerifyPhone] = useState('')
  const [needsStrongVerification, setNeedsStrongVerification] = useState(false)
  const [patientErrors, setPatientErrors] = useState<PatientFormErrors | null>(null)
  const [showAllSlots, setShowAllSlots] = useState(false)
  const [successKind, setSuccessKind] = useState<SuccessKind>(null)
  const [rescheduleMode, setRescheduleMode] = useState(false)

  const identityVerified = Boolean(assistantContext.verificationToken)
  const hasFullVerification = assistantContext.verificationScope === 'full'

  const handleSendMessage = useCallback(
    async (value: string, tabOverride?: AssistantTab) => {
      const text = (value ?? '').trim()
      if (!text) return

      const nextConversation = [...messages, { id: id('user'), role: 'user' as const, text }]
      setMessages(nextConversation)
      setChatInput('')
      setStatus('thinking')
      setErrorMessage('')

      try {
        const response = await fetch('/api/ai/appointments-chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          signal: AbortSignal.timeout(90_000),
          body: JSON.stringify({
            message: text,
            conversation: nextConversation.map((entry) => ({ role: entry.role, text: entry.text })),
            assistantState: {
              bookingState: {
                ...bookingState,
                selectedSlot: selectedSlot
                  ? {
                      startsAt: selectedSlot.startsAt,
                      endsAt: selectedSlot.endsAt,
                      professionalId: selectedSlot.professionalId ?? ''
                    }
                  : bookingState.selectedSlot
              },
              assistantContext: {
                ...assistantContext,
                selectedAppointmentId: selectedAppointment?.id
              }
            }
          })
        })
        const json = await response.json()
        if (!response.ok) {
          throw new Error(json.error?.message ?? 'No se pudo contactar con el asistente.')
        }

        const payload = json.data
        const assistantText = String(payload?.assistantMessage ?? 'Te ayudo con tus citas.')
        setMessages((prev) => [...prev, { id: id('assistant'), role: 'assistant', text: assistantText }])

        setBookingState(payload?.bookingState ?? {})
        setAssistantContext(payload?.assistantContext ?? assistantContext)
        setMode(payload?.mode ?? mode)
        setActiveTab(tabOverride ?? payload?.activeTab ?? activeTab)
        setSlots((payload?.slots ?? []) as SlotOption[])
        setAppointments((payload?.appointments ?? []) as PatientAppointment[])
        setNextAppointment(payload?.nextAppointment ?? null)

        if (payload?.requiresStrongVerification) {
          setNeedsStrongVerification(true)
        }

        if (payload?.requiresVerification) {
          setStatus('verifying_identity')
          return
        }

        if (payload?.lookupPerformed && !payload?.appointments?.length) {
          setStatus('no_appointments')
          return
        }

        if (payload?.readyForSummary) setReadyForSummary(true)

        if (payload?.slots?.length) {
          setStatus('showing_slots')
        } else if (payload?.appointments?.length) {
          setStatus('showing_existing_appointments')
        } else if (payload?.nextAppointment) {
          setStatus('showing_existing_appointments')
        } else if (payload?.readyForSummary) {
          setStatus('confirming_booking')
        } else {
          setStatus('idle')
        }
      } catch (error) {
        setStatus('error')
        const message = error instanceof Error ? error.message : 'No se pudo contactar con el asistente.'
        const timedOut = /timeout|aborted/i.test(message)
        setErrorMessage(
          timedOut
            ? 'La consulta tardó demasiado. Comprueba tu conexión e inténtalo de nuevo.'
            : message
        )
      }
    },
    [activeTab, assistantContext, bookingState, messages, mode, selectedAppointment, selectedSlot]
  )

  const handleLookupAppointments = useCallback(async () => {
    const identifier = lookupIdentifier.trim()
    if (!identifier) return
    setStatus('checking_appointments')
    setErrorMessage('')
    setActiveTab('mine')
    setMode('manage')
    try {
      const response = await fetch('/api/public-appointments/lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message ?? 'No se pudo consultar.')

      const data = json.data
      setMessages((prev) => [
        ...prev,
        { id: id('user'), role: 'user', text: `Consultar citas: ${identifier}` },
        { id: id('assistant'), role: 'assistant', text: String(data?.message ?? '') }
      ])

      if (data?.requiresExtraVerification) {
        setNeedsStrongVerification(true)
        setStatus('verifying_identity')
        return
      }

      if (data?.verificationToken) {
        setAssistantContext((prev) => ({
          ...prev,
          verificationToken: data.verificationToken,
          verificationScope: 'lookup',
          mode: 'manage'
        }))
      }

      const rows = (data?.appointments ?? []) as PatientAppointment[]
      setAppointments(rows)
      setNextAppointment(rows[0] ?? null)
      setStatus(rows.length ? 'showing_existing_appointments' : 'no_appointments')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo buscar tus citas.')
    }
  }, [lookupIdentifier])

  const handleVerifyIdentity = useCallback(async () => {
    setStatus('verifying_identity')
    setErrorMessage('')
    try {
      const response = await fetch('/api/patient-appointments/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, phone: verifyPhone })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message ?? 'Verificación fallida.')

      const token = json.data?.verificationToken as string
      setAssistantContext((prev) => ({
        ...prev,
        verificationToken: token,
        verificationScope: 'full',
        mode: 'manage'
      }))
      setNeedsStrongVerification(false)
      setMode('manage')
      setStatus('identity_verified')
      setMessages((prev) => [
        ...prev,
        { id: id('assistant'), role: 'assistant', text: 'Identidad verificada. ¿Qué quieres hacer con tus citas?' }
      ])

      const listRes = await fetch(
        `/api/patient-appointments/list?verificationToken=${encodeURIComponent(token)}`
      )
      const listJson = await listRes.json()
      if (listRes.ok) {
        setAppointments(listJson.data?.appointments ?? [])
        setStatus(
          listJson.data?.appointments?.length ? 'showing_existing_appointments' : 'no_appointments'
        )
      }
    } catch (error) {
      setStatus('verifying_identity')
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo verificar.')
    }
  }, [verifyEmail, verifyPhone])

  const handleSelectAppointment = useCallback((appointment: PatientAppointment) => {
    setSelectedAppointment(appointment)
    setAssistantContext((prev) => ({
      ...prev,
      selectedAppointmentId: appointment.id,
      mode: 'manage'
    }))
    setBookingState((prev) => ({
      ...prev,
      clinicId: appointment.clinicId,
      clinicName: appointment.clinicName,
      treatmentId: appointment.treatmentId,
      treatmentName: appointment.treatmentName,
      professionalId: appointment.professionalId,
      professionalName: appointment.professionalName
    }))
  }, [])

  const handleStartReschedule = useCallback(
    (appointment: PatientAppointment) => {
      handleSelectAppointment(appointment)
      if (!hasFullVerification) {
        setNeedsStrongVerification(true)
        setStatus('verifying_identity')
        return
      }
      setRescheduleMode(true)
      setActiveTab('change')
      setMode('manage')
      setSlots([])
      setStatus('asking_followup')
      void handleSendMessage(`Quiero cambiar mi cita del ${appointment.startsAt.slice(0, 10)}`, 'change')
    },
    [handleSelectAppointment, handleSendMessage, hasFullVerification]
  )

  const handleStartCancel = useCallback(
    (appointment: PatientAppointment) => {
      handleSelectAppointment(appointment)
      setActiveTab('change')
      if (!hasFullVerification) {
        setNeedsStrongVerification(true)
        setStatus('verifying_identity')
        return
      }
      setStatus('confirming_cancel')
    },
    [handleSelectAppointment, hasFullVerification]
  )

  const handleConfirmCancel = useCallback(async () => {
    const appt = selectedAppointment
    const token = assistantContext.verificationToken
    if (!appt || !token) return
    setStatus('booking')
    try {
      const response = await fetch('/api/patient-appointments/cancel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          verificationToken: token,
          appointmentId: appt.id,
          clinicId: appt.clinicId
        })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message ?? 'No se pudo cancelar.')
      setSuccessKind('cancelled')
      setStatus('success')
      setMessages((prev) => [
        ...prev,
        { id: id('assistant'), role: 'assistant', text: 'Cita cancelada correctamente.' }
      ])
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cancelar la cita.')
    }
  }, [assistantContext.verificationToken, selectedAppointment])

  const handleSelectSlot = useCallback(
    (slot: SlotOption) => {
      const professionalId = slot.professionalId
      if (!professionalId) return

      if (rescheduleMode && selectedAppointment && assistantContext.verificationToken) {
        setSelectedSlot(slot)
        setStatus('confirming_reschedule')
        return
      }

      setSelectedSlot(slot)
      setBookingState((prev) => ({
        ...prev,
        clinicId: slot.clinicId,
        clinicName: slot.clinicName ?? prev.clinicName,
        treatmentId: slot.treatmentId,
        treatmentName: slot.treatmentName,
        professionalId,
        professionalName: slot.professionalName,
        selectedSlot: { startsAt: slot.startsAt, endsAt: slot.endsAt, professionalId }
      }))
      setReadyForSummary(false)
      setStatus('collecting_patient_data')
      setPatientForm((prev) => ({ ...prev, reason: prev.reason || slot.treatmentName }))
    },
    [assistantContext.verificationToken, rescheduleMode, selectedAppointment]
  )

  const handleConfirmReschedule = useCallback(async () => {
    const appt = selectedAppointment
    const slot = selectedSlot
    const token = assistantContext.verificationToken
    if (!appt || !slot?.professionalId || !token) return
    setStatus('booking')
    try {
      const response = await fetch('/api/patient-appointments/reschedule', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          verificationToken: token,
          appointmentId: appt.id,
          clinicId: appt.clinicId,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          professionalId: slot.professionalId
        })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message ?? 'No se pudo cambiar la cita.')
      setSuccessKind('rescheduled')
      setStatus('success')
      setRescheduleMode(false)
      setMessages((prev) => [
        ...prev,
        { id: id('assistant'), role: 'assistant', text: 'Cita cambiada correctamente.' }
      ])
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cambiar la cita.')
    }
  }, [assistantContext.verificationToken, selectedAppointment, selectedSlot])

  const handlePatientContinue = useCallback(() => {
    const errors = validatePatientForm(patientForm)
    if (errors) {
      setPatientErrors(errors)
      return
    }
    setPatientErrors(null)
    setBookingState((prev) => ({
      ...prev,
      patientName: patientForm.fullName.trim(),
      patientEmail: patientForm.email.trim(),
      patientPhone: patientForm.phone.trim()
    }))
    setReadyForSummary(true)
    setStatus('confirming_booking')
  }, [patientForm])

  const handleConfirmBooking = useCallback(async () => {
    const slot = selectedSlot
    if (!slot?.professionalId || !bookingState.clinicId || !bookingState.treatmentId) return
    const errors = validatePatientForm(patientForm)
    if (errors) {
      setPatientErrors(errors)
      setStatus('collecting_patient_data')
      return
    }
    setStatus('booking')
    try {
      const response = await fetch('/api/public-booking/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clinicId: bookingState.clinicId,
          treatmentId: bookingState.treatmentId,
          professionalId: slot.professionalId,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          reason: patientForm.reason,
          hasPortalAccount: false,
          patient: {
            fullName: patientForm.fullName,
            email: patientForm.email,
            phone: patientForm.phone,
            dni: patientForm.dni || undefined
          }
        })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message ?? 'No se pudo reservar la cita.')
      setSuccessKind('booked')
      setStatus('success')
      setHasPortalAccount(Boolean(json.data?.hasPortalAccount))
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo reservar la cita.')
    }
  }, [bookingState, patientForm, selectedSlot])

  const handleTabChange = useCallback(
    (tab: AssistantTab) => {
      setActiveTab(tab)
      if (tab === 'book') {
        setMode('book')
        void handleSendMessage('Quiero reservar una cita nueva', 'book')
      } else if (tab === 'mine') {
        setMode('manage')
        void handleSendMessage('Ver mis citas', 'mine')
      } else if (tab === 'change') {
        setMode('manage')
        void handleSendMessage('Cambiar una cita', 'change')
      } else {
        setMode('help')
        void handleSendMessage('Necesito ayuda con mis citas', 'help')
      }
    },
    [handleSendMessage]
  )

  const resetFlow = useCallback(() => {
    setStatus('idle')
    setMessages(initialMessages())
    setBookingState({})
    setAssistantContext({ mode: 'book' })
    setActiveTab('book')
    setMode('book')
    setSlots([])
    setAppointments([])
    setNextAppointment(null)
    setSelectedSlot(null)
    setSelectedAppointment(null)
    setReadyForSummary(false)
    setErrorMessage('')
    setHasPortalAccount(false)
    setChatInput('')
    setPatientForm(emptyPatient())
    setVerifyEmail('')
    setVerifyPhone('')
    setLookupIdentifier('')
    setNeedsStrongVerification(false)
    setPatientErrors(null)
    setShowAllSlots(false)
    setSuccessKind(null)
    setRescheduleMode(false)
  }, [])

  const handleRetry = useCallback(() => {
    setErrorMessage('')
    void handleSendMessage('Quiero reintentar')
  }, [handleSendMessage])

  useEffect(() => {
    const query = options.initialQuery?.trim()
    if (!query) return
    void handleSendMessage(query)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.initialQuery])

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (!json.data?.patientId) return
        void fetch('/api/patient-appointments/verify', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({})
        })
          .then((r) => r.json())
          .then((v) => {
            if (v.data?.verificationToken) {
              setAssistantContext((prev) => ({
                ...prev,
                verificationToken: v.data.verificationToken,
                verificationScope: 'full'
              }))
            }
          })
      })
      .catch(() => undefined)
  }, [])

  const showHelpCard = useMemo(
    () => messages.length === 1 && messages[0]?.role === 'assistant',
    [messages]
  )

  const handleRequestStrongVerification = useCallback(() => {
    setNeedsStrongVerification(true)
    setStatus('verifying_identity')
  }, [])

  return {
    status,
    messages,
    chatInput,
    setChatInput,
    bookingState,
    assistantContext,
    activeTab,
    mode,
    identityVerified,
    hasFullVerification,
    lookupIdentifier,
    setLookupIdentifier,
    needsStrongVerification,
    handleLookupAppointments,
    handleRequestStrongVerification,
    slots,
    appointments,
    nextAppointment,
    selectedSlot,
    selectedAppointment,
    readyForSummary,
    errorMessage,
    hasPortalAccount,
    patientForm,
    setPatientForm,
    verifyEmail,
    setVerifyEmail,
    verifyPhone,
    setVerifyPhone,
    patientErrors,
    showAllSlots,
    setShowAllSlots,
    successKind,
    rescheduleMode,
    showHelpCard,
    handleSendMessage,
    handleVerifyIdentity,
    handleSelectAppointment,
    handleStartReschedule,
    handleStartCancel,
    handleConfirmCancel,
    handleSelectSlot,
    handleConfirmReschedule,
    handlePatientContinue,
    handleConfirmBooking,
    handleTabChange,
    handleRetry,
    resetFlow
  }
}

export const useAiBookingFlow = useAiAppointmentsFlow
export const AI_BOOKING_INITIAL_MESSAGE = AI_APPOINTMENTS_INITIAL_MESSAGE
