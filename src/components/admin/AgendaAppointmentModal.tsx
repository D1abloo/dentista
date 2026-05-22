import { CalendarClock, Check, User, X } from 'lucide-react';
import { fmtDate, fmtDateTime, statusLabel } from '@/lib/format';
import { patientName } from '@/lib/selectors';
import type { Appointment, DemoState } from '@/types/demo';

type Props = {
  open: boolean;
  state: DemoState;
  appointment: Appointment | null;
  treatmentName: string;
  dentistName: string;
  clinicName: string;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onConfirmAttendance: () => void;
  onReschedule: () => void;
};

export function AgendaAppointmentModal({
  open,
  state,
  appointment,
  treatmentName,
  dentistName,
  clinicName,
  onClose,
  onConfirm,
  onCancel,
  onConfirmAttendance,
  onReschedule
}: Props) {
  if (!open || !appointment) return null;

  const patient = state.patients.find((p) => p.id === appointment.patientId);
  const canCancel = appointment.status !== 'cancelada';
  const pending = appointment.status === 'pendiente';
  const canMarkAttendance =
    !appointment.attendanceConfirmed &&
    appointment.status !== 'cancelada' &&
    appointment.status !== 'pendiente';

  return (
    <div className="agd-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="agd-modal agd-modal--patient"
        role="dialog"
        aria-labelledby="agd-appt-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="agd-modal__head">
          <h2 id="agd-appt-modal-title">Datos de la cita</h2>
          <button type="button" className="agd-modal__close" aria-label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="agd-modal__body">
          <section className="agd-patient-card">
            <h3>
              <User className="h-4 w-4" aria-hidden />
              Paciente
            </h3>
            <dl>
              <div>
                <dt>Nombre</dt>
                <dd>{patient?.fullName ?? patientName(state, appointment.patientId)}</dd>
              </div>
              {patient?.dni ? (
                <div>
                  <dt>DNI</dt>
                  <dd>{patient.dni}</dd>
                </div>
              ) : null}
              {patient?.phone ? (
                <div>
                  <dt>Teléfono</dt>
                  <dd>{patient.phone}</dd>
                </div>
              ) : null}
              {patient?.email ? (
                <div>
                  <dt>Email</dt>
                  <dd>{patient.email}</dd>
                </div>
              ) : null}
              {patient?.nhc ? (
                <div>
                  <dt>NHC</dt>
                  <dd>{patient.nhc}</dd>
                </div>
              ) : null}
            </dl>
            {patient?.id ? (
              <a className="agd-patient-card__link" href={`/admin/pacientes/${patient.id}`}>
                Ver ficha completa
              </a>
            ) : null}
          </section>

          <section className="agd-patient-card">
            <h3>
              <CalendarClock className="h-4 w-4" aria-hidden />
              Cita y motivo
            </h3>
            <dl>
              <div>
                <dt>Fecha y hora</dt>
                <dd>{fmtDateTime(appointment.date, appointment.time)}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{statusLabel(appointment.status)}</dd>
              </div>
              <div>
                <dt>Tratamiento / motivo</dt>
                <dd>{treatmentName}</dd>
              </div>
              <div>
                <dt>Profesional</dt>
                <dd>{dentistName}</dd>
              </div>
              <div>
                <dt>Clínica</dt>
                <dd>{clinicName}</dd>
              </div>
              {appointment.notes ? (
                <div>
                  <dt>Notas</dt>
                  <dd>{appointment.notes}</dd>
                </div>
              ) : null}
              {appointment.attendanceConfirmed ? (
                <div>
                  <dt>Asistencia</dt>
                  <dd className="agd-patient-card__ok">Confirmada · visible en portal del paciente</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>

        <footer className="agd-modal__foot">
          {pending ? (
            <button type="button" className="agd-event__btn agd-event__btn--ok" onClick={onConfirm}>
              <Check className="h-3.5 w-3.5" aria-hidden />
              Confirmar cita
            </button>
          ) : null}
          {canMarkAttendance ? (
            <button type="button" className="agd-event__btn agd-event__btn--ok" onClick={onConfirmAttendance}>
              Confirmar asistencia
            </button>
          ) : null}
          <button type="button" className="agd-event__btn agd-event__btn--ghost" onClick={onReschedule}>
            Reprogramar
          </button>
          {canCancel ? (
            <button type="button" className="agd-event__btn agd-event__btn--danger" onClick={onCancel}>
              Cancelar cita
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  );
}
