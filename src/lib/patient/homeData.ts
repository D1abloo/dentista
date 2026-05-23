import { isActiveStatus } from '@/lib/appointments';
import { fmtDate, fmtDateTime, money, statusLabel } from '@/lib/format';
import {
  appointmentDetailHref,
  documentDetailHref,
  invoiceDetailHref,
  reportDetailHref
} from '@/lib/patient/portalLinks';
import {
  pendingInvoicesForPatient,
  visibleDocumentsForPatient,
  visibleReportsForPatient
} from '@/lib/selectors';
import type { Appointment, DemoState } from '@/types/demo';

export type PatientHomeUpdateKind = 'documento' | 'factura' | 'cita' | 'mensaje' | 'informe';

export type PatientHomeUpdate = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  kind: PatientHomeUpdateKind;
  at: string;
};

export type PatientHomeKpis = {
  activeAppointments: number;
  pendingInvoicesAmount: number;
  pendingInvoicesLabel: string;
  newDocuments: number;
  unreadMessages: number;
};

export type PatientHomeSummary = {
  lastReport: string;
  newDocuments: string;
  lastPayment: string;
  pendingInvoices: string;
};

export type AppointmentDisplay = {
  treatment: string;
  dentist: string;
  clinic: string;
  date: string;
  time: string;
  dateTimeLabel: string;
  statusLabel: string;
};

export function formatPatientNhc(nhc?: string) {
  if (!nhc) return '';
  const digits = String(nhc).replace(/\D/g, '');
  if (!digits) return `NHC ${nhc}`;
  return `NHC ${digits.padStart(4, '0')}`;
}

function appointmentDisplay(state: DemoState, a: Appointment): AppointmentDisplay {
  const t = state.treatments.find((x) => x.id === a.treatmentId);
  const d = state.dentists.find((x) => x.id === a.dentistId);
  const c = state.clinics.find((x) => x.id === a.clinicId);
  return {
    treatment: t?.name ?? '—',
    dentist: d?.fullName ?? '—',
    clinic: c?.name ?? '—',
    date: fmtDate(a.date),
    time: a.time,
    dateTimeLabel: fmtDateTime(a.date, a.time),
    statusLabel: statusLabel(a.status)
  };
}

function isRecent(iso: string, days: number) {
  const t = new Date(iso).getTime();
  return t >= Date.now() - days * 86400000;
}

export function buildPatientHomeUpdates(state: DemoState, patientId: string, limit = 6): PatientHomeUpdate[] {
  const items: PatientHomeUpdate[] = [];

  const messages = state.messages
    .filter((m) => m.patientId === patientId)
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));

  for (const m of messages.filter((x) => !x.read).slice(0, 2)) {
    items.push({
      id: `msg-${m.id}`,
      title: 'Mensaje de tu clínica',
      subtitle: m.subject,
      href: '/paciente/mensajes',
      kind: 'mensaje',
      at: m.sentAt
    });
  }

  const upcoming = state.appointments
    .filter((a) => a.patientId === patientId && isActiveStatus(a.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  if (upcoming[0]) {
    const meta = appointmentDisplay(state, upcoming[0]);
    items.push({
      id: `appt-${upcoming[0].id}`,
      title: 'Cita confirmada',
      subtitle: `${meta.treatment} · ${meta.dateTimeLabel}`,
      href: appointmentDetailHref(upcoming[0].id),
      kind: 'cita',
      at: `${upcoming[0].date}T${upcoming[0].time}`
    });
  }

  const docs = visibleDocumentsForPatient(state, patientId)
    .filter((d) => isRecent(d.createdAt, 45))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  for (const d of docs.slice(0, 2)) {
    items.push({
      id: `doc-${d.id}`,
      title: 'Nuevo documento disponible',
      subtitle: d.title,
      href: documentDetailHref(d.id),
      kind: 'documento',
      at: d.createdAt
    });
  }

  const invoices = pendingInvoicesForPatient(state, patientId).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  if (invoices[0]) {
    items.push({
      id: `inv-${invoices[0].id}`,
      title: 'Factura enviada al portal',
      subtitle: invoices[0].id,
      href: invoiceDetailHref(invoices[0].id),
      kind: 'factura',
      at: invoices[0].issuedAt
    });
  }

  const reports = visibleReportsForPatient(state, patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (reports[0] && isRecent(reports[0].createdAt, 60)) {
    items.push({
      id: `rep-${reports[0].id}`,
      title: 'Nuevo informe disponible',
      subtitle: reports[0].title,
      href: reportDetailHref(reports[0].id),
      kind: 'informe',
      at: reports[0].createdAt
    });
  }

  return items
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

export function buildPatientHomeKpis(state: DemoState, patientId: string): PatientHomeKpis {
  const activeAppointments = state.appointments.filter(
    (a) => a.patientId === patientId && isActiveStatus(a.status)
  ).length;
  const pending = pendingInvoicesForPatient(state, patientId);
  const pendingTotal = pending.reduce((s, i) => s + i.amount, 0);
  const docs = visibleDocumentsForPatient(state, patientId).filter((d) => isRecent(d.createdAt, 30));
  const unreadMessages = state.messages.filter((m) => m.patientId === patientId && !m.read).length;

  return {
    activeAppointments,
    pendingInvoicesAmount: pendingTotal,
    pendingInvoicesLabel: money(pendingTotal),
    newDocuments: docs.length,
    unreadMessages
  };
}

export function buildPatientHomeSummary(state: DemoState, patientId: string): PatientHomeSummary {
  const reports = visibleReportsForPatient(state, patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const docs = visibleDocumentsForPatient(state, patientId).filter((d) => isRecent(d.createdAt, 30));
  const pays = state.payments
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => (b.paidAt ?? b.createdAt).localeCompare(a.paidAt ?? a.createdAt));
  const pending = pendingInvoicesForPatient(state, patientId);
  const pendingTotal = pending.reduce((s, i) => s + i.amount, 0);

  return {
    lastReport: reports[0]?.title ?? 'Sin informes recientes',
    newDocuments: String(docs.length),
    lastPayment: pays[0] ? money(pays[0].amount) : 'Sin pagos recientes',
    pendingInvoices: money(pendingTotal)
  };
}

export function getNextPatientAppointment(state: DemoState, patientId: string) {
  const upcoming = state.appointments
    .filter((a) => a.patientId === patientId && isActiveStatus(a.status))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const next = upcoming[0];
  if (!next) return null;
  return { appointment: next, display: appointmentDisplay(state, next) };
}
