import type { APIRoute } from 'astro';
import { assertClinicScopeAsync, requireStaffSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { markPatientMessagesReadForClinic } from '@/lib/services/messageRead';
import { z } from 'zod';

export const prerender = false;

const schema = z.object({
  clinicId: z.string().uuid(),
  messageIds: z.array(z.string().uuid()).min(1).max(100)
});

export const PATCH: APIRoute = async (context) => {
  try {
    const gate = await requireStaffSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = schema.safeParse(payload);
    if (!parsed.success) return fail('Datos inválidos.', 422, parsed.error.flatten());
    const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;
    await markPatientMessagesReadForClinic(parsed.data.clinicId, parsed.data.messageIds);
    return ok({ updated: parsed.data.messageIds.length });
  } catch (error) {
    return fail('No se pudieron marcar los mensajes.', 500, error instanceof Error ? error.message : error);
  }
};
