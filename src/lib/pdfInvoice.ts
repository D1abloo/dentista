import type { Invoice, Patient } from '@/types/demo';
import { money } from '@/lib/format';
import { saveDemoFile } from '@/lib/demoFiles';

/** Genera un PDF mínimo válido (demo) y lo guarda en el almacén local */
export async function generateInvoicePdfFile(invoice: Invoice, patient: Patient): Promise<{ fileRef: string; fileName: string }> {
  const lines = [
    'Dentista+ · Factura clinica',
    `Factura: ${invoice.id}`,
    `Paciente: ${patient.fullName} (${patient.id})`,
    patient.dni ? `DNI: ${patient.dni}` : '',
    `Concepto: ${invoice.concept}`,
    `Importe: ${money(invoice.amount)}`,
    `Estado: ${invoice.status}`,
    `Emision: ${invoice.issuedAt}`,
    invoice.dueDate ? `Vencimiento: ${invoice.dueDate}` : ''
  ].filter(Boolean);

  const pdfBytes = buildMinimalPdf(lines);
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const fileName = `${invoice.id}.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const fileRef = await saveDemoFile(file);
  return { fileRef, fileName };
}

function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildMinimalPdf(lines: string[]): Uint8Array {
  const contentLines = lines.map((line, i) => `1 0 0 1 50 ${740 - i * 18} Tm (${escapePdfText(line)}) Tj`);
  const stream = ['BT', '/F1 11 Tf', ...contentLines, 'ET'].join('\n');
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
