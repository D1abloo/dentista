import React, { useEffect, useMemo } from 'react';
import {
  Calendar,
  CalendarCheck,
  Lock,
  Mail,
  MessageSquare,
  User,
  X
} from 'lucide-react';
import { availableSlotsForDentist, validateAppointmentSlot } from '@/lib/agenda/availability';
import { fmtDate, fmtDateTime, statusLabel } from '@/lib/format';
import { patientDisplayCode } from '@/lib/nhc';
import { patientName } from '@/lib/selectors';
import type { Appointment, BlockedSlot, DemoState, Patient } from '@/types/demo';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { PatientLookup } from '../PatientLookup';

const BLOCK_REASONS = ['Comida', 'Ausencia', 'Reunión', 'Vacaciones', 'Urgencia interna', 'Otro'] as const;
const DURATIONS = [15, 30, 45, 60] as const;

export function AgendaDrawerShell({
  open,
  title,
  onClose,
  children,
  footer
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="agd-drawer-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="agd-drawer agd-drawer--open"
        role="dialog"
        aria-labelledby="agd-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="agd-drawer__head">
          <h2 id="agd-drawer-title">{title}</h2>
          <button type="button" className="agd-drawer__close" aria-label="Cerrar" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="agd-drawer__body">{children}</div>
        {footer ? <footer className="agd-drawer__foot">{footer}</footer> : null}
      </aside>
    </div>
  );
}

type BookDrawerProps = {
  open: boolean;
  state: DemoState;
  clinicId: string;
  cabinetId: string;
  patients: Patient[];
  dentists: { id: string; fullName: string }[];
  treatments: { id: string; name: string }[];
  date: string;
  initialTime?: string;
  ownAgenda: boolean;
  defaultDentistId: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (data: {
    patientId: string;
    date: string;
    time: string;
    duration: number;
    dentistId: string;
    treatmentId: string;
    notes: string;
    visibleToPatient: boolean;
  }) => void;
};

export function AgendaBookDrawer({
  open,
  state,
  clinicId,
  cabinetId,
  patients,
  dentists,
  treatments,
  date: initialDate,
  initialTime = '10:00',
  ownAgenda,
  defaultDentistId,
  submitting,
  onClose,
  onSubmit
}: BookDrawerProps) {
  const [patientId, setPatientId] = React.useState('');
  const [bookDate, setBookDate] = React.useState(initialDate);
  const [time, setTime] = React.useState(initialTime);
  const [duration, setDuration] = React.useState(30);
  const [dentistId, setDentistId] = React.useState(defaultDentistId);
  const [treatmentId, setTreatmentId] = React.useState(treatments[0]?.id ?? '');
  const [notes, setNotes] = React.useState('');
  const [visibleToPatient, setVisibleToPatient] = React.useState(true);

  useEffect(() => {
    if (!open) return;
    setBookDate(initialDate);
    setTime(initialTime);
    setDentistId((defaultDentistId || dentists[0]?.id) ?? '');
  }, [open, initialDate, initialTime, defaultDentistId, dentists]);

  const slots = useMemo(() => {
    if (!dentistId || !treatmentId) return [];
    return availableSlotsForDentist(state, {
      clinicId,
      dentistId,
      cabinetId,
      date: bookDate,
      treatmentId
    });
  }, [state, clinicId, dentistId, cabinetId, bookDate, treatmentId]);

  const footer = (
    <>
      <Button tone="ghost" type="button" onClick={onClose}>
        Cancelar
      </Button>
      <Button
        type="button"
        className="agd-drawer__primary"
        disabled={submitting}
        onClick={() =>
          onSubmit({
            patientId,
            date: bookDate,
            time,
            duration,
            dentistId,
            treatmentId,
            notes,
            visibleToPatient
          })
        }
      >
        <CalendarCheck className="h-4 w-4" aria-hidden />
        {submitting ? 'Guardando…' : 'Crear cita'}
      </Button>
    </>
  );

  return (
    <AgendaDrawerShell open={open} title="Nueva cita" onClose={onClose} footer={footer}>
      <PatientLookup
        state={state}
        patientId={patientId}
        onPatientId={setPatientId}
        label="Paciente"
        placeholder="Buscar por NHC, DNI, nombre o teléfono…"
        candidates={patients}
      />
      <div className="agd-form-row">
        <Field label="Fecha">
          <Input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} />
        </Field>
        <Field label="Duración">
          <Select value={String(duration)} onChange={(e) => setDuration(Number(e.target.value))}>
            {DURATIONS.map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Hora">
        <Select value={time} onChange={(e) => setTime(e.target.value)} disabled={!slots.length}>
          {slots.length ? (
            slots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))
          ) : (
            <option value="">Sin huecos disponibles</option>
          )}
        </Select>
      </Field>
      <Field label="Dentista">
        <Select value={dentistId} onChange={(e) => setDentistId(e.target.value)} disabled={ownAgenda}>
          {dentists.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Tratamiento">
        <Select value={treatmentId} onChange={(e) => setTreatmentId(e.target.value)}>
          {treatments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Observaciones internas">
        <Textarea
          className="agd-textarea field-control"
          placeholder="Detalles de la cita…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>
      <label className="agd-toggle">
        <input
          type="checkbox"
          checked={visibleToPatient}
          onChange={(e) => setVisibleToPatient(e.target.checked)}
        />
        <span>Publicar en el portal del paciente</span>
      </label>
      <p className="agd-helper">
        <Calendar className="h-4 w-4" aria-hidden />
        Solo se muestran horas libres para el dentista seleccionado.
      </p>
    </AgendaDrawerShell>
  );
}

