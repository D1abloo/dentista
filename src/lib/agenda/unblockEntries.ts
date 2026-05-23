import { blockAppliesToDentist } from '@/lib/agenda/availability';
import type { BlockedSlot } from '@/types/demo';

export type UnblockEntry = {
  key: string;
  blockGroupId?: string;
  representative: BlockedSlot;
  blocks: BlockedSlot[];
  dateFrom: string;
  dateTo: string;
  dayCount: number;
};

export function listUnblockEntries(
  blocks: BlockedSlot[],
  opts: { clinicId: string; dentistId?: string; fromDate?: string; toDate?: string }
): UnblockEntry[] {
  let list = blocks.filter((b) => b.clinicId === opts.clinicId);
  if (opts.dentistId) {
    list = list.filter((b) => blockAppliesToDentist(b, opts.dentistId!));
  }
  if (opts.fromDate) list = list.filter((b) => b.date >= opts.fromDate!);
  if (opts.toDate) list = list.filter((b) => b.date <= opts.toDate!);

  const byGroup = new Map<string, BlockedSlot[]>();
  const singles: BlockedSlot[] = [];

  for (const b of list) {
    if (b.blockGroupId) {
      const arr = byGroup.get(b.blockGroupId) ?? [];
      arr.push(b);
      byGroup.set(b.blockGroupId, arr);
    } else {
      singles.push(b);
    }
  }

  const entries: UnblockEntry[] = [];

  for (const [groupId, groupBlocks] of byGroup) {
    const sorted = [...groupBlocks].sort((a, c) => a.date.localeCompare(c.date) || a.time.localeCompare(c.time));
    entries.push({
      key: groupId,
      blockGroupId: groupId,
      representative: sorted[0],
      blocks: sorted,
      dateFrom: sorted[0].date,
      dateTo: sorted[sorted.length - 1].date,
      dayCount: sorted.length
    });
  }

  for (const b of singles) {
    entries.push({
      key: b.id,
      representative: b,
      blocks: [b],
      dateFrom: b.date,
      dateTo: b.date,
      dayCount: 1
    });
  }

  return entries.sort(
    (a, b) => a.dateFrom.localeCompare(b.dateFrom) || a.representative.time.localeCompare(b.representative.time)
  );
}

export function formatUnblockTime(block: BlockedSlot) {
  if (block.allDay) return 'Día completo';
  const end = block.endTime && block.endTime !== block.time ? ` – ${block.endTime}` : '';
  return `${block.time}${end}`;
}
