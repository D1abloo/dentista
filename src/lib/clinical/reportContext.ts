import type { DemoState } from '@/types/demo';
import { settingsFor } from '@/lib/demoStore';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { patientDisplayCode } from '@/lib/nhc';
import { patientName } from '@/lib/selectors';

export type AppointmentReportContext = {
  patientId: string;
  patientName: string;
  nhcLabel: string;
  patientDni?: string;
  patientAllergies?: string;
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicLogoUrl: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  dateLabel: string;
  treatmentName: string;
  dentistName: string;
  dentistHonorific: string;
  dentistCollegiateNumber: string;
  dentistSpecialty: string;
};

export function dentistHonorific(fullName: string): string {
  if (/^dra\.?\s/i.test(fullName) || /\bdra\.?\s/i.test(fullName)) return 'Dra.';
  return 'Dr.';
}

export function buildReportTitle(ctx: AppointmentReportContext): string {
  return `Informe odontológico - ${ctx.treatmentName} - ${ctx.dateLabel}`;
}

export function getAppointmentReportContext(
  state: DemoState,
  appointmentId: string
): AppointmentReportContext | null {
  const appt = state.appointments.find((a) => a.id === appointmentId);
  if (!appt) return null;
  const patient = state.patients.find((p) => p.id === appt.patientId);
  const clinic = state.clinics.find((c) => c.id === appt.clinicId);
  const treatment = state.treatments.find((t) => t.id === appt.treatmentId);
  const dentist = state.dentists.find((d) => d.id === appt.dentistId);
  if (!patient || !clinic) return null;

  const settings = settingsFor(state, clinic.tenantId);
  const honorific = dentist ? dentistHonorific(dentist.fullName) : 'Dr.';
  const dentistDisplay = dentist?.fullName.replace(/^(dr\.?|dra\.?)\s+/i, '').trim() ?? 'Profesional asignado';

  return {
    patientId: patient.id,
    patientName: patient.fullName,
    nhcLabel: patientDisplayCode(patient),
    patientDni: patient.dni,
    patientAllergies: patient.allergies,
    clinicId: clinic.id,
    clinicName: clinic.name,
    clinicAddress: clinic.address,
    clinicCity: clinic.city,
    clinicPhone: clinic.phone || settings.phone,
    clinicEmail: clinic.email || settings.email,
    clinicLogoUrl: settings.logoUrl ?? clinic.imageUrl ?? '/brand/clinic-shield.svg',
    appointmentId: appt.id,
    appointmentDate: appt.date,
    appointmentTime: appt.time,
    dateLabel: fmtDate(appt.date),
    treatmentName: treatment?.name ?? (appt.notes?.trim() || 'Consulta'),
    dentistName: dentistDisplay,
    dentistHonorific: honorific,
    dentistCollegiateNumber: dentist?.collegiateNumber ?? '[Nº colegiado]',
    dentistSpecialty: dentist?.specialty ?? 'Odontología general'
  };
}

export function buildReportLetterhead(ctx: AppointmentReportContext): string {
  const addressLine = [ctx.clinicAddress, ctx.clinicCity].filter(Boolean).join(', ');
  return [
    ctx.clinicName.toUpperCase(),
    addressLine || '[Dirección de la clínica]',
    `Tel. ${ctx.clinicPhone || '—'} · ${ctx.clinicEmail || '—'}`,
    '',
    `Paciente: ${ctx.patientName} · ${ctx.nhcLabel}${ctx.patientDni ? ` · DNI ${ctx.patientDni}` : ''}`,
    `Fecha de consulta: ${ctx.dateLabel} (${fmtDateTime(ctx.appointmentDate, ctx.appointmentTime)})`,
    `${ctx.dentistHonorific} ${ctx.dentistName} · ${ctx.dentistSpecialty} · Nº colegiado: ${ctx.dentistCollegiateNumber}`
  ].join('\n');
}

export function appointmentBelongsToPatient(state: DemoState, appointmentId: string, patientId: string) {
  const appt = state.appointments.find((a) => a.id === appointmentId);
  return Boolean(appt && appt.patientId === patientId);
}

export function enrichReportListRow(state: DemoState, reportId: string) {
  const r = state.clinicalReports.find((x) => x.id === reportId);
  if (!r) return null;
  const patient = state.patients.find((p) => p.id === r.patientId);
  const appt = r.appointmentId ? state.appointments.find((a) => a.id === r.appointmentId) : null;
  const clinic = appt
    ? state.clinics.find((c) => c.id === appt.clinicId)
    : patient?.preferredClinicId
      ? state.clinics.find((c) => c.id === patient.preferredClinicId)
      : state.clinics[0];
  const dentist = appt ? state.dentists.find((d) => d.id === appt.dentistId) : null;
  const treatment = appt ? state.treatments.find((t) => t.id === appt.treatmentId) : null;

  return {
    report: r,
    patientName: patient ? patientName(state, r.patientId) : '—',
    nhc: patient ? patientDisplayCode(patient) : '—',
    clinicName: clinic?.name ?? '—',
    dateLabel: fmtDate(r.createdAt),
    appointmentLabel: appt ? `${fmtDateTime(appt.date, appt.time)} · ${treatment?.name ?? 'Cita'}` : 'Sin cita',
    dentistName: dentist?.fullName ?? r.uploadedBy,
    visibleLabel: r.visibleToPatient ? 'Sí' : 'No'
  };
}
