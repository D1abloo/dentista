import { addMinutes } from 'date-fns';
import { format } from 'date-fns';
import { blockAppliesToDentist } from '../agenda/availability';
import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '../supabaseServer';

const BLOCK_SELECT_FULL =
  'id, clinic_id, tenant_id, dentist_id, dentist_ids, starts_at, ends_at, reason, block_group_id, applies_to_all_professionals, notes';
/** Sin dentist_ids (columna opcional); mantiene block_group_id para desbloqueo por grupo. */
const BLOCK_SELECT_GROUP =
  'id, clinic_id, tenant_id, dentist_id, starts_at, ends_at, reason, block_group_id, applies_to_all_professionals, notes';
const BLOCK_SELECT_CORE = 'id, clinic_id, tenant_id, dentist_id, starts_at, ends_at, reason';

type BlockQueryResult = { data: Record<string, unknown>[] | null; error: { code?: string; message?: string } | null };

async function runBlockSelect(
  run: (select: string) => Promise<BlockQueryResult>
): Promise<BlockQueryResult> {
  const full = await run(BLOCK_SELECT_FULL);
  if (!full.error) return full;
  if (!isMissingColumnError(full.error)) return full;
  const grouped = await run(BLOCK_SELECT_GROUP);
  if (!grouped.error) return grouped;
  if (!isMissingColumnError(grouped.error)) return grouped;
  return run(BLOCK_SELECT_CORE);
}

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return error.code === '42703' || msg.includes('does not exist') || msg.includes('column');
}

function normalizeTime(time: string) {
  const [h, m] = time.split(':');
  return `${String(Number(h) || 0).padStart(2, '0')}:${String(Number(m) || 0).padStart(2, '0')}`;
}

