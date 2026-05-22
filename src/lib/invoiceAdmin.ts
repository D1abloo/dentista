import type { DemoState, Invoice, InvoiceLine, InvoiceStatus } from '@/types/demo';
import { patientName } from '@/lib/selectors';
import { todayIso } from '@/lib/format';

export type InvoiceFilter =
  | 'todas'
  | 'pendiente'
  | 'pagada'
  | 'vencida'
  | 'borrador'
  | 'enviada'
  | 'con_pdf'
  | 'sin_pdf';

export type InvoiceSort = 'vencimiento' | 'emision' | 'importe' | 'paciente' | 'estado';

export function formatNhcDisplay(nhc?: string) {
  if (!nhc) return '—';
  const n = String(nhc).replace(/\D/g, '');
  return `NHC ${n.padStart(4, '0')}`;
}

export function displayInvoiceId(invoice: Invoice): string {
  if (/^FAC-\d{4}-\d+$/.test(invoice.id)) return invoice.id;
  const year = invoice.issuedAt.slice(0, 4) || String(new Date().getFullYear());
  const legacy = invoice.id.match(/^FAC-(\d+)$/i);
  const num = legacy ? legacy[1] : invoice.id.replace(/\D/g, '') || '1';
  return `FAC-${year}-${num.padStart(4, '0')}`;
}

export function formatDocDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!d) return iso;
  return `${d}/${m}/${y}`;
}

export function patientLine(state: DemoState, patientId: string): string {
  const p = state.patients.find((x) => x.id === patientId);
  const name = patientName(state, patientId);
  return p?.nhc ? `${name} · ${formatNhcDisplay(p.nhc)}` : name;
}

export function effectiveStatus(invoice: Invoice, today = todayIso()): InvoiceStatus {
  if (invoice.status === 'pendiente' && invoice.dueDate && invoice.dueDate < today) return 'vencida';
  return invoice.status;
}

export function statusLabel(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = {
    pendiente: 'Pendiente',
    pagada: 'Pagada',
    vencida: 'Vencida',
    cancelada: 'Cancelada'
  };
  return map[status] ?? status;
}

export function isDraft(invoice: Invoice): boolean {
  return invoice.status === 'cancelada' || (!invoice.fileRef && invoice.status === 'pendiente' && !invoice.sentAt);
}

export function calcLineTotal(line: InvoiceLine): number {
  const base = line.quantity * line.unitPrice;
  return base + base * (line.taxPercent / 100);
}

export function calcInvoiceTotals(lines: InvoiceLine[], discount = 0) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const tax = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (l.taxPercent / 100), 0);
  const total = Math.max(0, subtotal + tax - discount);
  return { subtotal, tax, discount, total };
}

export function invoiceMatchesSearch(state: DemoState, inv: Invoice, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const patient = state.patients.find((p) => p.id === inv.patientId);
  return (
    displayInvoiceId(inv).toLowerCase().includes(q) ||
    inv.id.toLowerCase().includes(q) ||
    inv.concept.toLowerCase().includes(q) ||
    String(inv.amount).includes(q) ||
    patientName(state, inv.patientId).toLowerCase().includes(q) ||
    (patient?.dni?.toLowerCase().includes(q) ?? false) ||
    formatNhcDisplay(patient?.nhc).toLowerCase().includes(q)
  );
}

export function filterInvoices(
  invoices: Invoice[],
  state: DemoState,
  filter: InvoiceFilter,
  search: string,
  today = todayIso()
): Invoice[] {
  let list = [...invoices];
  if (search.trim()) list = list.filter((i) => invoiceMatchesSearch(state, i, search));

  switch (filter) {
    case 'pendiente':
      list = list.filter((i) => effectiveStatus(i, today) === 'pendiente');
      break;
    case 'pagada':
      list = list.filter((i) => effectiveStatus(i, today) === 'pagada');
      break;
    case 'vencida':
      list = list.filter((i) => effectiveStatus(i, today) === 'vencida');
      break;
    case 'borrador':
      list = list.filter(isDraft);
      break;
    case 'enviada':
      list = list.filter((i) => Boolean(i.sentAt));
      break;
    case 'con_pdf':
      list = list.filter((i) => Boolean(i.fileRef));
      break;
    case 'sin_pdf':
      list = list.filter((i) => !i.fileRef);
      break;
    default:
      break;
  }
  return list;
}

export function sortInvoices(
  invoices: Invoice[],
  state: DemoState,
  sort: InvoiceSort,
  today = todayIso()
): Invoice[] {
  const sorted = [...invoices];
  if (sort === 'emision') sorted.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  else if (sort === 'importe') sorted.sort((a, b) => b.amount - a.amount);
  else if (sort === 'paciente')
    sorted.sort((a, b) => patientName(state, a.patientId).localeCompare(patientName(state, b.patientId), 'es'));
  else if (sort === 'estado')
    sorted.sort((a, b) => effectiveStatus(a, today).localeCompare(effectiveStatus(b, today), 'es'));
  else
    sorted.sort((a, b) => (b.dueDate ?? b.issuedAt).localeCompare(a.dueDate ?? a.issuedAt));
  return sorted;
}

export function computeInvoiceKpis(invoices: Invoice[], today = todayIso()) {
  const month = today.slice(0, 7);
  const prev = new Date(today);
  prev.setMonth(prev.getMonth() - 1);
  const prevMonth = prev.toISOString().slice(0, 7);

  const active = invoices.filter((i) => i.status !== 'cancelada');
  const thisMonth = active.filter((i) => i.issuedAt.startsWith(month));
  const lastMonth = active.filter((i) => i.issuedAt.startsWith(prevMonth));
  const billed = thisMonth.reduce((s, i) => s + i.amount, 0);
  const billedPrev = lastMonth.reduce((s, i) => s + i.amount, 0);
  const trendPct = billedPrev > 0 ? Math.round(((billed - billedPrev) / billedPrev) * 100) : billed > 0 ? 100 : 0;

  const pending = active.filter((i) => effectiveStatus(i, today) === 'pendiente');
  const overdue = active.filter((i) => effectiveStatus(i, today) === 'vencida');
  const paid = active.filter((i) => effectiveStatus(i, today) === 'pagada');

  return {
    billed,
    trendPct,
    pendingAmount: pending.reduce((s, i) => s + i.amount, 0),
    pendingCount: pending.length,
    overdueCount: overdue.length,
    paidCount: paid.length,
    paidPct: active.length ? Math.round((paid.length / active.length) * 100) : 0,
    avgAmount: active.length ? active.reduce((s, i) => s + i.amount, 0) / active.length : 0
  };
}

export function reminderSummary(invoices: Invoice[], today = todayIso()) {
  const overdue = invoices.filter((i) => effectiveStatus(i, today) === 'vencida');
  const soon = invoices.filter((i) => {
    if (effectiveStatus(i, today) !== 'pendiente' || !i.dueDate) return false;
    const due = new Date(i.dueDate);
    const now = new Date(today);
    const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  });
  return { overdue, soon };
}
