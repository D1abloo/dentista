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
  reason: string;
};

const memoryBlocks: ScheduleBlockRow[] = [];

export async function listScheduleBlocks(clinicId: string, date?: string): Promise<ScheduleBlockRow[]> {
  if (isDemoMode() || !hasSupabaseConfig()) {
    return memoryBlocks.filter((b) => b.clinicId === clinicId && (!date || b.date === date));
  }

  const supabase = getSupabaseAdmin();
  let q = supabase
    .from('schedule_blocks')
    .select('id, clinic_id, tenant_id, dentist_id, starts_at, reason')
    .eq('clinic_id', clinicId)
    .order('starts_at', { ascending: true });

  if (date) {
    const start = `${date}T00:00:00+00:00`;
    const end = `${date}T23:59:59+00:00`;
    q = q.gte('starts_at', start).lte('starts_at', end);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const starts = new Date(row.starts_at as string);
    return {
      id: row.id as string,
      clinicId: row.clinic_id as string,
      tenantId: (row.tenant_id as string) ?? '',
      dentistId: row.dentist_id as string,
      date: format(starts, 'yyyy-MM-dd'),
      time: format(starts, 'HH:mm'),
      reason: row.reason as string
    };
  });
}

export async function createScheduleBlock(input: {
  clinicId: string;
  tenantId?: string;
  dentistId: string;
  date: string;
  time: string;
  reason: string;
  durationMinutes?: number;
}): Promise<ScheduleBlockRow> {
  const duration = input.durationMinutes ?? 60;
  const startsAt = new Date(`${input.date}T${input.time}:00+02:00`);
  const endsAt = addMinutes(startsAt, duration);

  if (isDemoMode() || !hasSupabaseConfig()) {
    const row: ScheduleBlockRow = {
      id: `BLK-${Date.now()}`,
      clinicId: input.clinicId,
      tenantId: input.tenantId ?? '',
      dentistId: input.dentistId,
      date: input.date,
      time: input.time.slice(0, 5),
      reason: input.reason.trim()
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
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      reason: input.reason.trim()
    })
    .select('id, clinic_id, tenant_id, dentist_id, starts_at, reason')
    .single();

  if (error) throw error;
  const starts = new Date(data.starts_at as string);
  return {
    id: data.id as string,
    clinicId: data.clinic_id as string,
    tenantId: (data.tenant_id as string) ?? '',
    dentistId: data.dentist_id as string,
    date: format(starts, 'yyyy-MM-dd'),
    time: format(starts, 'HH:mm'),
    reason: data.reason as string
  };
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
