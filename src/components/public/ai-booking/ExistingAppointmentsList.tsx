import { AppointmentCard } from './AppointmentCard'
import type { PatientAppointment } from './types'

type Props = {
  title?: string
  appointments: PatientAppointment[]
  selectedId?: string
  onSelect: (appointment: PatientAppointment) => void
  onReschedule: (appointment: PatientAppointment) => void
  onCancel: (appointment: PatientAppointment) => void
}

export function ExistingAppointmentsList({
  title = 'Tus citas',
  appointments,
  selectedId,
  onSelect,
  onReschedule,
  onCancel
}: Props) {
  if (!appointments.length) return null

  return (
    <section className="ai-appt-list" aria-label={title}>
      <h3 className="ai-appt-list__title">{title}</h3>
      <div className="ai-appt-list__items">
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            selected={selectedId === appointment.id}
            onSelect={() => onSelect(appointment)}
            onReschedule={() => onReschedule(appointment)}
            onCancel={() => onCancel(appointment)}
          />
        ))}
      </div>
    </section>
  )
}
