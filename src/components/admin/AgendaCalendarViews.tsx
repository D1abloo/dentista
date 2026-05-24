import { useEffect, useRef, useState } from 'react';
import { Calendar, Check, Eye, MoreHorizontal, X } from 'lucide-react';
import { blockCoversHour, hourInClinicRange } from '@/lib/agenda/availability';
import type { AgendaDentistColumn } from '@/lib/clinical/dentistDisplay';
import { AgendaDoctorAvatar } from './agenda/AgendaDoctorAvatar';
import { statusLabel } from '@/lib/format';
import { patientName } from '@/lib/selectors';
import type { Appointment, AppointmentStatus, BlockedSlot } from '@/types/demo';
import type { DemoState } from '@/types/demo';

export const AGENDA_HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00'
] as const;

function hourKey(time: string) {
  return time.slice(0, 2);
}

function apptAtHour(appts: Appointment[], hour: string) {
  return appts.find((a) => hourKey(a.time) === hourKey(hour));
}

function blockAtHour(blocks: BlockedSlot[], hour: string, dentistId: string) {
  return blocks.find((b) => blockCoversHour(b, hour, dentistId));
}

function statusClass(status: AppointmentStatus) {
  if (status === 'confirmada' || status === 'completada') return 'agd-event--ok';
  if (status === 'pendiente') return 'agd-event--warn';
  return 'agd-event--muted';
}

type DayViewProps = {
  state: DemoState;
  date: string;
  appointments: Appointment[];
  blocks: BlockedSlot[];
  dentistId: string;
  dentists: AgendaDentistColumn[];
  treatments: { id: string; name: string }[];
  multiDentist: boolean;
  onPickSlot: (hour: string) => void;
  onConfirm: (appt: Appointment) => void;
  onCancel: (appt: Appointment) => void;
  onReschedule: (appt: Appointment) => void;
  onOpenAppointment: (appt: Appointment) => void;
  onOpenBlock: (block: BlockedSlot) => void;
};

