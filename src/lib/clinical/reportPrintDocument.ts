import type { ClinicalReport, DemoState } from '@/types/demo';
import { fmtDate } from '@/lib/format';
import { patientName } from '@/lib/selectors';
import { patientDisplayCode } from '@/lib/nhc';
import {
  getAppointmentReportContext,
  type AppointmentReportContext
} from '@/lib/clinical/reportTemplates';
import {
  buildStructuredPrintSections,
  formatPrintBodyHtml,
  REPORT_PRINT_STYLES,
  type ReportPrintSection
} from '@/lib/clinical/reportPrintLayout';

export type ClinicalReportPrintPayload = {
  ctx: AppointmentReportContext | null;
  report: ClinicalReport;
  clinicLogoUrl: string;
  clinicName: string;
  patientLabel: string;
  patientName: string;
  patientCode: string;
  publishedLabel: string;
  professionalFooter: string;
  professionalName: string;
  professionalSpecialty: string;
  professionalCollegiate: string;
  sections: ReportPrintSection[];
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function resolveReportPrintPayload(state: DemoState, report: ClinicalReport): ClinicalReportPrintPayload {
  const ctx = report.appointmentId ? getAppointmentReportContext(state, report.appointmentId) : null;
  const patient = state.patients.find((p) => p.id === report.patientId);

  const appt = report.appointmentId ? state.appointments.find((a) => a.id === report.appointmentId) : undefined;
  const dentist = appt ? state.dentists.find((d) => d.id === appt.dentistId) : undefined;

  const logoUrl = ctx?.clinicLogoUrl ?? '/brand/clinic-shield.svg';
  const clinicName = ctx?.clinicName ?? state.clinics.find((c) => c.tenantId === report.tenantId)?.name ?? 'Clínica';

  const professionalName = ctx ? `${ctx.dentistHonorific} ${ctx.dentistName}` : report.uploadedBy;
  const professionalSpecialty = ctx?.dentistSpecialty ?? dentist?.specialty ?? '—';
  const professionalCollegiate = ctx?.dentistCollegiateNumber ?? dentist?.collegiateNumber ?? '—';

  const professionalFooter = [
    professionalName,
    professionalSpecialty,
    `Nº colegiado: ${professionalCollegiate}`,
    dentist?.email ? `Email: ${dentist.email}` : null,
    dentist?.phone ? `Tel.: ${dentist.phone}` : null
  ]
    .filter(Boolean)
    .join('\n');

  return {
    ctx,
    report,
    clinicLogoUrl: logoUrl,
    clinicName,
    patientLabel: patient
      ? `${patientName(state, report.patientId)} · ${patientDisplayCode(patient)}`
      : patientName(state, report.patientId),
    patientName: patient ? patientName(state, report.patientId) : '—',
    patientCode: patient ? patientDisplayCode(patient) : '—',
    publishedLabel: fmtDate(report.createdAt),
    professionalFooter,
    professionalName,
    professionalSpecialty,
    professionalCollegiate,
    sections: buildStructuredPrintSections(report)
  };
}

function renderSections(sections: ReportPrintSection[]): string {
  let html = '';
  let currentGroup = '';

  for (const sec of sections) {
    if (sec.groupLabel !== currentGroup) {
      if (currentGroup) html += '</div>';
      currentGroup = sec.groupLabel;
      html += `<div class="group"><p class="group__label">${escapeHtml(sec.groupLabel)}</p>`;
    }

    const legalClass = sec.group === 'legal' ? ' section--legal' : '';
    html += `
      <section class="section${legalClass}">
        <header class="section__head">
          <span class="section__step">${escapeHtml(sec.step)}</span>
          <h3 class="section__title">${escapeHtml(sec.title)}</h3>
        </header>
        <div class="section__body">${formatPrintBodyHtml(sec.body)}</div>
      </section>`;
  }

  if (currentGroup) html += '</div>';
  return html;
}

/** Documento HTML imprimible — layout administrativo con marcos y zonas de escritura. */
export function buildClinicalReportPrintHtml(payload: ClinicalReportPrintPayload): string {
  const { report, clinicLogoUrl, clinicName, patientName: pName, patientCode, publishedLabel, ctx } = payload;

  const addressLine = ctx ? [ctx.clinicAddress, ctx.clinicCity].filter(Boolean).join(', ') : '';
  const absLogo = clinicLogoUrl.startsWith('http')
    ? clinicLogoUrl
    : typeof window !== 'undefined'
      ? `${window.location.origin}${clinicLogoUrl.startsWith('/') ? '' : '/'}${clinicLogoUrl}`
      : clinicLogoUrl;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(report.title)}</title>
  <style>${REPORT_PRINT_STYLES}</style>
</head>
<body>
  <article class="doc">
    <div class="doc__inner">
      <header class="letterhead">
        <img class="letterhead__logo" src="${escapeHtml(absLogo)}" alt="Logo ${escapeHtml(clinicName)}" />
        <div>
          <h1 class="letterhead__name">${escapeHtml(clinicName)}</h1>
          ${addressLine ? `<p class="letterhead__meta">${escapeHtml(addressLine)}</p>` : ''}
          ${ctx?.clinicPhone ? `<p class="letterhead__meta">Tel. ${escapeHtml(ctx.clinicPhone)}${ctx.clinicEmail ? ` · ${escapeHtml(ctx.clinicEmail)}` : ''}</p>` : ''}
        </div>
      </header>

      <h2 class="doc-title">${escapeHtml(report.title)}</h2>

      <div class="patient-bar">
        <div class="patient-bar__cell">
          <span class="patient-bar__label">Paciente</span>
          ${escapeHtml(pName)}
        </div>
        <div class="patient-bar__cell">
          <span class="patient-bar__label">NHC / Identificador</span>
          ${escapeHtml(patientCode)}
        </div>
        <div class="patient-bar__cell">
          <span class="patient-bar__label">Fecha del informe</span>
          ${escapeHtml(publishedLabel)}
        </div>
        ${ctx ? `<div class="patient-bar__cell"><span class="patient-bar__label">Tratamiento / Cita</span>${escapeHtml(ctx.treatmentName)} · ${escapeHtml(ctx.dateLabel)}</div>` : ''}
      </div>

      ${renderSections(payload.sections)}

      <footer class="footer-pro">
        <p class="footer-pro__label">Profesional responsable</p>
        <div class="footer-pro__grid">
          <p class="footer-pro__name">${escapeHtml(payload.professionalName)}</p>
          <span><strong>Especialidad:</strong> ${escapeHtml(payload.professionalSpecialty)}</span>
          <span><strong>Nº colegiado:</strong> ${escapeHtml(payload.professionalCollegiate)}</span>
        </div>
      </footer>

      <p class="print-hint">Use «Imprimir» o «Guardar como PDF» del navegador para obtener el documento final.</p>
    </div>
  </article>
</body>
</html>`;
}
