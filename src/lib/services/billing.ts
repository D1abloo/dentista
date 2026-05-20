import { getSupabaseAdmin, hasSupabaseConfig, isDemoMode } from '@/lib/supabaseServer';

export async function createInvoiceRecord(input: {
  clinicId: string;
  patientId: string;
  appointmentId?: string;
  amount: number;
  concept: string;
  status?: 'pendiente' | 'pagada' | 'vencida' | 'cancelada';
  dueDate?: string;
}) {
  if (isDemoMode() || !hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const amountCents = Math.round(input.amount * 100);
  const statusMap: Record<string, string> = {
    pendiente: 'issued',
    pagada: 'paid',
    vencida: 'overdue',
    cancelada: 'draft'
  };
  const { data, error } = await db
    .from('invoices')
    .insert({
      clinic_id: input.clinicId,
      patient_id: input.patientId,
      appointment_id: input.appointmentId ?? null,
      amount_cents: amountCents,
      status: statusMap[input.status ?? 'pendiente'] ?? 'issued',
      due_at: input.dueDate ? `${input.dueDate}T12:00:00Z` : null,
      concept: input.concept
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function markInvoicePaid(clinicId: string, invoiceId: string) {
  if (isDemoMode() || !hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('invoices')
    .update({ status: 'paid' })
    .eq('id', invoiceId)
    .eq('clinic_id', clinicId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function createPaymentRecord(input: {
  clinicId: string;
  patientId: string;
  invoiceId?: string;
  amount: number;
  provider?: string;
  status?: 'completado' | 'pendiente' | 'fallido';
}) {
  if (isDemoMode() || !hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const amountCents = Math.round(input.amount * 100);
  const statusMap: Record<string, string> = {
    completado: 'paid',
    pendiente: 'pending',
    fallido: 'failed'
  };
  const { data, error } = await db
    .from('payments')
    .insert({
      clinic_id: input.clinicId,
      patient_id: input.patientId,
      invoice_id: input.invoiceId ?? null,
      amount_cents: amountCents,
      provider: input.provider ?? 'manual',
      status: statusMap[input.status ?? 'completado'] ?? 'paid'
    })
    .select('*')
    .single();
  if (error) throw error;
  if (input.invoiceId && input.status !== 'pendiente' && input.status !== 'fallido') {
    await markInvoicePaid(input.clinicId, input.invoiceId);
  }
  return data;
}

export async function completeStripeCheckout(stripeSessionId: string) {
  if (isDemoMode() || !hasSupabaseConfig()) return null;
  const db = getSupabaseAdmin();
  const { data: session, error } = await db
    .from('stripe_checkout_sessions')
    .select('*')
    .eq('stripe_session_id', stripeSessionId)
    .maybeSingle();
  if (error || !session) return null;
  if (session.status === 'paid') return session;

  await db
    .from('stripe_checkout_sessions')
    .update({ status: 'paid', updated_at: new Date().toISOString() })
    .eq('id', session.id);

  if (session.invoice_id) {
    await markInvoicePaid(session.clinic_id, session.invoice_id);
  }

  await createPaymentRecord({
    clinicId: session.clinic_id,
    patientId: session.patient_id,
    invoiceId: session.invoice_id ?? undefined,
    amount: (session.amount_cents ?? 0) / 100,
    provider: 'stripe',
    status: 'completado'
  });

  return session;
}
