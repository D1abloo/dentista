import type { DemoState, Message } from '@/types/demo';
import { fmtDate } from '@/lib/format';
import { downloadDemoFileRef } from '@/lib/demoFiles';
import { displayInvoiceId } from '@/lib/invoiceAdmin';
import { downloadPatientInvoicePdf } from '@/lib/patient/invoicesData';

export type MessageDisplayType =
  | 'recordatorio'
  | 'confirmacion'
  | 'clinica'
  | 'factura'
  | 'documento'
  | 'general';

export type PatientMessageView = {
  message: Message;
  clinicName: string;
  dateLabel: string;
  typeLabel: string;
  displayType: MessageDisplayType;
  preview: string;
  relatedLabel: string;
  relatedHref: string | null;
  canDownloadPdf: boolean;
  statusReadLabel: string;
};

const TYPE_LABELS: Record<MessageDisplayType, string> = {
  recordatorio: 'Recordatorio',
  confirmacion: 'Confirmación',
  clinica: 'Clínica',
  factura: 'Factura',
  documento: 'Documento',
  general: 'General'
};

export function formatMessageDate(iso: string): string {
  const d = new Date(iso.length > 10 ? iso : `${iso}T12:00:00`);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Hoy, ${time}`;
  if (isYesterday) return `Ayer, ${time}`;
  return fmtDate(iso.slice(0, 10));
}

function clinicName(state: DemoState, tenantId: string) {
  return state.clinics.find((c) => c.tenantId === tenantId)?.name ?? 'Clínica';
}

function resolveDisplayType(msg: Message): MessageDisplayType {
  if (msg.type === 'factura' || msg.invoiceId) return 'factura';
  if (msg.type === 'documento' || msg.documentId) return 'documento';
  if (msg.type === 'confirmacion') return 'confirmacion';
  if (msg.type === 'recordatorio') return 'recordatorio';
  if (msg.type === 'clinica') return 'clinica';
  return 'general';
}

function relatedResource(state: DemoState, msg: Message): { label: string; href: string | null } {
  if (msg.appointmentId) {
    const a = state.appointments.find((x) => x.id === msg.appointmentId);
    if (a) return { label: `Cita · ${fmtDate(a.date)} · ${a.time}`, href: `/paciente/citas` };
  }
  if (msg.invoiceId) {
    const inv = state.invoices.find((i) => i.id === msg.invoiceId);
    return {
      label: `Factura · ${inv ? displayInvoiceId(inv) : msg.invoiceId}`,
      href: `/paciente/facturas?factura=${encodeURIComponent(msg.invoiceId)}`
    };
  }
  if (msg.documentId) {
    const doc = state.patientDocuments.find((d) => d.id === msg.documentId);
    const href = doc?.appointmentId
      ? `/paciente/documentos?cita=${encodeURIComponent(doc.appointmentId)}`
      : '/paciente/documentos';
    return {
      label: `Documento · ${doc?.title ?? msg.documentId}`,
      href
    };
  }
  return { label: '—', href: null };
}

export function visibleMessagesForPatient(state: DemoState, patientId: string): Message[] {
  return state.messages.filter((m) => m.patientId === patientId && !m.archived);
}

export function enrichPatientMessages(state: DemoState, messages: Message[]): PatientMessageView[] {
  return messages.map((message) => {
    const displayType = resolveDisplayType(message);
    const related = relatedResource(state, message);
    const inv = message.invoiceId ? state.invoices.find((i) => i.id === message.invoiceId) : undefined;
    const doc = message.documentId
      ? state.patientDocuments.find((d) => d.id === message.documentId)
      : undefined;
    const hasPdf =
      Boolean(inv?.fileRef) || Boolean(doc?.fileRef && doc.fileName?.toLowerCase().endsWith('.pdf'));
    return {
      message,
      clinicName: clinicName(state, message.tenantId),
      dateLabel: formatMessageDate(message.sentAt),
      typeLabel: TYPE_LABELS[displayType],
      displayType,
      preview: message.body.length > 120 ? `${message.body.slice(0, 117)}…` : message.body,
      relatedLabel: related.label,
      relatedHref: related.href,
      canDownloadPdf: hasPdf,
      statusReadLabel: message.read ? 'Leído' : 'No leído'
    };
  });
}

export function buildMessageKpis(messages: Message[]) {
  const unread = messages.filter((m) => !m.read && !m.fromPatient);
  return {
    total: messages.length,
    unread: unread.length,
    recordatorios: messages.filter((m) => resolveDisplayType(m) === 'recordatorio').length,
    confirmaciones: messages.filter((m) => resolveDisplayType(m) === 'confirmacion').length,
    clinica: messages.filter((m) => resolveDisplayType(m) === 'clinica' || m.type === 'general').length
  };
}

export type MessageChip =
  | 'all'
  | 'unread'
  | 'recordatorio'
  | 'confirmacion'
  | 'clinica'
  | 'factura'
  | 'documento'
  | 'citas'
  | 'important'
  | '30d';

export type PatientMessageSort = 'recent' | 'oldest';

function isRecent(iso: string, days: number) {
  const t = new Date(iso.length > 10 ? iso : `${iso}T12:00:00`).getTime();
  return t >= Date.now() - days * 86400000;
}

export function filterAndSortMessages(
  views: PatientMessageView[],
  opts: { q: string; chip: MessageChip; sort: PatientMessageSort }
): PatientMessageView[] {
  let list = [...views];
  const s = opts.q.trim().toLowerCase();
  if (s) {
    list = list.filter(
      (v) =>
        v.message.subject.toLowerCase().includes(s) ||
        v.message.body.toLowerCase().includes(s) ||
        v.clinicName.toLowerCase().includes(s) ||
        v.relatedLabel.toLowerCase().includes(s) ||
        v.typeLabel.toLowerCase().includes(s)
    );
  }
  if (opts.chip === 'unread') list = list.filter((v) => !v.message.read);
  if (opts.chip === 'recordatorio') list = list.filter((v) => v.displayType === 'recordatorio');
  if (opts.chip === 'confirmacion') list = list.filter((v) => v.displayType === 'confirmacion');
  if (opts.chip === 'clinica') {
    list = list.filter((v) => v.displayType === 'clinica' || v.message.type === 'general');
  }
  if (opts.chip === 'factura') list = list.filter((v) => v.displayType === 'factura');
  if (opts.chip === 'documento') list = list.filter((v) => v.displayType === 'documento');
  if (opts.chip === 'citas') {
    list = list.filter((v) => Boolean(v.message.appointmentId) || v.displayType === 'confirmacion');
  }
  if (opts.chip === 'important') list = list.filter((v) => v.message.important);
  if (opts.chip === '30d') list = list.filter((v) => isRecent(v.message.sentAt, 30));

  if (opts.sort === 'oldest') {
    list.sort((a, b) => a.message.sentAt.localeCompare(b.message.sentAt));
  } else {
    list.sort((a, b) => b.message.sentAt.localeCompare(a.message.sentAt));
  }
  return list;
}

export function appointmentLink(_appointmentId: string) {
  return `/paciente/citas`;
}

export function documentLink(state: DemoState, documentId: string) {
  const doc = state.patientDocuments.find((d) => d.id === documentId);
  if (doc?.appointmentId) return `/paciente/documentos?cita=${encodeURIComponent(doc.appointmentId)}`;
  return '/paciente/documentos';
}

export async function downloadMessagePdf(state: DemoState, v: PatientMessageView): Promise<boolean> {
  if (v.message.invoiceId) {
    const inv = state.invoices.find((i) => i.id === v.message.invoiceId);
    if (inv) return downloadPatientInvoicePdf(state, inv);
  }
  if (v.message.documentId) {
    const doc = state.patientDocuments.find((d) => d.id === v.message.documentId);
    if (doc?.fileRef) return downloadDemoFileRef(doc.fileRef, doc.fileName ?? `${doc.id}.pdf`);
  }
  return false;
}

export const REPLY_TEMPLATES = [
  'Necesito cambiar mi cita',
  'Tengo una duda sobre mi factura',
  'Quiero más información',
  'Confirmo asistencia'
] as const;

export const MAX_ATTACHMENT_BYTES = 4_500_000;

export const ALLOWED_ATTACHMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain'
];
