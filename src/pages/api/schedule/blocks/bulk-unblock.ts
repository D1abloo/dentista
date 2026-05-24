import type { APIRoute } from 'astro';
import { requireClinicSessionAsync, requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { logError } from '@/lib/logger';
import { deleteScheduleBlocksInRange } from '@/lib/services/scheduleBlocks';
import { hasSupabaseConfig } from '@/lib/supabaseServer';
import { scheduleBlockBulkUnblockSchema } from '@/lib/validators';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  if (!hasSupabaseConfig()) return fail('Servicio no disponible.', 503);
  const gate = await requireStaffSession(context);
  if (gate.response) return gate.response;

  try {
    const body = await context.request.json();
    const parsed = scheduleBlockBulkUnblockSchema.safeParse(body);
    if (!parsed.success) return fail('Parámetros de desbloqueo masivo inválidos.', 422, parsed.error.flatten());

    const clinicId = parsed.data.clinicId ?? gate.user.clinicId;
    if (!clinicId) return fail('Indica la sede.', 422);

    const scopeGate = await requireClinicSessionAsync(context, clinicId);
    if (scopeGate.response) return scopeGate.response;

    const removed = await deleteScheduleBlocksInRange(clinicId, {
      fromDate: parsed.data.fromDate,
      toDate: parsed.data.toDate,
      dentistId: parsed.data.scope === 'dentist' ? parsed.data.dentistId : undefined
    });

    if (!removed) return fail('No se encontraron bloqueos en el periodo indicado.', 404);

    const label =
      parsed.data.scope === 'dentist'
        ? `${removed} bloqueo${removed === 1 ? '' : 's'} del profesional eliminado${removed === 1 ? '' : 's'}.`
        : `${removed} bloqueo${removed === 1 ? '' : 's'} del periodo eliminado${removed === 1 ? '' : 's'}.`;

    return ok({ removed, scope: parsed.data.scope }, { message: label });
  } catch (error) {
    logError('schedule.blocks.bulk-unblock', error);
    return fail('No se pudo desbloquear el horario.', 500);
  }
};
