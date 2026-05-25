import type { Appointment, DemoState } from '@/types/demo';
import { fmtDate, statusLabel } from '@/lib/format';
import { displayInvoiceId } from '@/lib/invoiceAdmin';
import { displayPaymentId } from '@/lib/paymentAdmin';
import { visibleDocumentsForPatient, visibleReportsForPatient } from '@/lib/selectors';

export type RelatedTag = {
  id: string;
  label: string;
  tone: 'teal' | 'blue' | 'purple' | 'slate' | 'amber';
};

export type PatientVisitView = {
  appointment: Appointment;
  treatmentName: string;
  clinicName: string;
  dentistName: string;
  dateLabel: string;
  dayLabel: string;
  timeLabel: string;
  datetimeLabel: string;
  durationLabel: string;
  statusText: string;
  isRevision: boolean;
  recommendations: string;
  diagnosis: string;
  relatedTags: RelatedTag[];
  report: { id: string; title: string } | null;
  documents: { id: string; title: string }[];
  invoice: { id: string; displayId: string; pending: boolean } | null;
  payment: { id: string; displayId: string; statusText: string } | null;
  hasReport: boolean;
  hasInvoice: boolean;
  hasDocuments: boolean;
};

function dayLabel(date: string) {
  const d = new Date(`${date}T12:00:00`);
  const name = d.toLocaleDateString('es-ES', { weekday: 'long' });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function isRevisionTreatment(name: string) {
  return /revisión|revision|diagnóstico|diagnostico|consulta/i.test(name);
}

export function visibleCompletedVisitsForPatient(state: DemoState, patientId: string): Appointment[] {
  return state.appointments.filter((a) => a.patientId === patientId && a.status === 'completada');
}

function relatedForAppointment(state: DemoState, appt: Appointment, patientId: string) {
  const reports = visibleReportsForPatient(state, patientId).filter((r) => r.appointmentId === appt.id);
  const documents = visibleDocumentsForPatient(state, patientId).filter((d) => d.appointmentId === appt.id);
  const invoice = state.invoices.find((i) => i.patientId === patientId && i.appointmentId === appt.id);
  const payment = invoice
    ? state.payments.find((p) => p.patientId === patientId && p.invoiceId === invoice.id)
    : undefined;
  const report = reports[0] ?? null;
  const pendingInvoice = invoice && (invoice.status === 'pendiente' || invoice.status === 'vencida');
  return { report, documents, invoice, payment, pendingInvoice };
}

export function enrichPatientVisits(state: DemoState, patientId: string, appointments: Appointment[]): PatientVisitView[] {
  return appointments.map((appointment) => {
    const treatment = state.treatments.find((t) => t.id === appointment.treatmentId);
    const clinic = state.clinics.find((c) => c.id === appointment.clinicId);
    const dentist = state.dentists.find((d) => d.id === appointment.dentistId);
    const treatmentName = treatment?.name ?? 'Tratamiento';
    const { report, documents, invoice, payment, pendingInvoice } = relatedForAppointment(
      state,
      appointment,
      patientId
    );

    const tags: RelatedTag[] = [];
    if (report) tags.push({ id: 'report', label: 'Informe disponible', tone: 'teal' });
    if (invoice) {
      tags.push({
        id: 'invoice',
        label: pendingInvoice ? 'Factura pendiente' : 'Factura vinculada',
        tone: pendingInvoice ? 'amber' : 'blue'
      });
    } else if (!pendingInvoice) {
      tags.push({ id: 'no-inv', label: 'Sin factura pendiente', tone: 'slate' });
    }
    if (documents.length) tags.push({ id: 'docs', label: 'Documento asociado', tone: 'purple' });

    const recommendations =
      report?.recommendations?.trim() ||
      'Mantener higiene diaria y programar próxima revisión en 6 meses.';

    return {
      appointment,
      treatmentName,
      clinicName: clinic?.name ?? 'Clínica',
      dentistName: dentist?.fullName ?? 'Profesional',
      dateLabel: fmtDate(appointment.date),
      dayLabel: dayLabel(appointment.date),
      timeLabel: appointment.time,
      datetimeLabel: `${fmtDate(appointment.date)} · ${appointment.time}`,
      durationLabel: treatment ? `${treatment.durationMinutes} min` : '30 min',
      statusText: statusLabel(appointment.status),
      isRevision: isRevisionTreatment(treatmentName),
      recommendations,
      diagnosis: report?.diagnosis?.trim() || report?.description?.trim() || '—',
      relatedTags: tags,
      report: report ? { id: report.id, title: report.title } : null,
      documents: documents.map((d) => ({ id: d.id, title: d.title })),
      invoice: invoice
        ? { id: invoice.id, displayId: displayInvoiceId(invoice), pending: Boolean(pendingInvoice) }
        : null,
      payment: payment
        ? {
            id: payment.id,
            displayId: displayPaymentId(payment),
            statusText: payment.status === 'completado' ? 'Pagado' : 'Sin pago registrado'
          }
        : null,
      hasReport: Boolean(report),
      hasInvoice: Boolean(invoice),
      hasDocuments: documents.length > 0
    };
  });
}

export function buildVisitKpis(_state: DemoState, _patientId: string, views: PatientVisitView[]) {
  const sorted = [...views].sort((a, b) => b.appointment.date.localeCompare(a.appointment.date));
  const reportIds = new Set<string>();
  let docCount = 0;
  for (const v of views) {
    if (v.report) reportIds.add(v.report.id);
    docCount += v.documents.length;
  }
  return {
    visitCount: views.length,
    lastVisit: sorted[0]?.dateLabel ?? '—',
    treatmentsCompleted: views.length,
    reportsCount: reportIds.size,
    documentsCount: docCount
  };
}

export type HistoryChip =
  | 'all'
  | '30d'
  | 'year'
  | 'report'
  | 'invoice'
  | 'documents'
  | 'treatment'
  | 'revision';

export type PatientHistorySort = 'recent' | 'oldest';

function isRecent(iso: string, days: number) {
  return new Date(iso).getTime() >= Date.now() - days * 86400000;
}

function isThisYear(iso: string) {
  return iso.slice(0, 4) === String(new Date().getFullYear());
}

export function filterAndSortVisits(
  views: PatientVisitView[],
  opts: { q: string; chip: HistoryChip; sort: PatientHistorySort }
): PatientVisitView[] {
  let list = [...views];
  const s = opts.q.trim().toLowerCase();
  if (s) {
    list = list.filter(
      (v) =>
        v.treatmentName.toLowerCase().includes(s) ||
        v.clinicName.toLowerCase().includes(s) ||
        v.dentistName.toLowerCase().includes(s) ||
        v.dateLabel.includes(s) ||
        v.diagnosis.toLowerCase().includes(s) ||
        v.appointment.id.toLowerCase().includes(s)
    );
  }
  if (opts.chip === '30d') list = list.filter((v) => isRecent(v.appointment.date, 30));
  if (opts.chip === 'year') list = list.filter((v) => isThisYear(v.appointment.date));
  if (opts.chip === 'report') list = list.filter((v) => v.hasReport);
  if (opts.chip === 'invoice') list = list.filter((v) => v.hasInvoice);
  if (opts.chip === 'documents') list = list.filter((v) => v.hasDocuments);
  if (opts.chip === 'treatment') list = list.filter((v) => !v.isRevision);
  if (opts.chip === 'revision') list = list.filter((v) => v.isRevision);

  if (opts.sort === 'oldest') {
    list.sort((a, b) => a.appointment.date.localeCompare(b.appointment.date));
  } else {
    list.sort((a, b) => b.appointment.date.localeCompare(a.appointment.date));
  }
  return list;
}

export function downloadVisitSummary(v: PatientVisitView): boolean {
  if (typeof window === 'undefined') return false;
  const lines = [
    'RESUMEN DE VISITA — AgendaClinic',
    '',
    `Fecha: ${v.dateLabel} (${v.dayLabel}) · ${v.timeLabel}`,
    `Clínica: ${v.clinicName}`,
    `Profesional: ${v.dentistName}`,
    `Tratamiento: ${v.treatmentName}`,
    `Estado: ${v.statusText}`,
    `Duración: ${v.durationLabel}`,
    '',
    `Diagnóstico: ${v.diagnosis}`,
    `Recomendaciones: ${v.recommendations}`,
    '',
    v.report ? `Informe: ${v.report.title}` : 'Informe: —',
    v.invoice ? `Factura: ${v.invoice.displayId}` : 'Factura: —',
    v.payment ? `Pago: ${v.payment.displayId} (${v.payment.statusText})` : 'Pago: Sin pago registrado',
    v.documents.length
      ? `Documentos: ${v.documents.map((d) => d.title).join(', ')}`
      : 'Documentos: —',
    '',
    `ID cita: ${v.appointment.id}`
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `resumen-visita-${v.appointment.id}.txt`;
  a.rel = 'noopener';
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export function reportLink(reportId: string) {
  return `/paciente/informes?informe=${encodeURIComponent(reportId)}`;
}

export function documentsLink(appointmentId: string) {
  return `/paciente/documentos?cita=${encodeURIComponent(appointmentId)}`;
}

export function invoiceLink(invoiceId: string) {
  return `/paciente/facturas?factura=${encodeURIComponent(invoiceId)}`;
}

export function paymentLink(_paymentId: string, invoiceId?: string) {
  if (invoiceId) return `/paciente/pagos?factura=${encodeURIComponent(invoiceId)}`;
  return '/paciente/pagos';
}

export function followUpBookingLink(v: PatientVisitView) {
  const p = new URLSearchParams();
  p.set('seguimiento', v.appointment.id);
  p.set('clinica', v.appointment.clinicId);
  p.set('tratamiento', v.appointment.treatmentId);
  return `/paciente/reservar?${p.toString()}`;
}

export function messagesWithVisitContext(v: PatientVisitView) {
  return `/paciente/mensajes?contexto=${encodeURIComponent(
    `Consulta sobre visita del ${v.dateLabel}: ${v.treatmentName}`
  )}`;
}
