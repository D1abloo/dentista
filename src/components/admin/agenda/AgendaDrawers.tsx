import React, { useEffect, useMemo } from 'react';
import {
  Calendar,
  CalendarCheck,
  Lock,
  Mail,
  MessageSquare,
  Unlock,
  User,
  X
} from 'lucide-react';
import { availableSlotsForDentist, blockRangeLabel, blockTargetLabel, validateAppointmentSlot } from '@/lib/agenda/availability';
import { formatUnblockTime, listUnblockEntries, type UnblockEntry } from '@/lib/agenda/unblockEntries';
import {
  datesForMonthGrid,
  datesInRangeInclusive,
  endOfMonthIso,
  professionalDisplayName,
  type BlockMode,
  type ScheduleBlockInput
} from '@/lib/agenda/scheduleBlockExpand';
import { fmtDate, fmtDateTime, statusLabel } from '@/lib/format';
import { patientDisplayCode } from '@/lib/nhc';
import { patientName } from '@/lib/selectors';
import type { Appointment, BlockedSlot, DemoState, Patient } from '@/types/demo';
import { Button, Field, Input, Select, Textarea } from '@/components/ui';
import { PatientLookup } from '../PatientLookup';

const BLOCK_REASONS = ['Comida', 'Ausencia', 'Reunión', 'Vacaciones', 'Urgencia interna', 'Otro'] as const;
const DURATIONS = [15, 30, 45, 60] as const;

const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

