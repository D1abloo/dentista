import { AGENDA_DAY_END, AGENDA_DAY_START } from '@/lib/agenda/availability';
import type { BlockedSlot } from '@/types/demo';

export type BlockMode = 'hours' | 'fullday';

export type ScheduleBlockInput = {
  clinicId: string;
  cabinetId: string;
  tenantId?: string;
  dentistIds: string[];
  startDate: string;
  endDate: string;
  mode: BlockMode;
  startTime: string;
  endTime: string;
  consecutive: boolean;
  selectedDates: string[];
  reason: string;
  notes?: string;
};

export function professionalDisplayName(fullName: string, visibleTitle?: string) {
  const fromName = fullName.match(/^(Dra?\.?)\s+/i);
  const honorific = fromName?.[1]
    ? fromName[1].toLowerCase().startsWith('dra')
      ? 'Dra.'
      : 'Dr.'
    : visibleTitle?.toLowerCase().includes('dra')
      ? 'Dra.'
      : 'Dr.';
  const name = fullName.replace(/^(Dra?\.?)\s+/i, '').trim();
  return `${honorific} ${name}`;
}

export function endOfMonthIso(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

export function datesInRangeInclusive(from: string, to: string) {
  const out: string[] = [];
  const end = new Date(`${to}T12:00:00`);
  let cur = new Date(`${from}T12:00:00`);
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function datesForMonthGrid(anchorIso: string) {
  const prefix = anchorIso.slice(0, 7);
  return datesInRangeInclusive(`${prefix}-01`, endOfMonthIso(anchorIso));
}

/** Expande la configuración del drawer en registros de bloqueo por día. */
export function expandScheduleBlocks(input: ScheduleBlockInput): Omit<BlockedSlot, 'id' | 'tenantId'>[] {
  const ids = [...new Set(input.dentistIds)];
  if (!ids.length) return [];

  const rangeDates = input.consecutive
    ? datesInRangeInclusive(input.startDate, input.endDate)
    : [...new Set(input.selectedDates)].sort();

  if (!rangeDates.length) return [];

  const blockGroupId = `BLK-GRP-${Date.now()}`;
  const timeStart =
    input.mode === 'fullday'
      ? `${String(AGENDA_DAY_START).padStart(2, '0')}:00`
      : input.startTime.slice(0, 5);
  let timeEnd =
    input.mode === 'fullday'
      ? `${String(AGENDA_DAY_END - 1).padStart(2, '0')}:59`
      : input.endTime.slice(0, 5);
  if (input.mode === 'hours' && timeEnd <= timeStart) {
    const [h, m] = timeStart.split(':').map(Number);
    const endMin = (h ?? 0) * 60 + (m ?? 0) + 60;
    timeEnd = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
  }

  const rows: Omit<BlockedSlot, 'id' | 'tenantId'>[] = [];

  for (const date of rangeDates) {
    rows.push({
      clinicId: input.clinicId,
      cabinetId: input.cabinetId,
      dentistId: ids[0],
      dentistIds: ids.length > 1 ? ids : undefined,
      date,
      time: timeStart,
      endTime: timeEnd,
      reason: input.reason,
      notes: input.notes,
      appliesToAll: false,
      blockGroupId,
      allDay: input.mode === 'fullday',
      endDate: input.endDate
    });
  }

  return rows;
}
