import type { AppSettings, Appointment, Clinic, Patient } from '@/types/demo';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { saveDemoFile } from '@/lib/demoFiles';

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
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

/** Justificante de asistencia (sin motivo de consulta). */
export async function generateAppointmentCertificatePdf(
  appointment: Appointment,
  patient: Patient,
  clinic: Clinic,
  settings: AppSettings
): Promise<{ fileRef: string; fileName: string }> {
  const legal = settings.legalName ?? settings.clinicName ?? clinic.name;
  const lines = [
    legal.toUpperCase(),
    settings.nif ? `NIF: ${settings.nif}` : '',
    clinic.address ? `${clinic.address}, ${clinic.city}` : settings.address,
    settings.phone ? `Tel: ${settings.phone}` : clinic.phone,
    '',
    'JUSTIFICANTE DE ASISTENCIA',
    '',
    'Se certifica que el/la paciente:',
    patient.fullName,
    patient.dni ? `DNI/NIF: ${patient.dni}` : '',
    '',
    'Ha acudido a esta clínica en la fecha y hora indicadas.',
    '',
    `Fecha: ${fmtDate(appointment.date)}`,
    `Hora: ${appointment.time.slice(0, 5)}`,
    `Centro: ${clinic.name}`,
    '',
    settings.clinicStampUrl ? '[Sello clínica adjunto en versión digital]' : '',
    '',
    `Documento emitido: ${fmtDateTime(new Date().toISOString().slice(0, 10), '12:00')}`,
    'Documento generado por Dentista+.',
    'No incluye diagnóstico ni motivo de la consulta.'
  ].filter(Boolean);

  const pdfBytes = buildMinimalPdf(lines);
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const safeName = patient.fullName.replace(/\s+/g, '-').slice(0, 24);
  const fileName = `justificante-${appointment.id}-${safeName}.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });
  const fileRef = await saveDemoFile(file);
  return { fileRef, fileName };
}

export function downloadCertificateBlob(fileRef: string, fileName: string) {
  const a = document.createElement('a');
  a.href = fileRef;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
