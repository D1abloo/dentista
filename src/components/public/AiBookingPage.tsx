import { useEffect, useMemo, useState } from 'react'
import { MessageSquareHeart } from 'lucide-react'
import { PublicFooter } from '@/components/public/PublicFooter'
import { PublicHeader } from '@/components/public/PublicHeader'
import { AiChatWindow } from '@/components/public/ai-booking/AiChatWindow'
import { BookingErrorState } from '@/components/public/ai-booking/BookingErrorState'
import { BookingSuccessCard } from '@/components/public/ai-booking/BookingSuccessCard'
import { BookingSummaryCard } from '@/components/public/ai-booking/BookingSummaryCard'
import { SlotCard } from '@/components/public/ai-booking/SlotCard'
import type {
  AssistantUiState,
  BookingState,
  ChatEntry,
  PatientFormValue,
  SlotOption
} from '@/components/public/ai-booking/types'

const QUICK_REPLIES = [
  'Quiero reservar cita',
  'Limpieza dental',
  'Dolor dental',
  'Revisión',
  'Esta semana',
  'Por la tarde'
]

const INITIAL_MESSAGE =
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

export function AiBookingPage() {
  const [status, setStatus] = useState<AssistantUiState>('idle')
  const [messages, setMessages] = useState<ChatEntry[]>([
    { id: id('assistant'), role: 'assistant', text: INITIAL_MESSAGE }
  ])
  const [chatInput, setChatInput] = useState('')
  const [bookingState, setBookingState] = useState<BookingState>({})
  const [slots, setSlots] = useState<SlotOption[]>([])
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null)
  const [readyForSummary, setReadyForSummary] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [hasPortalAccount, setHasPortalAccount] = useState(false)

  const patientForm = useMemo(() => patientFromState(bookingState), [bookingState])

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('q')
    if (query) void handleSendMessage(query)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSendMessage(value: string) {
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
  }

  const handleSelectSlot = (slot: SlotOption) => {
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
  }

  async function handleConfirmBooking() {
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
  }

  function resetFlow() {
    setStatus('idle')
    setMessages([{ id: id('assistant'), role: 'assistant', text: INITIAL_MESSAGE }])
    setBookingState({})
    setSlots([])
    setSelectedSlot(null)
    setReadyForSummary(false)
    setErrorMessage('')
  }

  return (
    <>
      <PublicHeader activeHref="/reservar-con-ia" />
      <main className="min-h-screen bg-[radial-gradient(1200px_circle_at_16%_8%,rgba(221,245,242,0.7),transparent_55%),radial-gradient(900px_circle_at_88%_12%,rgba(238,248,249,0.9),transparent_55%),linear-gradient(180deg,#f7fbff,white)]">
        <section className="mx-auto max-w-6xl px-4 pb-7 pt-10 md:px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-200">
            <MessageSquareHeart className="h-4 w-4" aria-hidden />
            Asistente de citas con IA
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Reserva tu cita online con ayuda de IA</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Cuéntanos qué necesitas y te ayudamos a encontrar el mejor hueco disponible.
          </p>
          <div className="mt-6 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <p className="ai-page__card px-4 py-3">
              <strong className="text-slate-900">Encuentra el mejor hueco disponible</strong>
              <span className="mt-1 block text-slate-600">
                Pregunta en lenguaje natural y el asistente buscará huecos reales en tu clínica.
              </span>
            </p>
            <p className="ai-page__card px-4 py-3">
              <strong className="text-slate-900">Reserva segura conectada con tu clínica</strong>
              <span className="mt-1 block text-slate-600">
                La cita queda registrada en la agenda y podrás consultarla en el Portal del Paciente.
              </span>
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-14 md:px-6 lg:grid-cols-[1.15fr_0.85fr]">
          <AiChatWindow
            messages={messages}
            quickReplies={QUICK_REPLIES}
            chatInput={chatInput}
            status={status}
            onInputChange={setChatInput}
            onSend={(value) => void handleSendMessage(value)}
            onQuickReply={(value) => void handleSendMessage(value)}
          />

          <aside className="space-y-3">
            {status === 'error' && errorMessage ? <BookingErrorState message={errorMessage} /> : null}

            {!!slots.length ? (
              <article className="space-y-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <h3 className="px-1 text-sm font-semibold text-slate-900">Huecos disponibles</h3>
                {slots.map((slot) => (
                  <SlotCard
                    key={`${slot.startsAt}-${slot.professionalName}`}
                    slot={slot}
                    onSelect={handleSelectSlot}
                  />
                ))}
              </article>
            ) : null}

            {selectedSlot && readyForSummary && status !== 'success' ? (
              <BookingSummaryCard
                clinicName={bookingState.clinicName}
                treatmentName={bookingState.treatmentName ?? selectedSlot.treatmentName}
                slot={selectedSlot}
                patient={patientForm}
                onConfirm={() => void handleConfirmBooking()}
                onEdit={() => {
                  setReadyForSummary(false)
                  setStatus('collecting_patient_data')
                  void handleSendMessage('Quiero cambiar mis datos')
                }}
                loading={status === 'booking'}
              />
            ) : null}

            {status === 'success' && selectedSlot ? (
              <BookingSuccessCard
                hasPortalAccount={hasPortalAccount}
                onBookAnother={resetFlow}
                calendarEvent={{
                  title: `Cita: ${bookingState.treatmentName ?? selectedSlot.treatmentName}`,
                  startsAt: selectedSlot.startsAt,
                  endsAt: selectedSlot.endsAt,
                  location: bookingState.clinicName ?? selectedSlot.clinicName,
                  description: `Profesional: ${selectedSlot.professionalName}`
                }}
              />
            ) : null}
          </aside>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}
