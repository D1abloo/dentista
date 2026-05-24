import type { APIRoute } from 'astro';
import {
  assertClinicScopeAsync,
  assertOwnPatient,
  isPatientSession,
  requireSession,
  requireStaffSession
} from '@/lib/api/guards';
import { created, fail } from '@/lib/http';
import { createPaymentRecord } from '@/lib/services/billing';
import { z } from 'zod';

export const prerender = false;

const paymentCreateSchema = z.object({
  clinicId: z.string().min(1),
  patientId: z.string().min(1),
  invoiceId: z.string().min(1).optional(),
  amount: z.number().positive(),
  provider: z.string().max(40).default('manual'),
  status: z.enum(['completado', 'pendiente', 'fallido']).default('completado')
});

export const POST: APIRoute = async (context) => {
  try {
    const gate = requireSession(context);
    if (gate.response) return gate.response;
    const payload = await context.request.json();
    const parsed = paymentCreateSchema.safeParse(payload);
    if (!parsed.success) return fail('Pago inválido.', 422, parsed.error.flatten());

    const scopeErr = await assertClinicScopeAsync(gate.user, parsed.data.clinicId);
    if (scopeErr) return scopeErr;

    if (isPatientSession(gate.user)) {
      const ownErr = assertOwnPatient(gate.user, parsed.data.patientId);
      if (ownErr) return ownErr;
    } else {
      const staffGate = await requireStaffSession(context);
      if (staffGate.response) return staffGate.response;
    }

    const data = await createPaymentRecord(parsed.data);
    return created(data, { message: 'Pago registrado en Supabase.' });
  } catch (error) {
    return fail('No se pudo registrar el pago.', 500, error instanceof Error ? error.message : error);
  }
};
