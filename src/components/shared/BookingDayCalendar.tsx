import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DemoState } from '@/types/demo';
import { todayIso } from '@/lib/format';
import {
  buildMonthGrid,
  canGoPrevMonth,
  monthLabel,
  shiftMonth,
  summarizeDayAvailability,
  weekdayLabels,
  type DayAvailabilityLevel
} from '@/lib/bookingCalendar';

type Props = {
  state: DemoState;
  clinicId: string;
  dentistId: string;
  cabinetId: string;
  treatmentId: string;
  value: string;
  onChange: (date: string) => void;
};

function levelClass(level: DayAvailabilityLevel, inMonth: boolean, selected: boolean, isToday: boolean): string {
  const parts = ['book-cal__day'];
  if (!inMonth) parts.push('book-cal__day--muted');
  if (selected) parts.push('book-cal__day--selected');
  else if (isToday) parts.push('book-cal__day--today');
  parts.push(`book-cal__day--${level}`);
  return parts.join(' ');
}

export function BookingDayCalendar({
  state,
  clinicId,
  dentistId,
  cabinetId,
  treatmentId,
  value,
  onChange
}: Props) {
  const today = todayIso();
  const initial = value && value >= today ? new Date(value + 'T12:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const slotOpts = useMemo(
    () => ({ clinicId, dentistId, cabinetId, treatmentId }),
    [clinicId, dentistId, cabinetId, treatmentId]
  );

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const availability = useMemo(() => {
    const map = new Map<string, ReturnType<typeof summarizeDayAvailability>>();
    for (const cell of grid) {
      if (!cell.inMonth) continue;
      map.set(cell.date, summarizeDayAvailability(state, { ...slotOpts, date: cell.date }));
    }
    return map;
  }, [grid, state, slotOpts]);

  const openDaysInMonth = useMemo(() => {
    let n = 0;
    for (const [, a] of availability) {
      if (a.level === 'open' || a.level === 'low') n++;
    }
    return n;
  }, [availability]);

  function goMonth(delta: number) {
    const next = shiftMonth(viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.month);
  }

  function pickDay(date: string, inMonth: boolean) {
    if (!inMonth) {
      const d = new Date(date + 'T12:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    const level = summarizeDayAvailability(state, { ...slotOpts, date }).level;
    if (level === 'past' || level === 'full') return;
    onChange(date);
  }

  return (
    <div className="book-cal">
      <div className="book-cal__toolbar">
        <button
          type="button"
          className="book-cal__nav"
          disabled={!canGoPrevMonth(viewYear, viewMonth)}
          onClick={() => goMonth(-1)}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="book-cal__month">{monthLabel(viewYear, viewMonth)}</p>
        <button type="button" className="book-cal__nav" onClick={() => goMonth(1)} aria-label="Mes siguiente">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <p className="book-cal__hint">
        {openDaysInMonth > 0
          ? `${openDaysInMonth} día(s) con huecos este mes · toca un día disponible`
          : 'Sin huecos este mes — prueba el mes siguiente'}
      </p>

      <div className="book-cal__weekdays" aria-hidden>
        {weekdayLabels().map((w) => (
          <span key={w} className="book-cal__weekday">
            {w}
          </span>
        ))}
      </div>

      <div className="book-cal__grid" role="grid" aria-label="Calendario de reserva">
        {grid.map((cell) => {
          const summary = availability.get(cell.date) ?? summarizeDayAvailability(state, { ...slotOpts, date: cell.date });
          const disabled = !cell.inMonth
            ? false
            : summary.level === 'past' || summary.level === 'full';
          const selected = value === cell.date;
          const isToday = cell.date === today;

          return (
            <button
              key={cell.date}
              type="button"
              role="gridcell"
              disabled={cell.inMonth && disabled}
              aria-selected={selected}
              aria-label={`${cell.day}${cell.inMonth ? '' : ' otro mes'}${summary.free ? `, ${summary.free} huecos` : ''}`}
              className={levelClass(summary.level, cell.inMonth, selected, isToday)}
              onClick={() => pickDay(cell.date, cell.inMonth)}
            >
              <span className="book-cal__day-num">{cell.day}</span>
              {cell.inMonth && summary.level !== 'past' ? (
                <span className={`book-cal__dot book-cal__dot--${summary.level}`} aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>

      <ul className="book-cal__legend">
        <li>
          <i className="book-cal__dot book-cal__dot--open" /> Disponible
        </li>
        <li>
          <i className="book-cal__dot book-cal__dot--low" /> Pocos huecos
        </li>
        <li>
          <i className="book-cal__dot book-cal__dot--full" /> Completo
        </li>
      </ul>
    </div>
  );
}