type BlockScope = 'all' | 'pick';

type BlockDrawerProps = {
  open: boolean;
  dentists: { id: string; fullName: string }[];
  date: string;
  initialTime?: string;
  defaultDentistId: string;
  ownAgenda: boolean;
  onClose: () => void;
  onSubmit: (data: {
    scope: BlockScope;
    dentistIds: string[];
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
    notes: string;
  }) => void;
};

export function AgendaBlockDrawer({
  open,
  dentists,
  date: initialDate,
  initialTime = '13:00',
  defaultDentistId,
  ownAgenda,
  onClose,
  onSubmit
}: BlockDrawerProps) {
  const [bookDate, setBookDate] = React.useState(initialDate);
  const [startTime, setStartTime] = React.useState(initialTime);
  const [endTime, setEndTime] = React.useState(initialTime);
  const [scope, setScope] = React.useState<BlockScope>('pick');
  const [pickedIds, setPickedIds] = React.useState<string[]>([]);
  const [reason, setReason] = React.useState<(typeof BLOCK_REASONS)[number]>('Comida');
  const [notes, setNotes] = React.useState('');

  const allPicked = dentists.length > 0 && pickedIds.length === dentists.length;

  useEffect(() => {
    if (!open) return;
    setBookDate(initialDate);
    setStartTime(initialTime);
    setEndTime(initialTime);
    if (ownAgenda && defaultDentistId) {
      setScope('pick');
      setPickedIds([defaultDentistId]);
    } else if (defaultDentistId) {
      setScope('pick');
      setPickedIds([defaultDentistId]);
    } else {
      setScope('all');
      setPickedIds([]);
    }
  }, [open, initialDate, initialTime, defaultDentistId, dentists, ownAgenda]);

  function toggleDentist(id: string) {
    setPickedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAllDentists() {
    setPickedIds(allPicked ? [] : dentists.map((d) => d.id));
  }

  const footer = (
    <>
      <Button tone="ghost" type="button" onClick={onClose}>
        Cancelar
      </Button>
      <Button
        type="button"
        className="agd-drawer__primary agd-drawer__primary--danger"
        onClick={() =>
          onSubmit({
            scope,
            dentistIds: scope === 'all' ? [] : pickedIds,
            date: bookDate,
            startTime,
            endTime,
            reason,
            notes
          })
        }
      >
        <Lock className="h-4 w-4" aria-hidden />
        Bloquear horario
      </Button>
    </>
  );

  return (
    <AgendaDrawerShell open={open} title="Bloquear horario" onClose={onClose} footer={footer}>
      <div className="agd-block-scope">
        <p className="agd-block-scope__label">Aplicar bloqueo a</p>
        <div className="agd-segment agd-segment--scope" role="group" aria-label="Alcance del bloqueo">
          <button
            type="button"
            className={`agd-segment__btn${scope === 'all' ? ' agd-segment__btn--active' : ''}`}
            disabled={ownAgenda}
            onClick={() => setScope('all')}
          >
            Todos los dentistas
          </button>
          <button
            type="button"
            className={`agd-segment__btn${scope === 'pick' ? ' agd-segment__btn--active' : ''}`}
            onClick={() => setScope('pick')}
          >
            Uno o varios
          </button>
        </div>
      </div>

      {scope === 'pick' ? (
        <div className="agd-pro-picker">
          {!ownAgenda && dentists.length > 1 ? (
            <button type="button" className="agd-pro-picker__toggle" onClick={toggleAllDentists}>
              {allPicked ? 'Quitar selección' : 'Seleccionar todos'}
            </button>
          ) : null}
          <ul className="agd-pro-picker__list">
            {dentists.map((d) => (
              <li key={d.id}>
                <label className="agd-pro-picker__item">
                  <input
                    type="checkbox"
                    checked={pickedIds.includes(d.id)}
                    disabled={ownAgenda && d.id !== defaultDentistId}
                    onChange={() => toggleDentist(d.id)}
                  />
                  <span>{d.fullName}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="agd-pro-picker__hint">
            {pickedIds.length
              ? `${pickedIds.length} profesional${pickedIds.length === 1 ? '' : 'es'} seleccionado${pickedIds.length === 1 ? '' : 's'}`
              : 'Marca al menos un profesional'}
          </p>
        </div>
      ) : (
        <p className="agd-helper agd-helper--muted">
          El bloqueo afectará a todos los dentistas de la clínica en la franja indicada.
        </p>
      )}
      <Field label="Fecha">
        <Input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} />
      </Field>
      <div className="agd-form-row">
        <Field label="Hora inicio">
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
        <Field label="Hora fin">
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field>
      </div>
      <Field label="Motivo">
        <Select value={reason} onChange={(e) => setReason(e.target.value as (typeof BLOCK_REASONS)[number])}>
          {BLOCK_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Observaciones internas">
        <Textarea
          className="agd-textarea field-control"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional…"
        />
      </Field>
    </AgendaDrawerShell>
  );
}

export function AgendaApptDetailDrawer({
  open,
  state,
  appointment,
  treatmentName,
  dentistName,
  onClose,
  onConfirm,
  onCancel,
  onReschedule,
  onConfirmAttendance
}: {
  open: boolean;
  state: DemoState;
  appointment: Appointment | null;
  treatmentName: string;
  dentistName: string;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  onConfirmAttendance: () => void;
}) {
  if (!appointment) return null;
  const patient = state.patients.find((p) => p.id === appointment.patientId);

  const footer = (
    <div className="agd-drawer__actions-stack">
      {appointment.status === 'pendiente' ? (
        <Button type="button" onClick={onConfirm}>
          Confirmar
        </Button>
      ) : null}
      {appointment.status !== 'cancelada' ? (
        <Button type="button" tone="secondary" onClick={onCancel}>
          Cancelar cita
        </Button>
      ) : null}
      <Button type="button" tone="ghost" onClick={onReschedule}>
        Reprogramar
      </Button>
      <a href={`/admin/pacientes/${appointment.patientId}`} className="agd-drawer__link-btn">
        <User className="h-4 w-4" aria-hidden />
        Ver paciente
      </a>
      <a href={`/admin/mensajes?patient=${appointment.patientId}`} className="agd-drawer__link-btn">
        <MessageSquare className="h-4 w-4" aria-hidden />
        Enviar mensaje
      </a>
    </div>
  );

  return (
    <AgendaDrawerShell open={open} title="Detalle de cita" onClose={onClose} footer={footer}>
      <dl className="agd-detail-dl">
        <div>
          <dt>Paciente</dt>
          <dd>{patient?.fullName ?? patientName(state, appointment.patientId)}</dd>
        </div>
        <div>
          <dt>NHC</dt>
          <dd>{patient ? patientDisplayCode(patient) : '—'}</dd>
        </div>
        <div>
          <dt>Tratamiento</dt>
          <dd>{treatmentName}</dd>
        </div>
        <div>
          <dt>Fecha y hora</dt>
          <dd>{fmtDateTime(appointment.date, appointment.time)}</dd>
        </div>
        <div>
          <dt>Dentista</dt>
          <dd>{dentistName}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>
            <span className={`agd-event__status agd-event__status--${appointment.status}`}>
              {statusLabel(appointment.status)}
            </span>
          </dd>
        </div>
        {appointment.notes ? (
          <div>
            <dt>Observaciones</dt>
            <dd>{appointment.notes}</dd>
          </div>
        ) : null}
        <div>
          <dt>Portal del paciente</dt>
          <dd>{appointment.status !== 'cancelada' ? 'Visible al publicar' : '—'}</dd>
        </div>
      </dl>
      {patient?.email ? (
        <p className="agd-detail-contact">
          <Mail className="h-4 w-4" aria-hidden />
          {patient.email}
        </p>
      ) : null}
      {!appointment.attendanceConfirmed && appointment.status !== 'cancelada' && appointment.status !== 'pendiente' ? (
        <Button type="button" tone="secondary" className="w-full" onClick={onConfirmAttendance}>
          Confirmar asistencia
        </Button>
      ) : null}
    </AgendaDrawerShell>
  );
}

export function AgendaBlockDetailDrawer({
  open,
  block,
  targetLabel,
  onClose,
  onRemove
}: {
  open: boolean;
  block: BlockedSlot | null;
  targetLabel: string;
  onClose: () => void;
  onRemove: () => void;
}) {
  if (!block) return null;

  const footer = (
    <>
      <Button tone="ghost" type="button" onClick={onClose}>
        Cerrar
      </Button>
      <Button type="button" className="agd-drawer__primary agd-drawer__primary--danger" onClick={onRemove}>
        Eliminar bloqueo
      </Button>
    </>
  );

  return (
    <AgendaDrawerShell open={open} title="Detalle del bloqueo" onClose={onClose} footer={footer}>
      <dl className="agd-detail-dl">
        <div>
          <dt>Profesionales</dt>
          <dd>{targetLabel}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{fmtDate(block.date)}</dd>
        </div>
        <div>
          <dt>Horario</dt>
          <dd>
            {block.time}
            {block.endTime && block.endTime !== block.time ? ` – ${block.endTime}` : ''}
          </dd>
        </div>
        <div>
          <dt>Motivo</dt>
          <dd>{block.reason}</dd>
        </div>
        {block.notes ? (
          <div>
            <dt>Observaciones</dt>
            <dd>{block.notes}</dd>
          </div>
        ) : null}
      </dl>
    </AgendaDrawerShell>
  );
}

export { validateAppointmentSlot };
