import type { DemoState, Payment, PaymentStatus } from '@/types/demo';
import { fmtDate, money } from '@/lib/format';
import { downloadDemoFileRef } from '@/lib/demoFiles';
import { displayInvoiceId } from '@/lib/invoiceAdmin';
import { displayPaymentId, paymentMethodLabel, paymentStatusLabel } from '@/lib/paymentAdmin';

export type PatientPaymentView = {
  payment: Payment;
  displayId: string;
  clinicId: string;
  clinicName: string;
  invoiceDisplayId: string;
  invoiceId: string | null;
  dateLabel: string;
  amountLabel: string;
  methodLabel: string;
  statusText: string;
  status: PaymentStatus;
  reference: string;
  hasReceipt: boolean;
  receiptLabel: string;
  canRetry: boolean;
  canDownloadReceipt: boolean;
};

function clinicForPayment(state: DemoState, payment: Payment) {
  const inv = payment.invoiceId ? state.invoices.find((i) => i.id === payment.invoiceId) : undefined;
  const appt = inv?.appointmentId ? state.appointments.find((a) => a.id === inv.appointmentId) : undefined;
  const clinicId = appt?.clinicId ?? state.clinics.find((c) => c.tenantId === payment.tenantId)?.id ?? '';
  const clinic = state.clinics.find((c) => c.id === clinicId);
  return { clinicId, clinicName: clinic?.name ?? 'Clínica' };
}

function txnReference(payment: Payment): string {
  const year = (payment.paidAt ?? payment.createdAt).slice(0, 4) || '2026';
  const n = payment.id.replace(/\D/g, '').padStart(4, '0').slice(-4);
  return `TXN-${year}-${n}`;
}

export function visiblePaymentsForPatient(state: DemoState, patientId: string): Payment[] {
  return state.payments.filter((p) => p.patientId === patientId);
}

export function enrichPatientPayments(state: DemoState, payments: Payment[]): PatientPaymentView[] {
  return payments.map((payment) => {
    const { clinicId, clinicName } = clinicForPayment(state, payment);
    const inv = payment.invoiceId ? state.invoices.find((i) => i.id === payment.invoiceId) : undefined;
    const hasReceipt = payment.status === 'completado';
    return {
      payment,
      displayId: displayPaymentId(payment),
      clinicId,
      clinicName,
      invoiceDisplayId: inv ? displayInvoiceId(inv) : '—',
      invoiceId: payment.invoiceId ?? null,
      dateLabel: fmtDate(payment.paidAt ?? payment.createdAt),
      amountLabel: money(payment.amount),
      methodLabel: paymentMethodLabel(payment.method),
      statusText: paymentStatusLabel(payment.status),
      status: payment.status,
      reference: txnReference(payment),
      hasReceipt,
      receiptLabel: hasReceipt ? 'Disponible' : 'No disponible',
      canRetry: payment.status === 'fallido' && Boolean(payment.invoiceId),
      canDownloadReceipt: hasReceipt
    };
  });
}

export function buildPaymentKpis(views: PatientPaymentView[]) {
  const completed = views.filter((v) => v.status === 'completado');
  const pending = views.filter((v) => v.status === 'pendiente');
  const sorted = [...views].sort((a, b) =>
    (b.payment.paidAt ?? b.payment.createdAt).localeCompare(a.payment.paidAt ?? a.payment.createdAt)
  );
  return {
    completedCount: completed.length,
    totalPaid: completed.reduce((s, v) => s + v.payment.amount, 0),
    pendingCount: pending.length,
    lastPayment: sorted[0]?.dateLabel ?? '—',
    receiptsAvailable: completed.filter((v) => v.hasReceipt).length
  };
}

export type PaymentChip =
  | 'all'
  | 'completado'
  | 'pendiente'
  | 'fallido'
  | 'tarjeta'
  | 'transferencia'
  | 'efectivo'
  | 'recibo';

export type PatientPaymentSort = 'recent' | 'oldest' | 'amount';

export function filterAndSortPayments(
  views: PatientPaymentView[],
  opts: { q: string; chip: PaymentChip; sort: PatientPaymentSort }
): PatientPaymentView[] {
  let list = [...views];
  const s = opts.q.trim().toLowerCase();
  if (s) {
    list = list.filter(
      (v) =>
        v.displayId.toLowerCase().includes(s) ||
        v.invoiceDisplayId.toLowerCase().includes(s) ||
        v.clinicName.toLowerCase().includes(s) ||
        v.dateLabel.includes(s) ||
        v.amountLabel.toLowerCase().includes(s) ||
        v.methodLabel.toLowerCase().includes(s) ||
        v.reference.toLowerCase().includes(s) ||
        v.payment.amount.toString().includes(s)
    );
  }
  if (opts.chip === 'completado' || opts.chip === 'pendiente' || opts.chip === 'fallido') {
    list = list.filter((v) => v.status === opts.chip);
  }
  if (opts.chip === 'tarjeta' || opts.chip === 'transferencia' || opts.chip === 'efectivo') {
    list = list.filter((v) => v.payment.method === opts.chip);
  }
  if (opts.chip === 'recibo') list = list.filter((v) => v.hasReceipt);

  if (opts.sort === 'oldest') {
    list.sort((a, b) =>
      (a.payment.paidAt ?? a.payment.createdAt).localeCompare(b.payment.paidAt ?? b.payment.createdAt)
    );
  } else if (opts.sort === 'amount') {
    list.sort((a, b) => b.payment.amount - a.payment.amount);
  } else {
    list.sort((a, b) =>
      (b.payment.paidAt ?? b.payment.createdAt).localeCompare(a.payment.paidAt ?? a.payment.createdAt)
    );
  }
  return list;
}

export function downloadPatientReceipt(v: PatientPaymentView): boolean {
  if (!v.canDownloadReceipt) return false;
  if (v.payment.receiptRef) {
    return downloadDemoFileRef(
      v.payment.receiptRef,
      v.payment.receiptFileName ?? `recibo-${v.displayId}.pdf`
    );
  }
  return downloadDemoFileRef(`recibo-${v.payment.id}`, `recibo-${v.displayId}.txt`);
}

export function invoiceLinkForPayment(invoiceId: string) {
  return `/paciente/facturas?factura=${encodeURIComponent(invoiceId)}`;
}

export function pendingInvoicesLink() {
  return '/paciente/facturas?filtro=pendiente';
}

export function messagesWithPaymentContext(displayId: string, invoiceLabel: string) {
  return `/paciente/mensajes?contexto=${encodeURIComponent(`Consulta sobre pago ${displayId} · factura ${invoiceLabel}`)}`;
}
