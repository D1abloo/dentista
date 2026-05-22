import type { DemoState, Payment, PaymentMethod, PaymentStatus } from '@/types/demo';
import { patientName } from '@/lib/selectors';
import { displayInvoiceId } from '@/lib/invoiceAdmin';
import { todayIso, money } from '@/lib/format';

export type PaymentFilter =
  | 'todos'
  | 'completado'
  | 'pendiente'
  | 'fallido'
  | 'tarjeta'
  | 'efectivo'
  | 'transferencia'
  | 'seguro'
  | 'otro';

export type PaymentSort = 'fecha' | 'importe' | 'paciente' | 'estado';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  seguro: 'Seguro',
  otro: 'Otro'
};

export function paymentMethodLabel(m: PaymentMethod) {
  return METHOD_LABELS[m] ?? m;
}

export function paymentStatusLabel(s: PaymentStatus) {
  const map: Record<PaymentStatus, string> = {
    completado: 'Completado',
    pendiente: 'Pendiente',
    fallido: 'Fallido',
    reembolsado: 'Reembolsado'
  };
  return map[s] ?? s;
}

export function displayPaymentId(p: Payment): string {
  if (/^PAG-\d{4}-\d+$/i.test(p.id)) return p.id;
  const year = (p.paidAt ?? p.createdAt).slice(0, 4) || String(new Date().getFullYear());
  const n = p.id.replace(/\D/g, '') || '1';
  return `PAG-${year}-${n.padStart(4, '0')}`;
}

export function formatNhcDisplay(nhc?: string) {
  if (!nhc) return '—';
  const n = String(nhc).replace(/\D/g, '');
  return `NHC ${n.padStart(4, '0')}`;
}

export function patientLine(state: DemoState, patientId: string): string {
  const p = state.patients.find((x) => x.id === patientId);
  const name = patientName(state, patientId);
  return p?.nhc ? `${name} · ${formatNhcDisplay(p.nhc)}` : name;
}

export function formatPayDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!d) return iso;
  return `${d}/${m}/${y}`;
}

export function formatPayTime(iso: string): string {
  if (iso.length < 16) return 'Hoy';
  const d = new Date(iso);
  const now = new Date();
  const same =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (same) {
    return `Hoy, ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function paymentMatchesSearch(state: DemoState, p: Payment, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const patient = state.patients.find((x) => x.id === p.patientId);
  const inv = p.invoiceId ? state.invoices.find((i) => i.id === p.invoiceId) : undefined;
  return (
    displayPaymentId(p).toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q) ||
    patientName(state, p.patientId).toLowerCase().includes(q) ||
    (patient?.dni?.toLowerCase().includes(q) ?? false) ||
    (patient?.nhc?.includes(q) ?? false) ||
    (p.invoiceId?.toLowerCase().includes(q) ?? false) ||
    (inv ? displayInvoiceId(inv).toLowerCase().includes(q) : false) ||
    String(p.amount).includes(q)
  );
}

export function filterPayments(
  payments: Payment[],
  state: DemoState,
  filter: PaymentFilter,
  query: string
): Payment[] {
  return payments.filter((p) => {
    if (!paymentMatchesSearch(state, p, query)) return false;
    if (filter === 'todos') return true;
    if (filter === 'completado' || filter === 'pendiente' || filter === 'fallido') {
      return p.status === filter;
    }
    return p.method === filter;
  });
}

export function sortPayments(list: Payment[], state: DemoState, sort: PaymentSort): Payment[] {
  const copy = [...list];
  copy.sort((a, b) => {
    if (sort === 'importe') return b.amount - a.amount;
    if (sort === 'paciente') return patientName(state, a.patientId).localeCompare(patientName(state, b.patientId));
    if (sort === 'estado') return a.status.localeCompare(b.status);
    const da = a.paidAt ?? a.createdAt;
    const db = b.paidAt ?? b.createdAt;
    return db.localeCompare(da);
  });
  return copy;
}

export function computePaymentKpis(payments: Payment[], today = todayIso()) {
  const month = today.slice(0, 7);
  const monthPayments = payments.filter((p) => (p.paidAt ?? p.createdAt).startsWith(month));
  const completed = payments.filter((p) => p.status === 'completado');
  const pending = payments.filter((p) => p.status === 'pendiente');
  const failed = payments.filter((p) => p.status === 'fallido');
  const todaySum = payments
    .filter((p) => p.status === 'completado' && (p.paidAt ?? p.createdAt).startsWith(today))
    .reduce((s, p) => s + p.amount, 0);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekSum = completed
    .filter((p) => new Date(p.paidAt ?? p.createdAt) >= weekStart)
    .reduce((s, p) => s + p.amount, 0);
  const pendingAmount = pending.reduce((s, p) => s + p.amount, 0);
  const methodCounts: Record<string, number> = {};
  completed.forEach((p) => {
    methodCounts[p.method] = (methodCounts[p.method] ?? 0) + 1;
  });
  const topMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0];
  return {
    monthTotal: monthPayments.filter((p) => p.status === 'completado').reduce((s, p) => s + p.amount, 0),
    pendingCount: pending.length,
    pendingAmount,
    failedCount: failed.length,
    completedCount: completed.length,
    todaySum,
    weekSum,
    avgAmount: completed.length ? completed.reduce((s, p) => s + p.amount, 0) / completed.length : 0,
    topMethod: topMethod ? paymentMethodLabel(topMethod[0] as PaymentMethod) : '—',
    methodCounts
  };
}

export function invoiceLabel(state: DemoState, invoiceId?: string) {
  if (!invoiceId) return 'Sin factura';
  const inv = state.invoices.find((i) => i.id === invoiceId);
  return inv ? displayInvoiceId(inv) : invoiceId;
}
