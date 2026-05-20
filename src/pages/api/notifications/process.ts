import type { APIRoute } from 'astro';
import { requireSession } from '@/lib/api/guards';
import { fail, ok } from '@/lib/http';
import { processNotificationQueue } from '@/lib/notifications/queue';
import { z } from 'zod';

export const prerender = false;

const processSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20)
});

export const POST: APIRoute = async (context) => {
  try {
    const gate = requireSession(context);
    if (gate.response) return gate.response;
    if (gate.user.role !== 'admin' && gate.user.role !== 'super_admin') {
      return fail('Solo staff puede procesar la cola de notificaciones.', 403);
    }

    const payload = await context.request.json().catch(() => ({}));
    const parsed = processSchema.safeParse(payload);
    if (!parsed.success) return fail('Payload inválido.', 422, parsed.error.flatten());

    const data = await processNotificationQueue(parsed.data.limit);
    return ok(data, { message: `Cola procesada: ${data.sent} enviados, ${data.failed} fallidos.` });
  } catch (error) {
    return fail('No se pudo procesar la cola.', 500, error instanceof Error ? error.message : error);
  }
};
