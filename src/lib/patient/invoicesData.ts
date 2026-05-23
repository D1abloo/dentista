import type { DemoState, Invoice, InvoiceStatus, Payment } from '@/types/demo';
import { fmtDate, money } from '@/lib/format';
import { downloadDemoFileRef, isPdfMime } from '@/lib/demoFiles';
import { generateInvoicePdfFile } from '@/lib/pdfInvoice';
import { getPatientById, visibleInvoicesForPatient } from '@/lib/selectors';
import { getStoredTenantId, settingsFor } from '@/lib/demoStore';
import { displayInvoiceId, effectiveStatus, statusLabel } from '@/lib/invoiceAdmin';

export type PatientInvoiceView = {
  invoice: Invoice;
  displayId: string;
  clinicId: string;
  clinicName: string;
  concept: string;
  issuedLabel: string;
  dueLabel: string;
  amountLabel: string;
  effectiveStatus: InvoiceStatus;
  statusText: string;
  hasPdf: boolean;
  pdfLabel: string;
  payment: Payment | null;
  paymentLabel: string;
  previewUrl: string | null;
  canPay: boolean;
};

function clinicForInvoice(state: DemoState, inv: Invoice) {
  const appt = inv.appointmentId ? state.appointments.find((a) => a.id === inv.appointmentId) : undefined;
  const clinicId = appt?.clinicId ?? state.clinics.find((c) => c.tenantId === inv.tenantId)?.id ?? '';
  const clinic = state.clinics.find((c) => c.id === clinicId);
  return { clinicId, clinicName: clinic?.name ?? 'Clínica' };
}

function paymentForInvoice(state: DemoState, inv: Invoice): Payment | null {
  return (
    state.payments.find(
      (p) => p.invoiceId === inv.id && p.patientId === inv.patientId && p.status === 'completado'
    ) ?? null
  );
}

export function enrichPatientInvoices(
  state: DemoState,
  patientId: string,
  invoices: Invoice[],
  resolveUrl: (fileRef: string) => string | null
): PatientInvoiceView[] {
  return invoices.map((invoice) => {
    const { clinicId, clinicName } = clinicForInvoice(state, invoice);
    const eff = effectiveStatus(invoice);
    const payment = paymentForInvoice(state, invoice);
    const hasPdf = Boolean(invoice.fileRef && isPdfMime(invoice.mimeType, invoice.fileName ?? invoice.fileRef));
    return {
      invoice,
      displayId: displayInvoiceId(invoice),
      clinicId,
      clinicName,
      concept: invoice.concept,
      issuedLabel: fmtDate(invoice.issuedAt),
      dueLabel: invoice.dueDate ? fmtDate(invoice.dueDate) : '—',
      amountLabel: money(invoice.amount),
      effectiveStatus: eff,
      statusText: statusLabel(eff),
      hasPdf,
      pdfLabel: hasPdf ? 'Disponible' : 'No disponible',
      payment,
      paymentLabel: payment ? payment.id : 'Sin pago registrado',
      previewUrl: invoice.fileRef ? resolveUrl(invoice.fileRef) : null,
      canPay: eff === 'pendiente' || eff === 'vencida'
    };
  });
}

export function buildInvoiceKpis(state: DemoState, patientId: string, views: PatientInvoiceView[]) {
  const pending = views.filter((v) => v.effectiveStatus === 'pendiente' || v.effectiveStatus === 'vencida');
  const paid = views.filter((v) => v.effectiveStatus === 'pagada');
  const payments = state.payments.filter((p) => p.patientId === patientId && p.status === 'completado');
  const sorted = [...views].sort((a, b) => b.invoice.issuedAt.localeCompare(a.invoice.issuedAt));
  return {
    available: views.length,
    pendingAmount: pending.reduce((s, v) => s + v.invoice.amount, 0),
    paidCount: paid.length,
    lastInvoice: sorted[0]?.displayId ?? '—',
    paymentsCount: payments.length
  };
}

export type InvoiceChip = 'all' | 'pendiente' | 'pagada' | 'vencida' | 'pdf' | '30d';

export type PatientInvoiceSort = 'recent' | 'oldest' | 'amount' | 'due';

function isRecent(iso: string, days: number) {
  return new Date(iso).getTime() >= Date.now() - days * 86400000;
}

export function filterAndSortInvoices(
  views: PatientInvoiceView[],
  opts: { q: string; chip: InvoiceChip; sort: PatientInvoiceSort }
): PatientInvoiceView[] {
  let list = [...views];
  const s = opts.q.trim().toLowerCase();
  if (s) {
    list = list.filter(
      (v) =>
        v.displayId.toLowerCase().includes(s) ||
        v.concept.toLowerCase().includes(s) ||
        v.clinicName.toLowerCase().includes(s) ||
        v.issuedLabel.includes(s) ||
        v.dueLabel.includes(s) ||
        v.amountLabel.toLowerCase().includes(s) ||
        v.invoice.amount.toString().includes(s)
    );
  }
  if (opts.chip === 'pendiente') list = list.filter((v) => v.effectiveStatus === 'pendiente');
  if (opts.chip === 'pagada') list = list.filter((v) => v.effectiveStatus === 'pagada');
  if (opts.chip === 'vencida') list = list.filter((v) => v.effectiveStatus === 'vencida');
  if (opts.chip === 'pdf') list = list.filter((v) => v.hasPdf);
  if (opts.chip === '30d') list = list.filter((v) => isRecent(v.invoice.issuedAt, 30));

  if (opts.sort === 'oldest') list.sort((a, b) => a.invoice.issuedAt.localeCompare(b.invoice.issuedAt));
  else if (opts.sort === 'amount') list.sort((a, b) => b.invoice.amount - a.invoice.amount);
  else if (opts.sort === 'due') {
    list.sort((a, b) => (a.invoice.dueDate ?? a.invoice.issuedAt).localeCompare(b.invoice.dueDate ?? b.invoice.issuedAt));
  } else list.sort((a, b) => b.invoice.issuedAt.localeCompare(a.invoice.issuedAt));

  return list;
}

export async function downloadPatientInvoicePdf(state: DemoState, invoice: Invoice): Promise<boolean> {
  if (invoice.fileRef && downloadDemoFileRef(invoice.fileRef, invoice.fileName ?? `${invoice.id}.pdf`)) return true;
  const patient = getPatientById(state, invoice.patientId);
  if (!patient) return false;
  const settings = settingsFor(state, getStoredTenantId());
  const gen = await generateInvoicePdfFile(invoice, patient, settings);
  return downloadDemoFileRef(gen.fileRef, gen.fileName);
}

export function paymentsLinkForInvoice(invoiceId: string) {
  return `/paciente/pagos?factura=${encodeURIComponent(invoiceId)}`;
}

export function messagesWithInvoiceContext(displayId: string, concept: string) {
  return `/paciente/mensajes?contexto=${encodeURIComponent(`Consulta sobre factura ${displayId}: ${concept}`)}`;
}

export { visibleInvoicesForPatient };
