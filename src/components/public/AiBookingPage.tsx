import { useEffect, useMemo, useState } from 'react'
import { MessageSquareHeart } from 'lucide-react'
import { PublicFooter } from '@/components/public/PublicFooter'
import { PublicHeader } from '@/components/public/PublicHeader'
import { BookingErrorState } from '@/components/public/ai-booking/BookingErrorState'
import { BookingSuccessCard } from '@/components/public/ai-booking/BookingSuccessCard'
import { BookingSummaryCard } from '@/components/public/ai-booking/BookingSummaryCard'
import { ChatMessage } from '@/components/public/ai-booking/ChatMessage'
import { PatientDetailsForm } from '@/components/public/ai-booking/PatientDetailsForm'
import { QuickReplyChips } from '@/components/public/ai-booking/QuickReplyChips'
import { SlotCard } from '@/components/public/ai-booking/SlotCard'
import type {
  AssistantUiState,
  ChatEntry,
  ClinicOption,
  PatientFormValue,
  ProfessionalOption,
  SlotOption,
  TreatmentOption
} from '@/components/public/ai-booking/types'

const QUICK_REPLIES = [
  'Limpieza dental',
  'Revisión',
  'Dolor dental',
  'Ortodoncia',
  'Blanqueamiento',
  'Urgencia'
]

