import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { downloadCalendarIcs } from '@/lib/calendarIcs'
import type { PatientAppointment } from './types'

type Props = {
  appointment: PatientAppointment
  selected?: boolean
  onSelect?: () => void
  onReschedule?: () => void
  onCancel?: () => void
  compact?: boolean
}

export function AppointmentCard({
  appointment,
  selected = false,
  onSelect,
  onReschedule,
  onCancel,
  compact = false
}: Props) {
  const calendarEvent = {
    title: `Cita: ${appointment.treatmentName}`,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    location: appointment.clinicName,
    description: `Profesional: ${appointment.professionalName}`
  }

  return (
    <article
      className={`ai-appt-card${selected ? ' ai-appt-card--selected' : ''}`}
      aria-label={`Cita ${appointment.treatmentName}`}
    >
      <div className="ai-appt-card__head">
        <p className="ai-appt-card__when">
          {format(parseISO(appointment.startsAt), "EEEE dd/MM · HH:mm", { locale: es })}
        </p>
        <span className={`ai-appt-card__badge ai-appt-card__badge--${appointment.status}`}>
          {appointment.statusLabel}
        </span>
      </div>
      <p className="ai-appt-card__treatment">{appointment.treatmentName}</p>
      <p className="ai-appt-card__pro">{appointment.professionalName}</p>
      <p className="ai-appt-card__clinic">{appointment.clinicName}</p>
      {appointment.clinicAddress && !compact ? (
        <p className="ai-appt-card__address">{appointment.clinicAddress}</p>
      ) : null}

      <div className="ai-appt-card__actions">
        {onSelect ? (
          <button type="button" className="ai-btn ai-btn--ghost" onClick={onSelect}>
            Ver detalle
          </button>
        ) : null}
        {appointment.canReschedule && onReschedule ? (
          <button type="button" className="ai-btn ai-btn--secondary" onClick={onReschedule}>
            Cambiar cita
          </button>
        ) : null}
        {appointment.canCancel && onCancel ? (
          <button type="button" className="ai-btn ai-btn--ghost" onClick={onCancel}>
            Cancelar cita
          </button>
        ) : null}
        <button
          type="button"
          className="ai-btn ai-btn--ghost"
          onClick={() => downloadCalendarIcs(calendarEvent)}
        >
          Añadir al calendario
        </button>
      </div>
    </article>
  )
}
