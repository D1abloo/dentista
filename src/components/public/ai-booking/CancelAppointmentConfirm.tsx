import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { PatientAppointment } from './types'

type Props = {
  appointment: PatientAppointment
  onConfirm: () => void
  onKeep: () => void
  loading?: boolean
}

export function CancelAppointmentConfirm({ appointment, onConfirm, onKeep, loading }: Props) {
  return (
    <section className="ai-cancel-confirm" aria-label="Confirmar cancelación">
      <h3 className="ai-cancel-confirm__title">¿Seguro que quieres cancelar esta cita?</h3>
      <dl className="ai-cancel-confirm__rows">
        <div>
          <dt>Fecha</dt>
          <dd>{format(parseISO(appointment.startsAt), 'dd/MM/yyyy', { locale: es })}</dd>
        </div>
        <div>
          <dt>Hora</dt>
          <dd>{format(parseISO(appointment.startsAt), 'HH:mm')}</dd>
        </div>
        <div>
          <dt>Clínica</dt>
          <dd>{appointment.clinicName}</dd>
        </div>
        <div>
          <dt>Profesional</dt>
          <dd>{appointment.professionalName}</dd>
        </div>
        <div>
          <dt>Tratamiento</dt>
          <dd>{appointment.treatmentName}</dd>
        </div>
      </dl>
      <div className="ai-cancel-confirm__actions">
        <button type="button" className="ai-btn ai-btn--primary" onClick={onConfirm} disabled={loading}>
          {loading ? 'Cancelando…' : 'Sí, cancelar cita'}
        </button>
        <button type="button" className="ai-btn ai-btn--secondary" onClick={onKeep}>
          No, mantener cita
        </button>
      </div>
    </section>
  )
}
