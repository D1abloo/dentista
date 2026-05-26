import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2 } from 'lucide-react'
import { downloadCalendarIcs } from '@/lib/calendarIcs'
import type { BookingState, SlotOption } from './types'

type Props = {
  bookingState: BookingState
  slot: SlotOption
  hasPortalAccount: boolean
  onBookAnother: () => void
  title?: string
}

export function AiBookingSuccessView({
  bookingState,
  slot,
  hasPortalAccount,
  onBookAnother,
  title = 'Cita reservada correctamente'
}: Props) {
  const calendarEvent = {
    title: `Cita: ${bookingState.treatmentName ?? slot.treatmentName}`,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    location: bookingState.clinicName ?? slot.clinicName,
    description: `Profesional: ${slot.professionalName}`
  }

  return (
    <section className="ai-success ai-success--celebrate" aria-label="Cita reservada">
      <div className="ai-success__icon" aria-hidden>
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h2 className="ai-success__title">{title}</h2>
      <p className="ai-success__text">
        Te hemos enviado la confirmación por email. Si tu clínica tiene Portal del Paciente activo,
        podrás consultar la cita desde tu cuenta.
      </p>

      <article className="ai-success__details">
        <dl>
          <div>
            <dt>Fecha</dt>
            <dd>{format(parseISO(slot.startsAt), "EEEE dd/MM/yyyy", { locale: es })}</dd>
          </div>
          <div>
            <dt>Hora</dt>
            <dd>{format(parseISO(slot.startsAt), 'HH:mm')}</dd>
          </div>
          <div>
            <dt>Clínica</dt>
            <dd>{bookingState.clinicName ?? slot.clinicName ?? '—'}</dd>
          </div>
          <div>
            <dt>Profesional</dt>
            <dd>{slot.professionalName}</dd>
          </div>
          <div>
            <dt>Tratamiento</dt>
            <dd>{bookingState.treatmentName ?? slot.treatmentName}</dd>
          </div>
        </dl>
      </article>

      <div className="ai-success__actions">
        <a
          href={hasPortalAccount ? '/login?next=/paciente/citas' : '/registro-paciente'}
          className="ai-btn ai-btn--primary"
        >
          Ir al Portal del Paciente
        </a>
        <button type="button" className="ai-btn ai-btn--secondary" onClick={onBookAnother}>
          Reservar otra cita
        </button>
        <button
          type="button"
          className="ai-btn ai-btn--ghost"
          onClick={() => downloadCalendarIcs(calendarEvent)}
        >
          Añadir al calendario
        </button>
      </div>
    </section>
  )
}
