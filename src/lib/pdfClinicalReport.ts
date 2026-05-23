import type { ClinicalReport, DemoState } from '@/types/demo';
import { saveDemoFile } from '@/lib/demoFiles';
import {
  buildClinicalReportPrintHtml,
  resolveReportPrintPayload,
  type ClinicalReportPrintPayload
} from '@/lib/clinical/reportPrintDocument';

/** Abre el informe en una ventana lista para imprimir / guardar como PDF (UTF-8 y maquetación correcta). */
export function openClinicalReportPrintView(html: string, autoPrint = false) {
  if (typeof window === 'undefined') return;
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  if (autoPrint) {
    w.addEventListener('load', () => {
      setTimeout(() => w.print(), 350);
    });
  }
}

export function buildClinicalReportPrintHtmlFromState(state: DemoState, report: ClinicalReport) {
  return buildClinicalReportPrintHtml(resolveReportPrintPayload(state, report));
}

/** Guarda HTML imprimible (evita PDF de texto plano con caracteres rotos). */
export async function generateClinicalReportPrintFile(
  payload: ClinicalReportPrintPayload
): Promise<{ fileRef: string; fileName: string; mimeType: string }> {
  const html = buildClinicalReportPrintHtml(payload);
  const safeTitle =
    payload.report.title.replace(/[^\w\s-áéíóúñÁÉÍÓÚÑ]/gi, '').trim().slice(0, 40) || 'informe';
  const fileName = `${safeTitle}-${payload.report.id.slice(0, 8)}.html`;
  const file = new File([html], fileName, { type: 'text/html;charset=utf-8' });
  const fileRef = await saveDemoFile(file);
  return { fileRef, fileName, mimeType: 'text/html;charset=utf-8' };
}

export async function ensureClinicalReportPdf(
  state: DemoState,
  report: ClinicalReport
): Promise<{ report: ClinicalReport; fileRef: string; fileName: string }> {
  if (report.fileRef && report.mimeType?.includes('html')) {
    return {
      report,
      fileRef: report.fileRef,
      fileName: report.fileName ?? `${report.id}.html`
    };
  }
  const payload = resolveReportPrintPayload(state, report);
  const { fileRef, fileName, mimeType } = await generateClinicalReportPrintFile(payload);
  return {
    report: { ...report, fileRef, fileName, mimeType },
    fileRef,
    fileName
  };
}

/** Descarga / imprime informe con maquetación administrativa. */
export function printClinicalReportFromState(state: DemoState, report: ClinicalReport, autoPrint = true) {
  const html = buildClinicalReportPrintHtmlFromState(state, report);
  openClinicalReportPrintView(html, autoPrint);
}