type BlockDrawerProps = {
  open: boolean;
  dentists: { id: string; fullName: string; visibleTitle?: string }[];
  date: string;
  initialTime?: string;
  defaultDentistId: string;
  ownAgenda: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ScheduleBlockInput, 'clinicId' | 'cabinetId' | 'tenantId'>) => void;
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
  const [startDate, setStartDate] = React.useState(initialDate);
  const [untilEndOfMonth, setUntilEndOfMonth] = React.useState(true);
  const [endDateManual, setEndDateManual] = React.useState(initialDate);
  const [blockMode, setBlockMode] = React.useState<BlockMode>('hours');
  const [startTime, setStartTime] = React.useState(initialTime);
  const [endTime, setEndTime] = React.useState(initialTime);
  const [consecutive, setConsecutive] = React.useState(true);
  const [pickedIds, setPickedIds] = React.useState<string[]>([]);
  const [pickedDates, setPickedDates] = React.useState<string[]>([initialDate]);
  const [reason, setReason] = React.useState<(typeof BLOCK_REASONS)[number]>('Comida');
  const [notes, setNotes] = React.useState('');

  const endDate = untilEndOfMonth ? endOfMonthIso(startDate) : endDateManual;
  const monthDates = useMemo(() => datesForMonthGrid(startDate), [startDate]);
  const rangeDates = useMemo(
    () => datesInRangeInclusive(startDate, endDate >= startDate ? endDate : startDate),
    [startDate, endDate]
  );

  useEffect(() => {
    if (!open) return;
    setStartDate(initialDate);
    setEndDateManual(initialDate);
    setUntilEndOfMonth(true);
    setStartTime(initialTime);
    setEndTime(initialTime);
    setConsecutive(true);
    setPickedDates([initialDate]);
    setPickedIds(defaultDentistId ? [defaultDentistId] : []);
  }, [open, initialDate, initialTime, defaultDentistId]);

  useEffect(() => {
    if (consecutive) {
      setPickedDates(rangeDates);
    }
  }, [consecutive, rangeDates]);

  function toggleDentist(id: string) {
    setPickedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleDate(iso: string) {
    if (consecutive) return;
    setPickedDates((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso].sort()));
  }

  function submit() {
    onSubmit({
      dentistIds: pickedIds,
      startDate,
      endDate: endDate >= startDate ? endDate : startDate,
      mode: blockMode,
      startTime,
      endTime,
      consecutive,
      selectedDates: consecutive ? rangeDates : pickedDates,
      reason,
      notes
    });
  }

  const footer = (
    <>
      <Button tone="ghost" type="button" onClick={onClose}>
        Cancelar
      </Button>
      <Button type="button" className="agd-drawer__primary agd-drawer__primary--danger" onClick={submit}>
        <Lock className="h-4 w-4" aria-hidden />
        Bloquear horario
      </Button>
    </>
  );

  return (
    <AgendaDrawerShell open={open} title="Bloquear horario" onClose={onClose} footer={footer}>
      <div className="agd-pro-picker">
        <p className="agd-block-scope__label">Profesionales (Dr. / Dra.)</p>
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
                <span>{professionalDisplayName(d.fullName, d.visibleTitle)}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="agd-pro-picker__hint">
          {pickedIds.length
            ? `${pickedIds.length} profesional${pickedIds.length === 1 ? '' : 'es'}`
            : 'Selecciona al menos un Dr. o Dra.'}
        </p>
      </div>

      <Field label="Desde">
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </Field>

      <label className="agd-toggle">
        <input
          type="checkbox"
          checked={untilEndOfMonth}
          onChange={(e) => setUntilEndOfMonth(e.target.checked)}
        />
        <span>Hasta fin de mes ({fmtDate(endOfMonthIso(startDate))})</span>
      </label>

      {!untilEndOfMonth ? (
        <Field label="Hasta">
          <Input
            type="date"
            value={endDateManual}
            min={startDate}
            onChange={(e) => setEndDateManual(e.target.value)}
          />
        </Field>
      ) : null}

      <div className="agd-block-scope">
        <p className="agd-block-scope__label">Tipo de bloqueo</p>
        <div className="agd-segment agd-segment--scope" role="group">
          <button
            type="button"
            className={`agd-segment__btn${blockMode === 'hours' ? ' agd-segment__btn--active' : ''}`}
            onClick={() => setBlockMode('hours')}
          >
            Por horas
          </button>
          <button
            type="button"
            className={`agd-segment__btn${blockMode === 'fullday' ? ' agd-segment__btn--active' : ''}`}
            onClick={() => setBlockMode('fullday')}
          >
            Días completos
          </button>
        </div>
      </div>

      {blockMode === 'hours' ? (
        <div className="agd-form-row">
          <Field label="Hora inicio">
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="Hora fin">
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </Field>
        </div>
      ) : (
        <p className="agd-helper agd-helper--muted">Se bloqueará el horario de clínica completo en cada día seleccionado.</p>
      )}

      <div className="agd-block-scope">
        <p className="agd-block-scope__label">Días a bloquear</p>
        <label className="agd-toggle">
          <input
            type="checkbox"
            checked={consecutive}
            onChange={(e) => setConsecutive(e.target.checked)}
          />
          <span>Días consecutivos (del {fmtDate(startDate)} al {fmtDate(endDate)})</span>
        </label>
      </div>

      {!consecutive ? (
        <div className="agd-day-grid" role="group" aria-label="Seleccionar días">
          {monthDates.map((iso) => {
            const inRange = iso >= startDate && iso <= endDate;
            const dow = new Date(`${iso}T12:00:00`).getDay();
            return (
              <button
                key={iso}
                type="button"
                disabled={!inRange}
                className={`agd-day-grid__cell${pickedDates.includes(iso) ? ' agd-day-grid__cell--on' : ''}${!inRange ? ' agd-day-grid__cell--off' : ''}`}
                onClick={() => toggleDate(iso)}
              >
                <span className="agd-day-grid__dow">{WEEKDAY_SHORT[dow]}</span>
                <span className="agd-day-grid__num">{new Date(`${iso}T12:00:00`).getDate()}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="agd-pro-picker__hint">
          {rangeDates.length} día{rangeDates.length === 1 ? '' : 's'} en el rango seleccionado.
        </p>
      )}

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

type UnblockDrawerProps = {
  open: boolean;
  clinicId: string;
  blocks: BlockedSlot[];
  anchorDate: string;
  dentists: { id: string; fullName: string; visibleTitle?: string }[];
  dentistFilter: string;
  ownAgenda: boolean;
  canDelete: (block: BlockedSlot) => boolean;
  deleteDenialReason?: (block: BlockedSlot) => string | null;
  onDeleteDenied?: (message: string) => void;
  unblockingKey?: string | null;
  onClose: () => void;
  onUnblock: (entry: UnblockEntry) => void | Promise<void>;
};

export function AgendaUnblockDrawer({
  open,
  clinicId,
  blocks,
  anchorDate,
  dentists,
  dentistFilter,
  ownAgenda,
  canDelete,
  deleteDenialReason,
  onDeleteDenied,
  unblockingKey = null,
  onClose,
  onUnblock
}: UnblockDrawerProps) {
  const [fromDate, setFromDate] = React.useState(anchorDate);
  const [toDate, setToDate] = React.useState(() => endOfMonthIso(anchorDate));
  const [filterDentist, setFilterDentist] = React.useState(dentistFilter);

  useEffect(() => {
    if (!open) return;
    setFromDate(anchorDate);
    setToDate(endOfMonthIso(anchorDate));
    setFilterDentist(dentistFilter);
  }, [open, anchorDate, dentistFilter]);

  const scopedEntries = useMemo(
    () =>
      listUnblockEntries(blocks, {
        clinicId,
        dentistId: filterDentist || undefined,
        fromDate,
        toDate: toDate >= fromDate ? toDate : fromDate
      }),
    [blocks, clinicId, filterDentist, fromDate, toDate]
  );

  const footer = (
    <Button tone="ghost" type="button" onClick={onClose}>
      Cerrar
    </Button>
  );

  return (
    <AgendaDrawerShell open={open} title="Desbloquear horarios" onClose={onClose} footer={footer}>
      <p className="agd-helper agd-helper--muted">
        Consulta los bloqueos activos en el rango indicado y quita los que ya no apliquen.
      </p>

      <div className="agd-form-row">
        <Field label="Desde">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </Field>
        <Field label="Hasta">
          <Input
            type="date"
            value={toDate}
            min={fromDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </Field>
      </div>

      {!ownAgenda ? (
        <Field label="Profesional">
          <Select value={filterDentist} onChange={(e) => setFilterDentist(e.target.value)}>
            <option value="">Todos</option>
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>
                {professionalDisplayName(d.fullName, d.visibleTitle)}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <p className="agd-unblock-summary">
        {scopedEntries.length
          ? `${scopedEntries.length} bloqueo${scopedEntries.length === 1 ? '' : 's'} en el periodo`
          : 'No hay bloqueos en este periodo'}
      </p>

      <ul className="agd-unblock-list">
        {scopedEntries.map((entry) => {
          const block = entry.representative;
          const target = blockTargetLabel(block, dentists);
          const period =
            entry.dayCount > 1
              ? `${fmtDate(entry.dateFrom)} → ${fmtDate(entry.dateTo)} (${entry.dayCount} días)`
              : fmtDate(entry.dateFrom);
          const denial = deleteDenialReason?.(block) ?? (canDelete(block) ? null : 'No tienes permiso para desbloquear este horario.');
          const allowed = !denial;
          const busy = unblockingKey === entry.key;

          function tryUnblock() {
            if (busy) return;
            if (denial) {
              onDeleteDenied?.(denial);
              return;
            }
            void onUnblock(entry);
          }

          return (
            <li key={entry.key} className={`agd-unblock-item${!allowed ? ' agd-unblock-item--denied' : ''}`}>
              <div className="agd-unblock-item__main">
                <p className="agd-unblock-item__date">{period}</p>
                <p className="agd-unblock-item__time">{formatUnblockTime(block)}</p>
                <p className="agd-unblock-item__pro">{target}</p>
                <p className="agd-unblock-item__reason">{block.reason}</p>
                {!allowed ? <p className="agd-unblock-item__denial">{denial}</p> : null}
              </div>
              <Button
                type="button"
                tone={allowed ? 'secondary' : 'ghost'}
                className="agd-unblock-item__btn"
                disabled={busy}
                title={allowed ? 'Quitar bloqueo' : denial ?? 'Sin permiso'}
                aria-disabled={!allowed}
                onClick={tryUnblock}
              >
                <Unlock className="h-4 w-4" aria-hidden />
                {busy ? 'Desbloqueando…' : allowed ? 'Desbloquear' : 'Sin permiso'}
              </Button>
            </li>
          );
        })}
      </ul>

      {!scopedEntries.length ? (
        <p className="agd-helper agd-helper--muted">Prueba ampliando el rango de fechas o cambiando el filtro de profesional.</p>
      ) : null}
    </AgendaDrawerShell>
  );
}

export function AgendaBlockDetailDrawer({
  open,
  block,
  targetLabel,
  onClose,
  onRemove,
  groupDayCount,
  canRemove = true,
  removeDenialReason = null,
  onRemoveDenied
}: {
  open: boolean;
  block: BlockedSlot | null;
  targetLabel: string;
  groupDayCount?: number;
  canRemove?: boolean;
  removeDenialReason?: string | null;
  onRemoveDenied?: (message: string) => void;
  onClose: () => void;
  onRemove: () => void;
}) {
  if (!block) return null;
  const range = blockRangeLabel(block);

  const footer = (
    <>
      <Button tone="ghost" type="button" onClick={onClose}>
        Cerrar
      </Button>
      <Button
        type="button"
        className="agd-drawer__primary agd-drawer__primary--danger"
        onClick={() => {
          if (removeDenialReason) {
            onRemoveDenied?.(removeDenialReason);
            return;
          }
          if (!canRemove) {
            onRemoveDenied?.('No tienes permiso para eliminar este bloqueo.');
            return;
          }
          onRemove();
        }}
      >
        {canRemove ? 'Eliminar bloqueo' : 'Sin permiso para desbloquear'}
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
          <dt>Periodo</dt>
          <dd>
            {range ?? fmtDate(block.date)}
            {groupDayCount && groupDayCount > 1 ? ` (${groupDayCount} días)` : ''}
          </dd>
        </div>
        <div>
          <dt>Horario</dt>
          <dd>
            {block.allDay
              ? 'Día completo'
              : `${block.time}${block.endTime && block.endTime !== block.time ? ` – ${block.endTime}` : ''}`}
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
      {removeDenialReason ? (
        <p className="agd-unblock-item__denial mt-3" role="alert">
          {removeDenialReason}
        </p>
      ) : null}
    </AgendaDrawerShell>
  );
}

export { validateAppointmentSlot };
