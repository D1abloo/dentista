import { useCallback, useEffect, useMemo, useState } from 'react'
import { validatePatientForm } from './patientValidation'
import { AI_BOOKING_QUICK_REPLIES } from './quickReplies'
import type {
  AssistantUiState,
  BookingState,
  ChatEntry,
  PatientFormValue,
  SlotOption
} from './types'
import type { PatientFormErrors } from './patientValidation'

export { AI_BOOKING_QUICK_REPLIES }

export const AI_BOOKING_INITIAL_MESSAGE =
  'Hola, soy el asistente de AgendaClinic. Dime qué necesitas y buscaré una cita disponible para ti.'

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const emptyPatient = (): PatientFormValue => ({
  fullName: '',
  email: '',
  phone: '',
  dni: '',
  reason: '',
  notes: '',
  hasPortalAccount: null
})

type Options = {
  initialQuery?: string
}

export function useAiBookingFlow(options: Options = {}) {
  const [status, setStatus] = useState<AssistantUiState>('idle')
  const [messages, setMessages] = useState<ChatEntry[]>([
    { id: id('assistant'), role: 'assistant', text: AI_BOOKING_INITIAL_MESSAGE }
  ])
  const [chatInput, setChatInput] = useState('')
  const [bookingState, setBookingState] = useState<BookingState>({})
  const [slots, setSlots] = useState<SlotOption[]>([])
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null)
  const [readyForSummary, setReadyForSummary] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [hasPortalAccount, setHasPortalAccount] = useState(false)
  const [patientForm, setPatientForm] = useState<PatientFormValue>(emptyPatient)
  const [patientErrors, setPatientErrors] = useState<PatientFormErrors | null>(null)
  const [showAllSlots, setShowAllSlots] = useState(false)
  const [availabilityFetched, setAvailabilityFetched] = useState(false)

  const syncPatientFromState = useCallback((state: BookingState) => {
    setPatientForm((prev) => ({
      ...prev,
      fullName: state.patientName ?? prev.fullName,
      email: state.patientEmail ?? prev.email,
      phone: state.patientPhone ?? prev.phone,
      dni: state.patientDni ?? prev.dni,
      reason: state.reason ?? state.treatmentName ?? prev.reason,
      notes: state.notes ?? prev.notes
    }))
  }, [])

  const handleSendMessage = useCallback(
    async (value: string) => {
      const text = value.trim()
      if (!text) return

      const nextConversation = [...messages, { id: id('user'), role: 'user' as const, text }]
      setMessages(nextConversation)
      setChatInput('')
      setStatus('thinking')
      setErrorMessage('')
      setShowAllSlots(false)

      try {
        const response = await fetch('/api/ai/booking-chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversation: nextConversation.map((entry) => ({ role: entry.role, text: entry.text })),
            bookingState: {
              ...bookingState,
              selectedSlot: selectedSlot
                ? {
                    startsAt: selectedSlot.startsAt,
                    endsAt: selectedSlot.endsAt,
                    professionalId: selectedSlot.professionalId ?? ''
                  }
                : bookingState.selectedSlot
            }
          })
        })
        const json = await response.json()
        if (!response.ok) {
          throw new Error(json.error?.message ?? 'No se pudo contactar con el asistente.')
        }

        const assistantText = String(json.data?.assistantMessage ?? 'Te ayudo con la reserva.')
        setMessages((prev) => [...prev, { id: id('assistant'), role: 'assistant', text: assistantText }])

        const nextState = (json.data?.bookingState ?? {}) as BookingState
        setBookingState(nextState)
        syncPatientFromState(nextState)

        if (nextState.selectedSlot && !selectedSlot) {
          const match = (json.data?.slots as SlotOption[] | undefined)?.find(
            (slot) => slot.startsAt === nextState.selectedSlot?.startsAt
          )
          if (match) setSelectedSlot(match)
        }

        const nextSlots = (json.data?.slots ?? []) as SlotOption[]
        setSlots(nextSlots)

        const summaryReady = Boolean(json.data?.readyForSummary)
        setReadyForSummary(summaryReady)

        const fetchedAvailability = Boolean(json.data?.intent?.should_fetch_availability)
        if (fetchedAvailability) {
          setAvailabilityFetched(true)
          if (!nextSlots.length) {
            setStatus('no_availability')
            return
          }
        }

        if (nextSlots.length) {
          setStatus('showing_slots')
        } else if (summaryReady) {
          setStatus('confirming')
        } else {
          setStatus('asking_followup')
        }
      } catch (error) {
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'No se pudo contactar con el asistente.')
        setMessages((prev) => [
          ...prev,
          { id: id('assistant'), role: 'assistant', text: 'No se pudo contactar con el asistente.' }
        ])
      }
    },
    [bookingState, messages, selectedSlot, syncPatientFromState]
  )

  const handleSelectSlot = useCallback((slot: SlotOption) => {
    const professionalId = slot.professionalId
    if (!professionalId) return
    setSelectedSlot(slot)
    setBookingState((prev) => ({
      ...prev,
      clinicId: slot.clinicId,
      clinicName: slot.clinicName ?? prev.clinicName,
      treatmentId: slot.treatmentId,
      treatmentName: slot.treatmentName,
      professionalId,
      professionalName: slot.professionalName,
      selectedSlot: {
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        professionalId
      }
    }))
    setReadyForSummary(false)
    setStatus('collecting_patient_data')
    setPatientForm((prev) => ({
      ...prev,
      reason: prev.reason || slot.treatmentName
    }))
    setMessages((prev) => [
      ...prev,
      {
        id: id('assistant'),
        role: 'assistant',
        text: 'Perfecto. Completa tus datos para continuar con la reserva.'
      }
    ])
  }, [])

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
      patientPhone: patientForm.phone.trim(),
      patientDni: patientForm.dni.trim() || undefined,
      reason: patientForm.reason.trim() || prev.treatmentName,
      notes: patientForm.notes.trim() || undefined
    }))
    setReadyForSummary(true)
    setStatus('confirming')
    setMessages((prev) => [
      ...prev,
      {
        id: id('assistant'),
        role: 'assistant',
        text: 'Revisa el resumen y confirma tu cita cuando estés listo.'
      }
    ])
  }, [patientForm])

  const handleConfirmBooking = useCallback(async () => {
    const slot = selectedSlot
    if (!slot?.professionalId || !bookingState.clinicId || !bookingState.treatmentId) return

    const errors = validatePatientForm(patientForm)
    if (errors) {
      setPatientErrors(errors)
      setStatus('collecting_patient_data')
      setErrorMessage('Completa los datos obligatorios.')
      return
    }

    setStatus('booking')
    setErrorMessage('')
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
          reason: `${patientForm.reason}${patientForm.notes ? ` · ${patientForm.notes}` : ''}`,
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
      if (!response.ok) {
        throw new Error(json.error?.message ?? 'No se pudo reservar la cita. Inténtalo de nuevo.')
      }
      setStatus('success')
      setHasPortalAccount(Boolean(json.data?.hasPortalAccount))
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo reservar la cita. Inténtalo de nuevo.')
    }
  }, [bookingState, patientForm, selectedSlot])

  const handleEditSummary = useCallback(() => {
    setReadyForSummary(false)
    setStatus('collecting_patient_data')
  }, [])

  const resetFlow = useCallback(() => {
    setStatus('idle')
    setMessages([{ id: id('assistant'), role: 'assistant', text: AI_BOOKING_INITIAL_MESSAGE }])
    setBookingState({})
    setSlots([])
    setSelectedSlot(null)
    setReadyForSummary(false)
    setErrorMessage('')
    setHasPortalAccount(false)
    setChatInput('')
    setPatientForm(emptyPatient())
    setPatientErrors(null)
    setShowAllSlots(false)
    setAvailabilityFetched(false)
  }, [])

  const handleRetry = useCallback(() => {
    setErrorMessage('')
    setStatus(messages.length > 1 ? 'asking_followup' : 'idle')
    void handleSendMessage('Quiero reintentar la reserva')
  }, [handleSendMessage, messages.length])

  useEffect(() => {
    const query = options.initialQuery?.trim()
    if (!query) return
    void handleSendMessage(query)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.initialQuery])

  const showHelpCard = useMemo(
    () => messages.length === 1 && messages[0]?.role === 'assistant',
    [messages]
  )

  return {
    status,
    messages,
    chatInput,
    setChatInput,
    bookingState,
    slots,
    selectedSlot,
    readyForSummary,
    errorMessage,
    hasPortalAccount,
    patientForm,
    setPatientForm,
    patientErrors,
    showAllSlots,
    setShowAllSlots,
    availabilityFetched,
    showHelpCard,
    handleSendMessage,
    handleSelectSlot,
    handlePatientContinue,
    handleConfirmBooking,
    handleEditSummary,
    handleRetry,
    resetFlow
  }
}
