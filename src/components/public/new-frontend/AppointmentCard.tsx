type Appointment = {
  id: string
  startsAt: string
  clinicName: string
  treatmentName: string
  professionalName: string
  status?: string
}

type Props = {
  appointment: Appointment
}

export function AppointmentCard({ appointment }: Props) {
  const date = new Date(appointment.startsAt)
  const dateLabel = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeLabel = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <article className="ac-appt-card" tabIndex={0} aria-label={`Cita el ${dateLabel} a las ${timeLabel}`}>
      <p className="ac-appt-card__title">Cita encontrada</p>
      <dl>
        <div>
          <dt>Fecha</dt>
          <dd>{dateLabel}</dd>
        </div>
        <div>
          <dt>Hora</dt>
          <dd>{timeLabel}</dd>
        </div>
        <div>
          <dt>Clínica</dt>
          <dd>{appointment.clinicName}</dd>
        </div>
        <div>
          <dt>Tratamiento</dt>
          <dd>{appointment.treatmentName}</dd>
        </div>
        <div>
          <dt>Profesional</dt>
          <dd>{appointment.professionalName}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{appointment.status ?? 'confirmada'}</dd>
        </div>
      </dl>
    </article>
  )
}
