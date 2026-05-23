import type { DemoState } from '@/types/demo';
import { buildReportTitle, getAppointmentReportContext } from '@/lib/clinical/reportContext';

/** Título de informe según motivo/tratamiento de la cita. */
export function reportTitleFromAppointment(state: DemoState, appointmentId: string): string {
  const ctx = getAppointmentReportContext(state, appointmentId);
  if (!ctx) return '';
  return buildReportTitle(ctx);
}

export function invoiceConceptFromAppointment(state: DemoState, appointmentId: string, fallback: string): string {
  const appt = state.appointments.find((a) => a.id === appointmentId);
  if (!appt) return fallback;
  const treatment = state.treatments.find((t) => t.id === appt.treatmentId);
  return treatment ? `Factura · ${treatment.name}` : fallback;
}

export function defaultInvoiceFileName(series: string, invoiceId: string, patientName: string): string {
  const safe = patientName.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
  return `${series || 'FAC'}-${invoiceId}-${safe}.pdf`;
}
