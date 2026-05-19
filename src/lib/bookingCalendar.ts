import type { DemoState } from '@/types/demo';
import { todayIso } from '@/lib/format';
import { daySlotMap } from '@/lib/slots';

export type DayAvailabilityLevel = 'past' | 'full' | 'low' | 'open';

export interface MonthDayCell {
  date: string;
  day: number;
  inMonth: boolean;
}

const WEEKDAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
] as const;

export function monthLabel(year: number, month: number): string {
  return `${MONTHS_ES[month]} ${year}`;
}

export function weekdayLabels(): readonly string[] {
  return WEEKDAYS_ES;
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Cuadrícula de 6 semanas (lunes primero) para un mes. */
export function buildMonthGrid(year: number, month: number): MonthDayCell[] {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  let padStart = first.getDay();
  padStart = padStart === 0 ? 6 : padStart - 1;

  const cells: MonthDayCell[] = [];

  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = padStart - 1; i >= 0; i--) {
    const day = prevMonthLast - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ date: toIsoDate(y, m, day), day, inMonth: false });
  }

  for (let day = 1; day <= lastDay; day++) {
    cells.push({ date: toIsoDate(year, month, day), day, inMonth: true });
  }

  while (cells.length % 7 !== 0 || cells.length < 42) {
    const nextIndex = cells.length - padStart - lastDay + 1;
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ date: toIsoDate(y, m, nextIndex), day: nextIndex, inMonth: false });
  }

  return cells.slice(0, 42);
}

export function summarizeDayAvailability(
  state: DemoState,
  opts: {
    clinicId: string;
    dentistId: string;
    cabinetId: string;
    treatmentId: string;
    date: string;
  }
): { free: number; level: DayAvailabilityLevel } {
  const today = todayIso();
  if (opts.date < today) {
    return { free: 0, level: 'past' };
  }

  const cells = daySlotMap(state, opts);
  const free = cells.filter((c) => c.status === 'libre').length;

  if (free === 0) return { free: 0, level: 'full' };
  if (free <= 2) return { free, level: 'low' };
  return { free, level: 'open' };
}

/** No permitir navegar a meses enteros en el pasado. */
export function canGoPrevMonth(year: number, month: number): boolean {
  const today = new Date();
  const view = new Date(year, month, 1);
  const now = new Date(today.getFullYear(), today.getMonth(), 1);
  return view > now;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
