import { filterAppointments, isActiveStatus } from '@/lib/appointments';
import { fmtDateTime, money, statusLabel } from '@/lib/format';
import { invoiceDetailHref, messageContextHref, reportDetailHref } from '@/lib/patient/portalLinks';
import type { Appointment, AppointmentStatus, DemoState } from '@/types/demo';

export type ApptChip =
  | 'all'
  | 'upcoming'
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'history'
  | 'active';

export type ApptSection = 'current' | 'past' | 'completed';

export type ApptSort = 'recent' | 'oldest';

export type PatientAppointmentView = {
  appointment: Appointment;
  treatment: string;
  dentist: string;
  clinic: string;
  clinicId: string;
  price: number;
  priceLabel: string;
  dateTimeLabel: string;
  statusLabel: string;
  isUpcoming: boolean;
  isCurrent: boolean;
  isPast: boolean;
  isCompleted: boolean;
  isHistory: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  hasInvoice: boolean;
  hasReport: boolean;
  invoiceId?: string;
  reportId?: string;
  invoiceHref?: string;
  reportHref?: string;
  messageHref: string;
};

export function enrichPatientAppointments(state: DemoState, patientId: string): PatientAppointmentView[] {
  const today = new Date().toISOString().slice(0, 10);
  const list = state.appointments.filter((a) => a.patientId === patientId);

  return list.map((a) => {
    const t = state.treatments.find((x) => x.id === a.treatmentId);
    const d = state.dentists.find((x) => x.id === a.dentistId);
    const c = state.clinics.find((x) => x.id === a.clinicId);
    const invoice = state.invoices.find((i) => i.patientId === patientId && i.appointmentId === a.id);
    const report = state.clinicalReports.find(
      (r) => r.patientId === patientId && r.appointmentId === a.id
    );
    const active = isActiveStatus(a.status);
    const isCompleted = a.status === 'completada';
    const isPast = a.date < today && !isCompleted;
    const isCurrent = a.date >= today && active;
    const isUpcoming = isCurrent;
    const isHistory = isPast || isCompleted || ['cancelada', 'no_asistio'].includes(a.status);

    return {
      appointment: a,
      treatment: t?.name ?? 'Consulta',
      dentist: d?.fullName ?? '—',
      clinic: c?.name ?? '—',
      clinicId: a.clinicId,
      price: t?.price ?? 0,
      priceLabel: money(t?.price ?? 0),
      dateTimeLabel: fmtDateTime(a.date, a.time),
      statusLabel: statusLabel(a.status),
      isUpcoming,
      isCurrent,
      isPast,
      isCompleted,
      isHistory,
      canCancel: isCurrent && active && a.status !== 'cancelada',
      canReschedule: isCurrent && active && a.status !== 'cancelada',
      hasInvoice: Boolean(invoice),
      hasReport: Boolean(report),
      invoiceId: invoice?.id,
      reportId: report?.id,
      invoiceHref: invoice ? invoiceDetailHref(invoice.id) : undefined,
      reportHref: report ? reportDetailHref(report.id) : undefined,
      messageHref: messageContextHref({ contexto: 'cita', appointmentId: a.id })
    };
  });
}

export function filterAppointmentsBySection(
  views: PatientAppointmentView[],
  section: ApptSection
): PatientAppointmentView[] {
  switch (section) {
    case 'past':
      return views.filter((v) => v.isPast);
    case 'completed':
      return views.filter((v) => v.isCompleted);
    default:
      return views.filter((v) => v.isCurrent);
  }
}

export function buildAppointmentKpis(views: PatientAppointmentView[]) {
  const current = views.filter((v) => v.isCurrent);
  const upcoming = current.filter((v) => v.isUpcoming).length;
  const confirmed = current.filter((v) => v.appointment.status === 'confirmada').length;
  const pending = current.filter((v) => v.appointment.status === 'pendiente').length;
  const cancelled = current.filter((v) => v.appointment.status === 'cancelada').length;
  const history = views.filter((v) => v.isPast || v.isCompleted).length;
  const next = current
    .filter((v) => v.isUpcoming)
    .sort((a, b) =>
      `${a.appointment.date}${a.appointment.time}`.localeCompare(
        `${b.appointment.date}${b.appointment.time}`
      )
    )[0];
  return {
    upcoming,
    confirmed,
    pending,
    cancelled,
    history,
    nextLabel: next ? next.dateTimeLabel : '—'
  };
}

function matchesChip(v: PatientAppointmentView, chip: ApptChip): boolean {
  switch (chip) {
    case 'upcoming':
      return v.isUpcoming;
    case 'confirmed':
      return v.appointment.status === 'confirmada';
    case 'pending':
      return v.appointment.status === 'pendiente';
    case 'cancelled':
      return v.appointment.status === 'cancelada';
    case 'history':
      return v.appointment.status === 'no_asistio' || v.isHistory;
    case 'active':
      return isActiveStatus(v.appointment.status);
    default:
      return true;
  }
}

export function filterPatientAppointments(
  state: DemoState,
  views: PatientAppointmentView[],
  opts: { q?: string; chip?: ApptChip; sort?: ApptSort }
) {
  let ids = views.map((v) => v.appointment);
  ids = filterAppointments(state, ids, { q: opts.q });
  const idSet = new Set(ids.map((a) => a.id));
  let out = views.filter((v) => idSet.has(v.appointment.id));
  if (opts.chip && opts.chip !== 'all') {
    out = out.filter((v) => matchesChip(v, opts.chip!));
  }
  const sort = opts.sort ?? 'recent';
  out.sort((a, b) => {
    const ka = `${a.appointment.date}${a.appointment.time}`;
    const kb = `${b.appointment.date}${b.appointment.time}`;
    return sort === 'oldest' ? ka.localeCompare(kb) : kb.localeCompare(ka);
  });
  return out;
}

export function statusTone(status: AppointmentStatus): string {
  if (status === 'confirmada') return 'prt-status--read';
  if (status === 'pendiente') return 'prt-status--new';
  if (status === 'cancelada') return 'prt-status--muted';
  return 'prt-status--read';
}
