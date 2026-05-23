import type { ClinicalReport, DemoState } from '@/types/demo';
import { downloadDemoFileRef } from '@/lib/demoFiles';
import { fmtDate } from '@/lib/format';
import { resolveReportPrintPayload } from '@/lib/clinical/reportPrintDocument';
import { ensureClinicalReportPdf, openClinicalReportPrintView, buildClinicalReportPrintHtmlFromState } from '@/lib/pdfClinicalReport';
import { saveClinicalReport } from '@/lib/demoStore';
import { reportPreviewLine } from '@/lib/patient/reportDisplay';

const READ_KEY = 'dentista_patient_reports_read';

export type ReportTypeLabel = 'Revisión' | 'Tratamiento' | 'Seguimiento' | 'Estética' | 'Urgencia' | 'General';

export type PatientReportView = {
  report: ClinicalReport;
  clinicId: string;
  clinicName: string;
  professional: string;
  professionalFooter: string;
  clinicLogoUrl: string;
  typeLabel: ReportTypeLabel;
  publishedLabel: string;
  summary: string;
  hasPdf: boolean;
  read: boolean;
  isNew: boolean;
  fileSizeLabel: string;
};

function readSet(patientId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    return new Set(map[patientId] ?? []);
  } catch {
    return new Set();
  }
}

function persistRead(patientId: string, ids: Set<string>) {
  try {
    const raw = localStorage.getItem(READ_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    map[patientId] = [...ids];
    localStorage.setItem(READ_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function markPatientReportRead(patientId: string, reportId: string) {
  const ids = readSet(patientId);
  ids.add(reportId);
  persistRead(patientId, ids);
}

export function inferReportType(report: ClinicalReport): ReportTypeLabel {
  const t = `${report.title} ${report.diagnosis ?? ''}`.toLowerCase();
  if (t.includes('revisión') || t.includes('revision') || t.includes('valoración')) return 'Revisión';
  if (t.includes('ortodon') || t.includes('seguimiento') || t.includes('control')) return 'Seguimiento';
  if (t.includes('limpieza') || t.includes('endodon') || t.includes('implant') || t.includes('tratamiento'))
    return 'Tratamiento';
  if (t.includes('blanque') || t.includes('estét')) return 'Estética';
  if (t.includes('urgenc')) return 'Urgencia';
  return 'General';
}

function clinicForReport(state: DemoState, report: ClinicalReport) {
  const appt = report.appointmentId
    ? state.appointments.find((a) => a.id === report.appointmentId)
    : undefined;
  const clinicId = appt?.clinicId ?? state.clinics.find((c) => c.tenantId === report.tenantId)?.id ?? '';
  const clinic = state.clinics.find((c) => c.id === clinicId);
  return { clinicId, clinicName: clinic?.name ?? 'Clínica' };
}

function isRecent(iso: string, days: number) {
  return new Date(iso).getTime() >= Date.now() - days * 86400000;
}

export function enrichPatientReports(state: DemoState, patientId: string, reports: ClinicalReport[]): PatientReportView[] {
  const read = readSet(patientId);
  return reports.map((report) => {
    const { clinicId, clinicName } = clinicForReport(state, report);
    const wasRead = read.has(report.id);
    const isNew = !wasRead && isRecent(report.createdAt, 45);
    const printPayload = resolveReportPrintPayload(state, report);
    return {
      report,
      clinicId,
      clinicName,
      professional: report.uploadedBy,
      professionalFooter: printPayload.professionalFooter,
      clinicLogoUrl: printPayload.clinicLogoUrl,
      typeLabel: inferReportType(report),
      publishedLabel: fmtDate(report.createdAt),
      summary: reportPreviewLine(report),
      hasPdf: Boolean(report.fileRef) || printPayload.blocks.length > 0,
      read: wasRead,
      isNew,
      fileSizeLabel: report.fileRef ? '245 KB' : '—'
    };
  });
}

export function buildReportKpis(views: PatientReportView[]) {
  const clinics = new Set(views.map((v) => v.clinicId).filter(Boolean));
  const sorted = [...views].sort((a, b) => b.report.createdAt.localeCompare(a.report.createdAt));
  return {
    available: views.length,
    newCount: views.filter((v) => v.isNew).length,
    lastDate: sorted[0]?.publishedLabel ?? '—',
    clinicCount: clinics.size || (views.length ? 1 : 0)
  };
}

export type ReportSort = 'recent' | 'oldest' | 'title';
export type ReportChip =
  | 'all'
  | 'new'
  | 'read'
  | 'unread'
  | 'pdf'
  | '30d'
  | 'clinic';

export function filterAndSortReports(
  views: PatientReportView[],
  opts: {
    q: string;
    chip: ReportChip;
    clinicId: string;
    sort: ReportSort;
  }
): PatientReportView[] {
  let list = [...views];
  const s = opts.q.trim().toLowerCase();
  if (s) {
    list = list.filter(
      (v) =>
        v.report.title.toLowerCase().includes(s) ||
        (v.report.diagnosis ?? '').toLowerCase().includes(s) ||
        v.clinicName.toLowerCase().includes(s) ||
        v.professional.toLowerCase().includes(s) ||
        v.publishedLabel.includes(s) ||
        v.typeLabel.toLowerCase().includes(s)
    );
  }
  if (opts.chip === 'new') list = list.filter((v) => v.isNew);
  if (opts.chip === 'read') list = list.filter((v) => v.read);
  if (opts.chip === 'unread') list = list.filter((v) => !v.read);
  if (opts.chip === 'pdf') list = list.filter((v) => v.hasPdf);
  if (opts.chip === '30d') list = list.filter((v) => isRecent(v.report.createdAt, 30));
  if (opts.chip === 'clinic' && opts.clinicId) list = list.filter((v) => v.clinicId === opts.clinicId);

  if (opts.sort === 'oldest') {
    list.sort((a, b) => a.report.createdAt.localeCompare(b.report.createdAt));
  } else if (opts.sort === 'title') {
    list.sort((a, b) => a.report.title.localeCompare(b.report.title, 'es'));
  } else {
    list.sort((a, b) => b.report.createdAt.localeCompare(a.report.createdAt));
  }
  return list;
}

export function relatedDocumentsQuery(reportId: string, appointmentId?: string) {
  const params = new URLSearchParams();
  if (appointmentId) params.set('cita', appointmentId);
  params.set('informe', reportId);
  const q = params.toString();
  return `/paciente/documentos${q ? `?${q}` : ''}`;
}

export function messagesWithReportContext(reportTitle: string) {
  return `/paciente/mensajes?contexto=${encodeURIComponent(`Consulta sobre: ${reportTitle}`)}`;
}

export async function downloadPatientReportPdf(
  state: DemoState,
  view: PatientReportView,
  onPersist?: (next: DemoState) => void
): Promise<boolean> {
  try {
    let report = view.report;
    if (!report.fileRef) {
      const ensured = await ensureClinicalReportPdf(state, report);
      report = ensured.report;
      if (onPersist) onPersist(saveClinicalReport(state, report));
    }
    if (report.fileRef) {
      return downloadDemoFileRef(report.fileRef, report.fileName ?? `${report.id}.pdf`);
    }
    openClinicalReportPrintView(buildClinicalReportPrintHtmlFromState(state, report));
    return true;
  } catch {
    return false;
  }
}

export function viewPatientReportPdfHtml(state: DemoState, view: PatientReportView): string {
  return buildClinicalReportPrintHtmlFromState(state, view.report);
}
