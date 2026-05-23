import type { ClinicalReport, DemoState } from '@/types/demo';
import { saveDemoFile } from '@/lib/demoFiles';
import {
  buildClinicalReportPrintHtml,
  resolveReportPrintPayload,
  type ClinicalReportPrintPayload
} from '@/lib/clinical/reportPrintDocument';

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildMinimalPdf(lines: string[]): Uint8Array {
  const contentLines = lines.map((line, i) => `1 0 0 1 50 ${740 - i * 14} Tm (${escapePdfText(line)}) Tj`);
  const stream = ['BT', '/F1 9 Tf', ...contentLines, 'ET'].join('\n');
  const streamLen = new TextEncoder().encode(stream).length;

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> >> endobj',
    `4 0 obj << /Length ${streamLen} >> stream\n${stream}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

function wrapPdfLine(text: string, max = 88): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max) {
      if (cur) lines.push(cur);
      cur = w.length > max ? w.slice(0, max) : w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function buildClinicalReportPdfLines(payload: ClinicalReportPrintPayload): string[] {
  const { report, clinicName, patientLabel, publishedLabel, professionalFooter, blocks, ctx } = payload;

  const lines: string[] = [
    clinicName.toUpperCase(),
    ctx ? `${ctx.clinicAddress}, ${ctx.clinicCity}`.replace(/^, |, $/g, '') : '',
    ctx?.clinicPhone ? `Tel. ${ctx.clinicPhone}` : '',
    '',
    `INFORME CLINICO: ${report.title}`,
    patientLabel,
    `Fecha: ${publishedLabel}`,
    '',
    '--- CONTENIDO ---'
  ];

  for (const block of blocks) {
    lines.push('');
    lines.push(block.title.toUpperCase());
    for (const part of block.body.split('\n')) {
      lines.push(...wrapPdfLine(part));
    }
  }

  if (!blocks.length) {
    for (const part of (report.description ?? '').split('\n')) {
      lines.push(...wrapPdfLine(part));
    }
  }

  lines.push('');
  lines.push('--- PROFESIONAL RESPONSABLE ---');
  for (const part of professionalFooter.split('\n')) {
    lines.push(...wrapPdfLine(part));
  }

  return lines.filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''));
}

export async function generateClinicalReportPdfFile(
  payload: ClinicalReportPrintPayload
): Promise<{ fileRef: string; fileName: string }> {
  const safeTitle = payload.report.title.replace(/[^\w\s-áéíóúñ]/gi, '').trim().slice(0, 40) || 'informe';
  const fileName = `${safeTitle}-${payload.report.id.slice(0, 8)}.pdf`;
  const pdfBytes = buildMinimalPdf(buildClinicalReportPdfLines(payload));
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const fileRef = await saveDemoFile(file);
  return { fileRef, fileName };
}

export function openClinicalReportPrintView(html: string) {
  if (typeof window === 'undefined') return;
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function buildClinicalReportPrintHtmlFromState(state: DemoState, report: ClinicalReport) {
  return buildClinicalReportPrintHtml(resolveReportPrintPayload(state, report));
}

export async function ensureClinicalReportPdf(
  state: DemoState,
  report: ClinicalReport
): Promise<{ report: ClinicalReport; fileRef: string; fileName: string }> {
  if (report.fileRef) {
    return {
      report,
      fileRef: report.fileRef,
      fileName: report.fileName ?? `${report.id}.pdf`
    };
  }
  const payload = resolveReportPrintPayload(state, report);
  const { fileRef, fileName } = await generateClinicalReportPdfFile(payload);
  return {
    report: { ...report, fileRef, fileName, mimeType: 'application/pdf' },
    fileRef,
    fileName
  };
}
