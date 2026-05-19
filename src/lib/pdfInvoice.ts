import type { AppSettings, Invoice, Patient } from '@/types/demo';
import { money } from '@/lib/format';
import { saveDemoFile } from '@/lib/demoFiles';
import { defaultInvoiceFileName } from '@/lib/clinical';

/** Genera factura PDF en formato español (IVA, NIF, datos clínica). */
export async function generateInvoicePdfFile(
  invoice: Invoice,
  patient: Patient,
  settings: AppSettings
): Promise<{ fileRef: string; fileName: string }> {
  const vatRate = settings.vatRate ?? 21;
  const base = invoice.amount / (1 + vatRate / 100);
  const vat = invoice.amount - base;
  const series = settings.invoiceSeries ?? 'FAC';
  const nif = settings.nif ?? 'B00000000';
  const legal = settings.legalName ?? settings.clinicName;

  const lines = [
    legal.toUpperCase(),
    `NIF: ${nif}`,
    settings.address ? `${settings.address}, ${settings.city ?? ''}` : '',
    settings.phone ? `Tel: ${settings.phone}` : '',
    settings.email ? `Email: ${settings.email}` : '',
    '',
    `FACTURA ${series} ${invoice.id}`,
    `Fecha emision: ${invoice.issuedAt}`,
    invoice.dueDate ? `Vencimiento: ${invoice.dueDate}` : '',
    '',
    'DATOS DEL PACIENTE',
    `${patient.fullName}`,
    patient.dni ? `NIF/DNI: ${patient.dni}` : '',
    `ID paciente: ${patient.id}`,
    '',
    'CONCEPTO',
    invoice.concept,
    '',
    'DESGLOSE (EUR)',
    `Base imponible: ${money(base)}`,
    `IVA (${vatRate}%): ${money(vat)}`,
    `TOTAL: ${money(invoice.amount)}`,
    '',
    `Estado: ${invoice.status}`,
    '',
    'Documento generado por Dentista+ · Valido como factura simplificada demo.'
  ].filter(Boolean);

  const pdfBytes = buildMinimalPdf(lines);
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const fileName = defaultInvoiceFileName(series, invoice.id, patient.fullName);
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const fileRef = await saveDemoFile(file);
  return { fileRef, fileName };
}

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildMinimalPdf(lines: string[]): Uint8Array {
  const contentLines = lines.map((line, i) => `1 0 0 1 50 ${740 - i * 16} Tm (${escapePdfText(line)}) Tj`);
  const stream = ['BT', '/F1 10 Tf', ...contentLines, 'ET'].join('\n');
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
