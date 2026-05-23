import { addMinutes } from 'date-fns';
import { format } from 'date-fns';
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '../supabaseServer';

export type ScheduleBlockRow = {
  id: string;
  clinicId: string;
  tenantId: string;
  dentistId: string;
  date: string;
  time: string;
  endTime?: string;
  reason: string;
  blockGroupId?: string;
  dentistIds?: string[];
  allDay?: boolean;
};

const memoryBlocks: ScheduleBlockRow[] = [];

export async function listScheduleBlocks(clinicId: string, date?: string): Promise<ScheduleBlockRow[]> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    return memoryBlocks.filter((b) => b.clinicId === clinicId && (!date || b.date === date));
  }

  const supabase = getSupabaseAdmin();
  let q = supabase
    .from('schedule_blocks')
    .select(
      'id, clinic_id, tenant_id, dentist_id, dentist_ids, starts_at, ends_at, reason, block_group_id, applies_to_all_professionals'
    )
    .eq('clinic_id', clinicId)
    .order('starts_at', { ascending: true });

  if (date) {
    const start = `${date}T00:00:00+00:00`;
    const end = `${date}T23:59:59+00:00`;
    q = q.gte('starts_at', start).lte('starts_at', end);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((row) => mapScheduleBlockRow(row));
}

function mapScheduleBlockRow(row: Record<string, unknown>): ScheduleBlockRow {
  const starts = new Date(row.starts_at as string);
  const ends = row.ends_at ? new Date(row.ends_at as string) : starts;
  const dentistIds = (row.dentist_ids as string[] | null) ?? undefined;
  return {
    id: row.id as string,
    clinicId: row.clinic_id as string,
    tenantId: (row.tenant_id as string) ?? '',
    dentistId: row.dentist_id as string,
    dentistIds: dentistIds?.length ? dentistIds : undefined,
    date: format(starts, 'yyyy-MM-dd'),
    time: format(starts, 'HH:mm'),
    endTime: format(ends, 'HH:mm'),
    reason: row.reason as string,
    blockGroupId: (row.block_group_id as string | null) ?? undefined,
    allDay: false
  };
}

export async function listScheduleBlocksForClinics(
  clinicIds: string[],
  date?: string
): Promise<ScheduleBlockRow[]> {
  if (!clinicIds.length) return [];
  if (isDemoMode() || !hasSupabaseConfig()) {
    return memoryBlocks.filter((b) => clinicIds.includes(b.clinicId) && (!date || b.date === date));
  }
  const supabase = getSupabaseAdmin();
  let q = supabase
    .from('schedule_blocks')
    .select(
      'id, clinic_id, tenant_id, dentist_id, dentist_ids, starts_at, ends_at, reason, block_group_id, applies_to_all_professionals'
    )
    .in('clinic_id', clinicIds)
    .order('starts_at', { ascending: true });
  if (date) {
    const start = `${date}T00:00:00+00:00`;
    const end = `${date}T23:59:59+00:00`;
    q = q.gte('starts_at', start).lte('starts_at', end);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((row) => mapScheduleBlockRow(row));
}

export async function createScheduleBlock(input: {
  clinicId: string;
  tenantId?: string;
  dentistId: string;
  dentistIds?: string[];
  date: string;
  time: string;
  endTime?: string;
  reason: string;
  durationMinutes?: number;
  blockGroupId?: string;
  notes?: string;
}): Promise<ScheduleBlockRow> {
  const duration = input.durationMinutes ?? 60;
  const startsAt = new Date(`${input.date}T${input.time}:00+02:00`);
  const endsAt = input.endTime
    ? new Date(`${input.date}T${input.endTime}:00+02:00`)
    : addMinutes(startsAt, duration);

  if (isDemoMode() || !hasSupabaseConfig()) {
    const row: ScheduleBlockRow = {
      id: `BLK-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      clinicId: input.clinicId,
      tenantId: input.tenantId ?? '',
      dentistId: input.dentistId,
      dentistIds: input.dentistIds,
      date: input.date,
      time: input.time.slice(0, 5),
      endTime: input.endTime?.slice(0, 5),
      reason: input.reason.trim(),
      blockGroupId: input.blockGroupId
    };
    memoryBlocks.push(row);
    return row;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('schedule_blocks')
    .insert({
      clinic_id: input.clinicId,
      tenant_id: input.tenantId ?? null,
      dentist_id: input.dentistId,
      dentist_ids: input.dentistIds?.length ? input.dentistIds : null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      reason: input.reason.trim(),
      notes: input.notes ?? null,
      block_group_id: input.blockGroupId ?? null
    })
    .select(
      'id, clinic_id, tenant_id, dentist_id, dentist_ids, starts_at, ends_at, reason, block_group_id'
    )
    .single();

  if (error) throw error;
  return mapScheduleBlockRow(data);
}

export async function deleteScheduleBlock(clinicId: string, blockId: string): Promise<void> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    const idx = memoryBlocks.findIndex((b) => b.id === blockId && b.clinicId === clinicId);
    if (idx >= 0) memoryBlocks.splice(idx, 1);
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('schedule_blocks').delete().eq('clinic_id', clinicId).eq('id', blockId);
  if (error) throw error;
}

export async function deleteScheduleBlockGroup(clinicId: string, blockGroupId: string): Promise<number> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    const before = memoryBlocks.length;
    for (let i = memoryBlocks.length - 1; i >= 0; i--) {
      if (memoryBlocks[i].clinicId === clinicId && memoryBlocks[i].blockGroupId === blockGroupId) {
        memoryBlocks.splice(i, 1);
      }
    }
    return before - memoryBlocks.length;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('schedule_blocks')
    .delete()
    .eq('clinic_id', clinicId)
    .eq('block_group_id', blockGroupId)
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}