function resolveBlockEndsAt(startsAt: Date, endTime: string | undefined, durationMinutes: number) {
  const endsAt = endTime
    ? new Date(`${format(startsAt, 'yyyy-MM-dd')}T${normalizeTime(endTime)}:00`)
    : addMinutes(startsAt, durationMinutes);
  if (endsAt <= startsAt) return addMinutes(startsAt, Math.max(15, durationMinutes));
  return endsAt;
}

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
  let q = supabase.from('schedule_blocks').select(BLOCK_SELECT_FULL).eq('clinic_id', clinicId).order('starts_at', {
    ascending: true
  });

  if (date) {
    const start = `${date}T00:00:00+00:00`;
    const end = `${date}T23:59:59+00:00`;
    q = q.gte('starts_at', start).lte('starts_at', end);
  }

  const result = await runBlockSelect(async (select) => {
    let query = supabase.from('schedule_blocks').select(select).eq('clinic_id', clinicId).order('starts_at', {
      ascending: true
    });
    if (date) {
      const start = `${date}T00:00:00+00:00`;
      const end = `${date}T23:59:59+00:00`;
      query = query.gte('starts_at', start).lte('starts_at', end);
    }
    const res = await query;
    return { data: (res.data as Record<string, unknown>[] | null) ?? null, error: res.error };
  });
  if (result.error) throw result.error;
  const rows = result.data ?? [];
  return rows.map((row) => mapScheduleBlockRow(row));
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
  const result = await runBlockSelect(async (select) => {
    let query = supabase.from('schedule_blocks').select(select).in('clinic_id', clinicIds).order('starts_at', {
      ascending: true
    });
    if (date) {
      const start = `${date}T00:00:00+00:00`;
      const end = `${date}T23:59:59+00:00`;
      query = query.gte('starts_at', start).lte('starts_at', end);
    }
    const res = await query;
    return { data: (res.data as Record<string, unknown>[] | null) ?? null, error: res.error };
  });
  if (result.error) throw result.error;
  const rows = result.data ?? [];
  return rows.map((row) => mapScheduleBlockRow(row));
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
  const time = normalizeTime(input.time);
  const startsAt = new Date(`${input.date}T${time}:00`);
  const endsAt = resolveBlockEndsAt(startsAt, input.endTime, duration);
  const dentistIds = input.dentistIds?.length ? [...new Set(input.dentistIds)] : undefined;

  if (isDemoMode() || !hasSupabaseConfig()) {
    const row: ScheduleBlockRow = {
      id: `BLK-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      clinicId: input.clinicId,
      tenantId: input.tenantId ?? '',
      dentistId: input.dentistId,
      dentistIds,
      date: input.date,
      time,
      endTime: format(endsAt, 'HH:mm'),
      reason: input.reason.trim(),
      blockGroupId: input.blockGroupId
    };
    memoryBlocks.push(row);
    return row;
  }

  const supabase = getSupabaseAdmin();
  const reason = input.reason.trim();
  const baseRow = {
    clinic_id: input.clinicId,
    tenant_id: input.tenantId ?? null,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    reason
  };

  async function insertCore(dentistId: string) {
    const row: Record<string, unknown> = { ...baseRow, dentist_id: dentistId };
    if (input.blockGroupId) row.block_group_id = input.blockGroupId;
    if (input.notes) row.notes = input.notes;
    let res = await supabase.from('schedule_blocks').insert(row).select(BLOCK_SELECT_GROUP).single();
    if (isMissingColumnError(res.error) && input.blockGroupId) {
      const coreOnly = { ...baseRow, dentist_id: dentistId };
      res = await supabase.from('schedule_blocks').insert(coreOnly).select(BLOCK_SELECT_CORE).single();
    } else if (isMissingColumnError(res.error)) {
      res = await supabase.from('schedule_blocks').insert({ ...baseRow, dentist_id: dentistId }).select(BLOCK_SELECT_CORE).single();
    }
    if (res.error) throw new Error(res.error.message || 'No se pudo guardar el bloqueo.');
    return res.data as Record<string, unknown>;
  }

  let lastRow: Record<string, unknown> | null = null;

  if (dentistIds && dentistIds.length > 1) {
    const fullPayload = {
      ...baseRow,
      dentist_id: input.dentistId,
      dentist_ids: dentistIds,
      notes: input.notes ?? null,
      block_group_id: input.blockGroupId ?? null
    };
    const { data, error } = await supabase.from('schedule_blocks').insert(fullPayload).select(BLOCK_SELECT_FULL).single();
    if (!error) {
      lastRow = data;
    } else if (isMissingColumnError(error)) {
      for (const dId of dentistIds) {
        lastRow = await insertCore(dId);
      }
    } else {
      throw new Error(error.message || 'No se pudo guardar el bloqueo.');
    }
  } else {
    const fullPayload = {
      ...baseRow,
      dentist_id: input.dentistId,
      notes: input.notes ?? null,
      block_group_id: input.blockGroupId ?? null
    };
    let { data, error } = await supabase.from('schedule_blocks').insert(fullPayload).select(BLOCK_SELECT_FULL).single();
    if (isMissingColumnError(error)) {
      lastRow = await insertCore(input.dentistId);
    } else if (error) {
      throw new Error(error.message || 'No se pudo guardar el bloqueo.');
    } else {
      lastRow = data;
    }
  }

  if (!lastRow) throw new Error('No se pudo crear el bloqueo.');
  const mapped = mapScheduleBlockRow(lastRow);
  return { ...mapped, dentistIds, blockGroupId: input.blockGroupId };
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function deleteScheduleBlocksByIds(clinicId: string, blockIds: string[]): Promise<number> {
  const ids = [...new Set(blockIds.filter((id) => id && UUID_RE.test(id)))];
  if (!ids.length) return 0;

  if (isDemoMode() || !hasSupabaseConfig()) {
    let removed = 0;
    for (let i = memoryBlocks.length - 1; i >= 0; i--) {
      if (memoryBlocks[i].clinicId === clinicId && ids.includes(memoryBlocks[i].id)) {
        memoryBlocks.splice(i, 1);
        removed++;
      }
    }
    return removed;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('schedule_blocks')
    .delete()
    .eq('clinic_id', clinicId)
    .in('id', ids)
    .select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

/** Elimina todos los bloqueos de la clínica en un rango; opcionalmente solo los de un dentista. */
export async function deleteScheduleBlocksInRange(
  clinicId: string,
  opts: { fromDate: string; toDate: string; dentistId?: string }
): Promise<number> {
  const toDate = opts.toDate >= opts.fromDate ? opts.toDate : opts.fromDate;
  const rows = await listScheduleBlocks(clinicId);
  const matching = rows.filter((row) => {
    if (row.date < opts.fromDate || row.date > toDate) return false;
    if (!opts.dentistId) return true;
    return blockAppliesToDentist(
      {
        id: row.id,
        clinicId: row.clinicId,
        tenantId: row.tenantId,
        dentistId: row.dentistId,
        dentistIds: row.dentistIds,
        cabinetId: '',
        date: row.date,
        time: row.time,
        reason: row.reason,
        blockGroupId: row.blockGroupId
      },
      opts.dentistId
    );
  });
  const ids = matching.map((r) => r.id);
  if (!ids.length) return 0;
  return deleteScheduleBlocksByIds(clinicId, ids);
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
  if (isMissingColumnError(error)) {
    return 0;
  }
  if (error) throw error;
  return data?.length ?? 0;
}
