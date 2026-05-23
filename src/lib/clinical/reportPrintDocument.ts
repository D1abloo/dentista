import type { ClinicalReport, DemoState } from '@/types/demo';
import { fmtDate } from '@/lib/format';
import { patientName } from '@/lib/selectors';
import { patientDisplayCode } from '@/lib/nhc';
import {
  getAppointmentReportContext,
  type AppointmentReportContext
} from '@/lib/clinical/reportTemplates';
import { buildPatientReportBlocks } from '@/lib/patient/reportDisplay';

export type ClinicalReportPrintPayload = {
  ctx: AppointmentReportContext | null;
  report: ClinicalReport;
  clinicLogoUrl: string;
  clinicName: string;
  patientLabel: string;
  publishedLabel: string;
  professionalFooter: string;
  blocks: { title: string; body: string }[];
};

export function resolveReportPrintPayload(state: DemoState, report: ClinicalReport): ClinicalReportPrintPayload {
  const ctx = report.appointmentId ? getAppointmentReportContext(state, report.appointmentId) : null;
  const patient = state.patients.find((p) => p.id === report.patientId);

  const appt = report.appointmentId ? state.appointments.find((a) => a.id === report.appointmentId) : undefined;
  const dentist = appt ? state.dentists.find((d) => d.id === appt.dentistId) : undefined;

  const logoUrl = ctx?.clinicLogoUrl ?? '/brand/clinic-shield.svg';
  const clinicName = ctx?.clinicName ?? state.clinics.find((c) => c.tenantId === report.tenantId)?.name ?? 'Clínica';

  const professionalFooter = ctx
    ? [
        `${ctx.dentistHonorific} ${ctx.dentistName}`,
        ctx.dentistSpecialty,
        `Nº colegiado: ${ctx.dentistCollegiateNumber}`,
        dentist?.email ? `Email: ${dentist.email}` : null,
        dentist?.phone ? `Tel.: ${dentist.phone}` : null
      ]
        .filter(Boolean)
        .join('\n')
    : report.uploadedBy;

  return {
    ctx,
    report,
    clinicLogoUrl: logoUrl,
    clinicName,
    patientLabel: patient
      ? `${patientName(state, report.patientId)} · ${patientDisplayCode(patient)}`
      : patientName(state, report.patientId),
    publishedLabel: fmtDate(report.createdAt),
    professionalFooter,
    blocks: buildPatientReportBlocks(report).map((b) => ({ title: b.title, body: b.body }))
  };
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bodyToHtml(text: string) {
  return escapeHtml(text).replace(/\n/g, '<br />');
}

/** Documento HTML imprimible con logo de clínica y pie del profesional. */
export function buildClinicalReportPrintHtml(payload: ClinicalReportPrintPayload): string {
  const { report, clinicLogoUrl, clinicName, patientLabel, publishedLabel, professionalFooter, blocks, ctx } =
    payload;

  const addressLine = ctx
    ? [ctx.clinicAddress, ctx.clinicCity].filter(Boolean).join(', ')
    : '';

  const sectionsHtml = blocks
    .map(
      (b) =>
        `<section class="block"><h2>${escapeHtml(b.title)}</h2><div class="body">${bodyToHtml(b.body)}</div></section>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f2742; margin: 0; padding: 2rem 2.5rem; font-size: 11pt; line-height: 1.55; }
    .letterhead { display: flex; gap: 1rem; align-items: flex-start; border-bottom: 2px solid #14b8a6; padding-bottom: 1rem; margin-bottom: 1.25rem; }
    .letterhead img { width: 72px; height: 72px; object-fit: contain; border-radius: 8px; background: #fff; border: 1px solid #e2e8f0; }
    .letterhead h1 { margin: 0; font-size: 1.15rem; letter-spacing: 0.02em; }
    .letterhead p { margin: 0.2rem 0 0; font-size: 0.85rem; color: #475569; }
    .meta { font-size: 0.85rem; color: #64748b; margin-bottom: 1.5rem; }
    .report-title { font-size: 1.05rem; font-weight: 700; margin: 0 0 1rem; color: #0f2742; }
    .block { margin-bottom: 1.1rem; page-break-inside: avoid; }
    .block h2 { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; color: #0d9488; margin: 0 0 0.35rem; }
    .block .body { white-space: pre-wrap; }
    .footer-pro { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #cbd5e1; font-size: 0.82rem; }
    .footer-pro strong { display: block; font-size: 0.72rem; text-transform: uppercase; color: #64748b; margin-bottom: 0.35rem; }
    .footer-pro pre { margin: 0; font-family: inherit; white-space: pre-wrap; }
    @media print { body { padding: 1rem 1.5rem; } }
  </style>
</head>
<body>
  <header class="letterhead">
    <img src="${escapeHtml(clinicLogoUrl)}" alt="${escapeHtml(clinicName)}" />
    <div>
      <h1>${escapeHtml(clinicName)}</h1>
      ${addressLine ? `<p>${escapeHtml(addressLine)}</p>` : ''}
      ${ctx?.clinicPhone ? `<p>Tel. ${escapeHtml(ctx.clinicPhone)} · ${escapeHtml(ctx.clinicEmail ?? '')}</p>` : ''}
    </div>
  </header>
  <p class="meta">${escapeHtml(patientLabel)} · Publicado: ${escapeHtml(publishedLabel)}</p>
  <h2 class="report-title">${escapeHtml(report.title)}</h2>
  ${sectionsHtml || `<p>${bodyToHtml(report.description ?? '—')}</p>`}
  <footer class="footer-pro">
    <strong>Profesional responsable</strong>
    <pre>${escapeHtml(professionalFooter)}</pre>
  </footer>
</body>
</html>`;
}
