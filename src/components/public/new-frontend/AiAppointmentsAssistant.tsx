import { useMemo, useState } from 'react'
import { AppointmentCard } from './AppointmentCard'
import { AppointmentLookupForm } from './AppointmentLookupForm'
import { AvailableSlotCard } from './AvailableSlotCard'
import { ResponsiveContainer } from './ResponsiveContainer'

type ChatRole = 'assistant' | 'user'

type ChatMessage = {
  role: ChatRole
  text: string
}

type PublicAppointment = {
  id: string
  startsAt: string
  clinicName: string
  treatmentName: string
  professionalName: string
  status?: string
}

type SlotOption = {
  startsAt: string
  clinicName: string
  treatmentName: string
  professionalName: string
}

const QUICK_ACTIONS = [
  'Reservar nueva cita',
  'Ver mis citas',
  'Próxima cita',
  'Cambiar una cita',
  'Cancelar una cita',
  'Hablar con mi clínica'
] as const

const INITIAL_MESSAGE =
  'Hola, soy el asistente de AgendaClinic. Puedo ayudarte a reservar una cita, revisar tus citas actuales o cambiar una cita existente. ¿Qué necesitas hacer?'

export function AiAppointmentsAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', text: INITIAL_MESSAGE }])
  const [query, setQuery] = useState('')
  const [lookupId, setLookupId] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'searching' | 'error'>('idle')
  const [appointments, setAppointments] = useState<PublicAppointment[]>([])
  const [slots, setSlots] = useState<SlotOption[]>([])
  const [infoMessage, setInfoMessage] = useState('')

  const nextAppointment = useMemo(() => appointments[0] ?? null, [appointments])

  const handleSendMessage = async (text: string) => {
    const prompt = text.trim()
    if (!prompt) return
    setQuery('')
    setStatus('loading')
    setMessages((prev) => [...prev, { role: 'user', text: prompt }])

    try {
      const conversation = [...messages, { role: 'user' as const, text: prompt }].map((entry) => ({
        role: entry.role,
        text: entry.text
      }))

      const response = await fetch('/api/ai/appointments-chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          conversation,
          assistantState: {
            bookingState: {},
            assistantContext: { mode: 'book' }
          }
        })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message ?? 'No se pudo contactar con el asistente.')

      const payload = json.data
      setMessages((prev) => [...prev, { role: 'assistant', text: String(payload?.assistantMessage ?? 'Te ayudo con tus citas.') }])
      setAppointments((payload?.appointments ?? []) as PublicAppointment[])
      setSlots((payload?.slots ?? []) as SlotOption[])
      setInfoMessage('')
      setStatus('idle')
    } catch (error) {
      setStatus('error')
      setInfoMessage(error instanceof Error ? error.message : 'No se pudo completar la operación.')
    }
  }

  const handleLookup = async () => {
    const identifier = lookupId.trim()
    if (!identifier) return
    setStatus('searching')
    setInfoMessage('')
    try {
      const response = await fetch('/api/public-appointments/lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier })
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message ?? 'No se pudo consultar.')
      const data = json.data
      setAppointments((data?.appointments ?? []) as PublicAppointment[])
      setInfoMessage(String(data?.message ?? ''))
      setStatus('idle')
    } catch (error) {
      setStatus('error')
      setInfoMessage(error instanceof Error ? error.message : 'No se pudo completar la operación.')
    }
  }

  return (
    <section id="citas-ia" className="ac-section ac-section--surface" aria-labelledby="ac-ai-title">
      <ResponsiveContainer wide>
        <header className="ac-section__head">
          <p className="ac-kicker">Citas con IA</p>
          <h2 id="ac-ai-title">Citas con IA: reserva, revisa o cambia tus citas</h2>
          <p>
            El asistente de AgendaClinic permite reservar una nueva cita o consultar tus citas existentes usando
            email, DNI o NHC.
          </p>
        </header>

        <div className="ac-ai">
          <div className="ac-ai__chat">
            <div className="ac-ai__quick-actions">
              {QUICK_ACTIONS.map((action) => (
                <button key={action} type="button" onClick={() => void handleSendMessage(action)} className="ac-chip">
                  {action}
                </button>
              ))}
            </div>

            <div className="ac-ai__messages" aria-live="polite">
              {messages.map((message, index) => (
                <p
                  key={`${message.role}-${index}`}
                  className={`ac-ai__message${message.role === 'assistant' ? ' ac-ai__message--assistant' : ''}`}
                >
                  {message.text}
                </p>
              ))}
            </div>

            <label htmlFor="ac-ai-input" className="ac-field">
              <span>Escribe tu consulta</span>
              <div className="ac-ai__composer">
                <input
                  id="ac-ai-input"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ej: Quiero cambiar mi cita de la próxima semana"
                />
                <button type="button" className="ac-btn ac-btn--primary" onClick={() => void handleSendMessage(query)}>
                  Enviar
                </button>
              </div>
            </label>
          </div>

          <aside className="ac-ai__side">
            <AppointmentLookupForm
              value={lookupId}
              onChange={setLookupId}
              onSubmit={() => void handleLookup()}
              loading={status === 'searching'}
            />

            {status === 'searching' ? <p className="ac-state">Buscando tus citas…</p> : null}

            {infoMessage ? (
              <p className="ac-state">
                {infoMessage}
                {appointments.length ? '' : ' Para ver todos los detalles, inicia sesión en el Portal del Paciente.'}
              </p>
            ) : null}

            {nextAppointment ? (
              <div className="ac-ai__results">
                <h3>Hemos encontrado estas citas próximas.</h3>
                {appointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            ) : null}

            {slots.length ? (
              <div className="ac-ai__slots">
                <h3>Huecos disponibles</h3>
                {slots.slice(0, 3).map((slot, index) => (
                  <AvailableSlotCard
                    key={`${slot.startsAt}-${index}`}
                    startsAt={slot.startsAt}
                    clinicName={slot.clinicName}
                    professionalName={slot.professionalName}
                    treatmentName={slot.treatmentName}
                  />
                ))}
              </div>
            ) : null}

            {slots[0] ? (
              <article className="ac-booking-summary">
                <h3>Resumen de cita</h3>
                <p>Tratamiento: {slots[0].treatmentName}</p>
                <p>Profesional: {slots[0].professionalName}</p>
                <p>Clínica: {slots[0].clinicName}</p>
                <p>Estado: pendiente de confirmación</p>
              </article>
            ) : null}
          </aside>
        </div>
      </ResponsiveContainer>
    </section>
  )
}
