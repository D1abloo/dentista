import type { APIRoute } from 'astro';
import { requireClinicSessionAsync, requireStaffSession } from '@/lib/api/guards';
import { fail, ok, created } from '@/lib/http';
import { logError } from '@/lib/logger';
import {
  createScheduleBlock,
  deleteScheduleBlock,
  deleteScheduleBlockGroup,
  listScheduleBlocks
} from '@/lib/services/scheduleBlocks';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { scheduleBlockCreateSchema, scheduleBlockDeleteSchema } from '@/lib/validators';

export const prerender = false;

function clinicIdFromRequest(context: { url: URL }, bodyClinicId?: string) {
  return bodyClinicId ?? context.url.searchParams.get('clinicId') ?? undefined;
}

export const GET: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;

  const clinicId = clinicIdFromRequest(context) ?? gate.user.clinicId;
  if (!clinicId) return fail('Indica la sede.', 422);

  const scopeGate = await requireClinicSessionAsync(context, clinicId);
  if (scopeGate.response) return scopeGate.response;

  const date = context.url.searchParams.get('date') ?? undefined;
  try {
    const blocks = await listScheduleBlocks(clinicId, date || undefined);
    return ok({ blocks });
  } catch (error) {
    logError('schedule.blocks.get', error);
    return fail('No se pudieron cargar los bloqueos.', 500);
  }
};

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = scheduleBlockCreateSchema.safeParse(body);
    if (!parsed.success) return fail('Datos de bloqueo inválidos.', 422, parsed.error.flatten());

    const clinicId = parsed.data.clinicId ?? gate.user.clinicId;
    if (!clinicId) return fail('Indica la sede.', 422);

    const scopeGate = await requireClinicSessionAsync(context, clinicId);
    if (scopeGate.response) return scopeGate.response;

    const block = await createScheduleBlock({
      clinicId,
      tenantId: gate.user.tenantId ?? undefined,
      dentistId: parsed.data.dentistId,
      dentistIds: parsed.data.dentistIds,
      date: parsed.data.date,
      time: parsed.data.time,
      endTime: parsed.data.endTime,
      reason: parsed.data.reason,
      durationMinutes: parsed.data.durationMinutes,
      blockGroupId: parsed.data.blockGroupId,
      notes: parsed.data.notes
    });
    return created({ block }, { message: 'Horario bloqueado.' });
  } catch (error) {
    logError('schedule.blocks.post', error);
    const detail = error instanceof Error ? error.message : 'No se pudo bloquear el horario.';
    return fail(detail, 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;

  const params = {
    clinicId: context.url.searchParams.get('clinicId') ?? undefined,
    id: context.url.searchParams.get('id') ?? undefined,
    blockGroupId: context.url.searchParams.get('blockGroupId') ?? undefined
  };
  const parsed = scheduleBlockDeleteSchema.safeParse(params);
  if (!parsed.success) return fail('Parámetros de eliminación inválidos.', 422, parsed.error.flatten());

  const clinicId = parsed.data.clinicId ?? gate.user.clinicId;
  if (!clinicId) return fail('Indica la sede.', 422);

  const scopeGate = await requireClinicSessionAsync(context, clinicId);
  if (scopeGate.response) return scopeGate.response;

  try {
    if (parsed.data.blockGroupId) {
      const removed = await deleteScheduleBlockGroup(clinicId, parsed.data.blockGroupId);
      return ok({ removed }, { message: removed ? 'Bloqueos eliminados.' : 'No había bloqueos en el grupo.' });
    }
    if (!parsed.data.id) return fail('Falta el id del bloqueo.', 422);
    await deleteScheduleBlock(clinicId, parsed.data.id);
    return ok({ removed: 1 }, { message: 'Bloqueo eliminado.' });
  } catch (error) {
    logError('schedule.blocks.delete', error);
    return fail('No se pudo quitar el bloqueo.', 500);
  }
};
