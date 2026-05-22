import type { APIRoute } from 'astro';
import { requireStaffSession } from '@/lib/api/guards';
import { fail, ok, created } from '@/lib/http';
import { logError } from '@/lib/logger';
import {
  createScheduleBlock,
  deleteScheduleBlock,
  listScheduleBlocks
} from '@/lib/services/scheduleBlocks';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { scheduleBlockCreateSchema } from '@/lib/validators';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

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
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

  try {
    const body = await context.request.json();
    const parsed = scheduleBlockCreateSchema.safeParse({ ...body, clinicId });
    if (!parsed.success) return fail('Datos de bloqueo inválidos.', 422, parsed.error.flatten());

    const block = await createScheduleBlock({
      clinicId,
      tenantId: gate.user.tenantId ?? undefined,
      dentistId: parsed.data.dentistId,
      date: parsed.data.date,
      time: parsed.data.time,
      reason: parsed.data.reason,
      durationMinutes: parsed.data.durationMinutes
    });
    return created({ block }, { message: 'Horario bloqueado.' });
  } catch (error) {
    logError('schedule.blocks.post', error);
    return fail('No se pudo bloquear el horario.', 500);
  }
};

export const DELETE: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = requireStaffSession(context);
  if (gate.response) return gate.response;
  const clinicId = gate.user.clinicId;
  if (!clinicId) return fail('Sesión sin clínica.', 403);

  const blockId = context.url.searchParams.get('id');
  if (!blockId) return fail('Falta el id del bloqueo.', 422);

  try {
    await deleteScheduleBlock(clinicId, blockId);
    return ok({ removed: true }, { message: 'Bloqueo eliminado.' });
  } catch (error) {
    logError('schedule.blocks.delete', error);
    return fail('No se pudo quitar el bloqueo.', 500);
  }
};
