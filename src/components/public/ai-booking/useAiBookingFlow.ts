import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AssistantUiState,
  BookingState,
  ChatEntry,
  PatientFormValue,
  SlotOption
} from './types'

export const AI_BOOKING_QUICK_REPLIES = [
  'Quiero reservar cita',
  'Limpieza dental',
  'Dolor dental',
  'Revisión',
  'Esta semana',
  'Por la tarde'
]

export const AI_BOOKING_INITIAL_MESSAGE =
  'Hola, soy el asistente de AgendaClinic. Dime qué necesitas y buscaré una cita disponible para ti.'

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function patientFromState(state: BookingState): PatientFormValue {
  return {
    fullName: state.patientName ?? '',
    email: state.patientEmail ?? '',
    phone: state.patientPhone ?? '',
    dni: state.patientDni ?? '',
    reason: state.reason ?? state.treatmentName ?? '',
    notes: state.notes ?? '',
    hasPortalAccount: null
  }
}

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

  const patientForm = useMemo(() => patientFromState(bookingState), [bookingState])

  const handleSendMessage = useCallback(
    async (value: string) => {
      const text = value.trim()
      if (!text) return

      const nextConversation = [...messages, { id: id('user'), role: 'user' as const, text }]
      setMessages(nextConversation)
      setChatInput('')
      setStatus('thinking')
      setErrorMessage('')

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
    [bookingState, messages, selectedSlot]
  )

  const handleSelectSlot = useCallback((slot: SlotOption) => {
    const professionalId = slot.professionalId
    if (!professionalId) return
    setSelectedSlot(slot)
    setBookingState((prev) => ({
      ...prev,
      clinicId: slot.clinicId,
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
    setStatus('collecting_patient_data')
    setMessages((prev) => [
      ...prev,
      {
        id: id('assistant'),
        role: 'assistant',
        text: 'Perfecto. Para confirmar, necesito tu nombre completo, email y teléfono.'
      }
    ])
  }, [])

  const handleConfirmBooking = useCallback(async () => {
    const slot = selectedSlot
    if (!slot?.professionalId || !bookingState.clinicId || !bookingState.treatmentId) return
    if (!patientForm.fullName || !patientForm.email || !patientForm.phone) {
      setStatus('error')
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
      setMessages((prev) => [
        ...prev,
        { id: id('assistant'), role: 'assistant', text: 'Cita reservada correctamente.' }
      ])
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo reservar la cita. Inténtalo de nuevo.')
    }
  }, [bookingState, patientForm, selectedSlot])

  const handleEditSummary = useCallback(() => {
    setReadyForSummary(false)
    setStatus('collecting_patient_data')
    void handleSendMessage('Quiero cambiar mis datos')
  }, [handleSendMessage])

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
  }, [])

  useEffect(() => {
    const query = options.initialQuery?.trim()
    if (!query) return
    void handleSendMessage(query)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.initialQuery])

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
    handleSendMessage,
    handleSelectSlot,
    handleConfirmBooking,
    handleEditSummary,
    resetFlow
  }
}