function EventMenu({
  onReschedule
}: {
  onReschedule: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuH = menuRef.current?.offsetHeight ?? 120;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuH + 12;
    setPos({
      top: openUp ? rect.top - menuH - 6 : rect.bottom + 6,
      left: Math.min(rect.right - 160, window.innerWidth - 168)
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (!btnRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="agd-event__icon-btn"
        aria-label="Más acciones"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <ul
          ref={menuRef}
          className="agd-event-menu agd-event-menu--fixed"
          role="menu"
          style={{ top: pos.top, left: pos.left }}
        >
          <li>
            <button type="button" role="menuitem" onClick={() => { onReschedule(); setOpen(false); }}>
              Reprogramar
            </button>
          </li>
        </ul>
      ) : null}
    </>
  );
}

function AppointmentEvent({
  appt,
  state,
  treatment,
  dentist,
  onConfirm,
  onCancel,
  onReschedule,
  onOpen
}: {
  appt: Appointment;
  state: DemoState;
  treatment: string;
  dentist: string;
  onConfirm: () => void;
  onCancel: () => void;
  onReschedule: () => void;
  onOpen: () => void;
}) {
  const pending = appt.status === 'pendiente';
  const canCancel = appt.status !== 'cancelada';
  return (
    <article
      className={`agd-event ${statusClass(appt.status)} agd-event--clickable`}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <header className="agd-event__head">
        <div className="agd-event__title-wrap">
          <strong>{patientName(state, appt.patientId)}</strong>
          <span className="agd-event__meta">
            {treatment} · {dentist}
          </span>
        </div>
        <div className="agd-event__head-actions">
          <span className={`agd-event__status agd-event__status--${appt.status}`}>{statusLabel(appt.status)}</span>
          <EventMenu onReschedule={onReschedule} />
        </div>
      </header>
      {pending || canCancel ? (
        <div className="agd-event__actions" role="group" aria-label="Acciones de la cita">
          {pending ? (
            <button
              type="button"
              className="agd-event__btn agd-event__btn--ok"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              Confirmar
            </button>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              className="agd-event__btn agd-event__btn--danger"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Cancelar
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function AgendaDayCalendar({
  state,
  appointments,
  blocks,
  dentistId,
  dentists,
  treatments,
  multiDentist,
  onPickSlot,
  onConfirm,
  onCancel,
  onReschedule,
  onOpenAppointment,
  onOpenBlock
}: DayViewProps) {
  const cols: AgendaDentistColumn[] = multiDentist
    ? dentists.length
      ? dentists
      : [{ id: '_', fullName: 'Sin profesional', initials: '—' }]
    : [
        dentistId
          ? (dentists.find((d) => d.id === dentistId) ?? {
              id: dentistId,
              fullName: dentists.find((d) => d.id === dentistId)?.fullName ?? 'Agenda',
              initials: 'DR'
            })
          : { id: '_all', fullName: 'Todas las citas', initials: 'ALL' }
      ];

  return (
    <div className="agd-cal" style={{ ['--agd-cal-cols' as string]: String(cols.length) }}>
      <div className="agd-cal__header">
        <span className="agd-cal__corner" aria-hidden />
        {cols.map((col) => (
          <span
            key={col.id}
            className="agd-cal__col-title"
            style={col.agendaColor ? { ['--agd-doc-color' as string]: col.agendaColor } : undefined}
          >
            {'photoUrl' in col ? (
              <span className="agd-cal__col-prof">
                <AgendaDoctorAvatar dentist={col} size="sm" />
                <span>
                  <strong>{col.fullName}</strong>
                  {col.visibleTitle ? <small>{col.visibleTitle}</small> : null}
                </span>
              </span>
            ) : (
              col.fullName
            )}
          </span>
        ))}
      </div>
      <div className="agd-cal__scroll">
        {AGENDA_HOURS.map((hour) => (
          <div key={hour} className="agd-cal__row">
            <span className="agd-cal__time">{hour}</span>
            {cols.map((col) => {
              const colDentistId = multiDentist ? col.id : dentistId;
              const colAppts = multiDentist
                ? appointments.filter((a) => a.dentistId === col.id)
                : appointments;
              const appt = apptAtHour(colAppts, hour);
              const block = blockAtHour(blocks, hour, colDentistId);
              const outOfHours = !hourInClinicRange(hour);

              return (
                <div key={`${col.id}-${hour}`} className="agd-cal__cell">
                  {outOfHours ? (
                    <span className="agd-cal__closed">Fuera de horario</span>
                  ) : appt ? (
                    <AppointmentEvent
                      appt={appt}
                      state={state}
                      treatment={treatments.find((t) => t.id === appt.treatmentId)?.name ?? 'Consulta'}
                      dentist={dentists.find((d) => d.id === appt.dentistId)?.fullName ?? 'Profesional'}
                      onConfirm={() => onConfirm(appt)}
                      onCancel={() => onCancel(appt)}
                      onReschedule={() => onReschedule(appt)}
                      onOpen={() => onOpenAppointment(appt)}
                    />
                  ) : block ? (
                    <article
                      className="agd-event agd-event--block agd-event--clickable"
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenBlock(block)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenBlock(block);
                        }
                      }}
                    >
                      <header className="agd-event__head">
                        <div className="agd-event__title-wrap">
                          <strong>Bloqueado</strong>
                          <span className="agd-event__meta">{block.reason}</span>
                        </div>
                        <span className="agd-event__status agd-event__status--block">Bloqueado</span>
                      </header>
                      <button
                        type="button"
                        className="agd-event__btn agd-event__btn--ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBlock(block);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        Ver detalle
                      </button>
                    </article>
                  ) : (
                    <button type="button" className="agd-cal__free" onClick={() => onPickSlot(hour)}>
                      <span>Disponible</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <footer className="agd-cal__legend">
        <span>
          <i className="agd-cal__legend-dot agd-cal__legend-dot--free" /> Disponible
        </span>
        <span>
          <i className="agd-cal__legend-dot agd-cal__legend-dot--ok" /> Confirmada
        </span>
        <span>
          <i className="agd-cal__legend-dot agd-cal__legend-dot--warn" /> Pendiente
        </span>
        <span>
          <i className="agd-cal__legend-dot agd-cal__legend-dot--block" /> Bloqueado
        </span>
        <span>
          <i className="agd-cal__legend-dot agd-cal__legend-dot--muted" /> Fuera de horario
        </span>
      </footer>
    </div>
  );
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function weekDaysFromMonday(anchorIso: string) {
  const d = new Date(`${anchorIso}T12:00:00`);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

type WeekMonthProps = {
  state: DemoState;
  mode: 'semana' | 'mes';
  anchorDate: string;
  appointments: Appointment[];
  onSelectDay: (iso: string) => void;
};

export function AgendaWeekMonthCalendar({ state, mode, anchorDate, appointments, onSelectDay }: WeekMonthProps) {
  if (mode === 'semana') {
    const days = weekDaysFromMonday(anchorDate);
    const byDay = days.map((d) => ({
      date: d,
      list: appointments.filter((a) => a.date === d)
    }));

    return (
      <div className="agd-week-cal">
        {byDay.map(({ date, list }) => (
          <button
            key={date}
            type="button"
            className={`agd-week-cal__day${date === anchorDate ? ' agd-week-cal__day--active' : ''}`}
            onClick={() => onSelectDay(date)}
          >
            <span className="agd-week-cal__weekday">
              {(() => {
                const dow = new Date(`${date}T12:00:00`).getDay();
                return WEEKDAY_LABELS[dow === 0 ? 6 : dow - 1];
              })()}
            </span>
            <span className="agd-week-cal__num">{new Date(`${date}T12:00:00`).getDate()}</span>
            <span className="agd-week-cal__count">{list.length} cita{list.length === 1 ? '' : 's'}</span>
            <ul className="agd-week-cal__list">
              {list.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <span className={`agd-week-cal__dot agd-week-cal__dot--${a.status === 'pendiente' ? 'warn' : 'ok'}`} />
                  {a.time.slice(0, 5)} {patientName(state, a.patientId)}
                </li>
              ))}
              {list.length > 4 ? <li className="agd-week-cal__more">+{list.length - 4} más</li> : null}
            </ul>
          </button>
        ))}
      </div>
    );
  }

  const anchor = new Date(`${anchorDate}T12:00:00`);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { iso: string; inMonth: boolean }[] = [];
  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month, -startPad + i + 1);
    cells.push({ iso: d.toISOString().slice(0, 10), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(year, month, d).toISOString().slice(0, 10);
    cells.push({ iso, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = new Date(`${cells[cells.length - 1].iso}T12:00:00`);
    last.setDate(last.getDate() + 1);
    cells.push({ iso: last.toISOString().slice(0, 10), inMonth: false });
  }

  return (
    <div className="agd-month-cal">
      <div className="agd-month-cal__weekdays">
        {WEEKDAY_LABELS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <div className="agd-month-cal__grid">
        {cells.map(({ iso, inMonth }) => {
          const list = appointments.filter((a) => a.date === iso);
          const pending = list.filter((a) => a.status === 'pendiente').length;
          return (
            <button
              key={iso}
              type="button"
              className={`agd-month-cal__cell${!inMonth ? ' agd-month-cal__cell--muted' : ''}${iso === anchorDate ? ' agd-month-cal__cell--active' : ''}`}
              onClick={() => inMonth && onSelectDay(iso)}
              disabled={!inMonth}
            >
              <span className="agd-month-cal__day">{new Date(`${iso}T12:00:00`).getDate()}</span>
              {inMonth && list.length ? (
                <span className="agd-month-cal__badge">
                  {list.length}
                  {pending ? <em>{pending} pend.</em> : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="agd-month-cal__hint">
        <Calendar className="h-4 w-4" aria-hidden />
        Haz clic en un día para abrir la agenda detallada.
      </p>
    </div>
  );
}
