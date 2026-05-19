import type { DemoState } from '@/types/demo';

/** Título de informe según motivo/tratamiento de la cita. */
export function reportTitleFromAppointment(state: DemoState, appointmentId: string): string {
  const appt = state.appointments.find((a) => a.id === appointmentId);
  if (!appt) return '';
  const treatment = state.treatments.find((t) => t.id === appt.treatmentId);
  if (!treatment) return 'Informe clínico';
  return `Informe · ${treatment.name}`;
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