const DEFAULT_PATIENT: PatientFormValue = {
  fullName: '',
  email: '',
  phone: '',
  dni: '',
  reason: '',
  notes: '',
  hasPortalAccount: null
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function todayRange() {
  const now = new Date()
  const from = now.toISOString().slice(0, 10)
  const toDate = new Date(now)
  toDate.setDate(toDate.getDate() + 7)
  return { from, to: toDate.toISOString().slice(0, 10) }
}

export function AiBookingPage() {
  const [status, setStatus] = useState<AssistantUiState>('idle')
  const [clinics, setClinics] = useState<ClinicOption[]>([])
  const [treatments, setTreatments] = useState<TreatmentOption[]>([])
  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([])
  const [selectedClinicId, setSelectedClinicId] = useState<string>('')
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>('')
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('')
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'any'>('any')
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: id('assistant'),
      role: 'assistant',
      text: 'Hola, soy el asistente de AgendaClinic. Puedo ayudarte a reservar una cita. ¿Qué tratamiento necesitas?'
    }
  ])
  const [slots, setSlots] = useState<SlotOption[]>([])
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null)
  const [patientForm, setPatientForm] = useState<PatientFormValue>(DEFAULT_PATIENT)
  const [showSummary, setShowSummary] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [hasPortalAccount, setHasPortalAccount] = useState(false)

  const selectedClinic = useMemo(
    () => clinics.find((item) => item.id === selectedClinicId),
    [clinics, selectedClinicId]
  )
  const selectedTreatment = useMemo(
    () => treatments.find((item) => item.id === selectedTreatmentId),
    [treatments, selectedTreatmentId]
  )

  async function loadBootstrap(clinicId?: string) {
    const url = clinicId ? `/api/public/ai-booking?clinicId=${encodeURIComponent(clinicId)}` : '/api/public/ai-booking'
    const response = await fetch(url)
    const json = await response.json()
    if (!response.ok) throw new Error(json.error?.message ?? 'No se pudo inicializar.')
    const nextClinics = (json.data?.clinics ?? []) as ClinicOption[]
    setClinics(nextClinics)
    const nextTreatments = (json.data?.treatments ?? []) as TreatmentOption[]
    const nextProfessionals = (json.data?.professionals ?? []) as ProfessionalOption[]
    setTreatments(nextTreatments)
    setProfessionals(nextProfessionals)
    if (!selectedClinicId && nextClinics[0]?.id) {
      setSelectedClinicId(nextClinics[0].id)
    }
  }

  useEffect(() => {
    void loadBootstrap()
  }, [])

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('q')
    if (query) void handleSendMessage(query)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSendMessage(value: string) {
    const text = value.trim()
    if (!text) return
    setMessages((prev) => [...prev, { id: id('user'), role: 'user', text }])
    setChatInput('')
    setStatus('thinking')
    try {
      const response = await fetch('/api/public/ai-booking', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          payload: {
            message: text,
            clinicId: selectedClinicId || undefined,
            treatmentId: selectedTreatmentId || undefined,
            professionalId: selectedProfessionalId || undefined
          }
        })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message ?? 'No se pudo procesar el mensaje.')
      setMessages((prev) => [
        ...prev,
        { id: id('assistant'), role: 'assistant', text: String(json.data?.response ?? 'Te ayudo con la reserva.') }
      ])
      const suggestion = String(json.data?.suggestion ?? '').toLowerCase()
      if (suggestion) {
        const treatment = treatments.find((item) => item.name.toLowerCase().includes(suggestion))
        if (treatment) setSelectedTreatmentId(treatment.id)
      }
      setStatus('idle')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo comprobar la disponibilidad.')
      setMessages((prev) => [
        ...prev,
        { id: id('assistant'), role: 'assistant', text: 'No se pudo comprobar la disponibilidad.' }
      ])
    }
  }

  async function handleFetchSlots() {
    if (!selectedClinicId || !selectedTreatmentId) return
    setStatus('fetching_availability')
    setErrorMessage('')
    const range = todayRange()
    try {
      const response = await fetch('/api/public/ai-booking', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'slots',
          payload: {
            clinicId: selectedClinicId,
            treatmentId: selectedTreatmentId,
            professionalId: selectedProfessionalId || undefined,
            fromDate: range.from,
            toDate: range.to,
            preferredTime
          }
        })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message ?? 'No se pudo comprobar la disponibilidad.')
      const nextSlots = (json.data?.slots ?? []) as SlotOption[]
      setSlots(nextSlots)
      if (!nextSlots.length) {
        setStatus('no_availability')
        setMessages((prev) => [
          ...prev,
          {
            id: id('assistant'),
            role: 'assistant',
            text: 'No he encontrado huecos disponibles con esos filtros.'
          }
        ])
        return
      }
      setStatus('idle')
      setMessages((prev) => [
        ...prev,
        {
          id: id('assistant'),
          role: 'assistant',
          text: `He encontrado ${nextSlots.length} huecos disponibles para ${selectedTreatment?.name ?? 'tu tratamiento'}.`
        }
      ])
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo comprobar la disponibilidad.')
    }
  }

  async function handleConfirmBooking() {
    if (!selectedSlot || !selectedTreatmentId || !selectedClinicId || !selectedSlot.professionalId) return
    if (!patientForm.fullName || !patientForm.email || !patientForm.phone || !patientForm.reason) {
      setStatus('error')
      setErrorMessage('Completa los datos obligatorios.')
      return
    }
    setStatus('booking')
    setErrorMessage('')
    try {
      const response = await fetch('/api/public/ai-booking', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          payload: {
            clinicId: selectedClinicId,
            treatmentId: selectedTreatmentId,
            professionalId: selectedSlot.professionalId,
            startsAt: selectedSlot.startsAt,
            endsAt: selectedSlot.endsAt,
            reason: `${patientForm.reason}${patientForm.notes ? ` · ${patientForm.notes}` : ''}`,
            hasPortalAccount: patientForm.hasPortalAccount === true,
            patient: {
              fullName: patientForm.fullName,
              email: patientForm.email,
              phone: patientForm.phone,
              dni: patientForm.dni || undefined
            }
          }
        })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message ?? 'No se pudo reservar la cita. Inténtalo de nuevo.')
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
    setSlots([])
    setSelectedSlot(null)
    setPatientForm(DEFAULT_PATIENT)
    setShowSummary(false)
  }

  return (
    <>
      <PublicHeader activeHref="/reservar-con-ia" />
      <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-10 md:px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-200">
            <MessageSquareHeart className="h-4 w-4" aria-hidden />
            Asistente de citas
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Reserva tu cita online con ayuda de IA</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Cuéntanos qué necesitas y te ayudamos a encontrar el mejor hueco disponible.
          </p>
          <h2 className="mt-6 text-lg font-semibold text-slate-900">Encuentra el mejor hueco disponible</h2>
          <h2 className="text-lg font-semibold text-slate-900">Reserva segura conectada con tu clínica</h2>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-12 md:px-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="flex min-h-[60vh] flex-col rounded-3xl bg-sky-50 p-4 shadow-sm ring-1 ring-sky-100">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <QuickReplyChips options={QUICK_REPLIES} onSelect={handleSendMessage} />
            </div>
            <label htmlFor="ai-booking-input" className="sr-only">
              Mensaje para el asistente de citas
            </label>
            <div className="mt-3 flex gap-2">
              <input
                id="ai-booking-input"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Escribe, por ejemplo: quiero una limpieza dental esta semana por la tarde…"
                className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleSendMessage(chatInput)
                }}
              />
              <button
                type="button"
                onClick={() => void handleSendMessage(chatInput)}
                className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Enviar
              </button>
            </div>
            <div className="mt-3 text-xs font-semibold text-slate-600">
              {status === 'fetching_availability' ? 'Buscando huecos disponibles…' : null}
              {status === 'thinking' ? 'Comprobando disponibilidad del profesional…' : null}
              {status === 'booking' ? 'Preparando la reserva…' : null}
            </div>
          </article>

          <aside className="space-y-3">
            <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Preferencias</h3>
              <div className="mt-3 grid gap-2">
                <label className="grid gap-1 text-xs font-semibold text-slate-700">
                  Clínica
                  <select
                    value={selectedClinicId}
                    onChange={(event) => {
                      const next = event.target.value
                      setSelectedClinicId(next)
                      setSelectedTreatmentId('')
                      setSelectedProfessionalId('')
                      void loadBootstrap(next)
                    }}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona clínica</option>
                    {clinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-700">
                  Tratamiento
                  <select
                    value={selectedTreatmentId}
                    onChange={(event) => setSelectedTreatmentId(event.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona tratamiento</option>
                    {treatments.map((treatment) => (
                      <option key={treatment.id} value={treatment.id}>
                        {treatment.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-700">
                  Profesional
                  <select
                    value={selectedProfessionalId}
                    onChange={(event) => setSelectedProfessionalId(event.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Cualquier profesional</option>
                    {professionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        {professional.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-700">
                  Franja preferida
                  <select
                    value={preferredTime}
                    onChange={(event) => setPreferredTime(event.target.value as 'morning' | 'afternoon' | 'any')}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="any">Cualquier horario</option>
                    <option value="morning">Por la mañana</option>
                    <option value="afternoon">Por la tarde</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void handleFetchSlots()}
                  disabled={!selectedClinicId || !selectedTreatmentId}
                  className="mt-1 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Buscar huecos reales
                </button>
              </div>
            </article>

            {status === 'error' && errorMessage ? <BookingErrorState message={errorMessage} /> : null}

            {!!slots.length ? (
              <article className="space-y-2 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                {slots.map((slot) => (
                  <SlotCard
                    key={`${slot.startsAt}-${slot.professionalName}`}
                    slot={slot}
                    onSelect={(nextSlot) => {
                      setSelectedSlot(nextSlot)
                      setStatus('collecting_patient_data')
                      setMessages((prev) => [
                        ...prev,
                        { id: id('assistant'), role: 'assistant', text: 'Genial. Ahora necesito tus datos para confirmar la cita.' }
                      ])
                    }}
                  />
                ))}
              </article>
            ) : null}

            {selectedSlot && !showSummary && status !== 'success' ? (
              <PatientDetailsForm
                value={patientForm}
                onChange={setPatientForm}
                loading={status === 'booking'}
                onSubmit={() => {
                  setShowSummary(true)
                  setStatus('confirming')
                }}
              />
            ) : null}

            {selectedSlot && showSummary && status !== 'success' ? (
              <BookingSummaryCard
                clinicName={selectedClinic?.name}
                treatmentName={selectedTreatment?.name}
                slot={selectedSlot}
                patient={patientForm}
                onConfirm={() => void handleConfirmBooking()}
                onEdit={() => {
                  setShowSummary(false)
                  setStatus('collecting_patient_data')
                }}
                loading={status === 'booking'}
              />
            ) : null}

            {status === 'success' ? (
              <BookingSuccessCard hasPortalAccount={hasPortalAccount} onBookAnother={resetFlow} />
            ) : null}
          </aside>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}
