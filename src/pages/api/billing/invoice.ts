import type { APIRoute } from 'astro';
import { assertClinicScope, requireSession } from '@/lib/api/guards';
import { created, fail } from '@/lib/http';
import { createInvoiceRecord } from '@/lib/services/billing';
import { z } from 'zod';

export const prerender = false;

const invoiceCreateSchema = z.object({
  clinicId: z.string().uuid(),
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  amount: z.number().positive(),
  concept: z.string().min(2).max(200),
  status: z.enum(['pendiente', 'pagada', 'vencida', 'cancelada']).default('pendiente'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const POST: APIRoute = async (context) => {
  try {
    const gate = requireSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = invoiceCreateSchema.safeParse(payload);
    if (!parsed.success) return fail('Factura inválida.', 422, parsed.error.flatten());
    const scopeErr = assertClinicScope(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;
    const data = await createInvoiceRecord(parsed.data);
    return created(data, { message: 'Factura guardada en Supabase.' });
  } catch (error) {
    return fail('No se pudo crear la factura.', 500, error instanceof Error ? error.message : error);
  }
};
