import type { AppSettings, DemoState, Invoice, Patient } from '@/types/demo';
import { saveDemoFile } from '@/lib/demoFiles';
import {
  buildInvoicePrintHtml,
  buildInvoicePrintHtmlFromState,
  resolveInvoicePrintPayload,
  type InvoicePrintPayload
} from '@/lib/invoice/invoicePrintDocument';
import { invoicePdfFileName } from '@/lib/invoice/invoiceFileName';

export function openInvoicePrintView(html: string, autoPrint = false) {
  if (typeof window === 'undefined') return;
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  if (autoPrint) {
    w.addEventListener('load', () => {
      setTimeout(() => w.print(), 400);
    });
  }
}

export function printInvoiceFromState(state: DemoState, invoice: Invoice, patient: Patient, settings: AppSettings, autoPrint = true) {
  const html = buildInvoicePrintHtmlFromState(state, invoice, patient, settings);
  openInvoicePrintView(html, autoPrint);
}

export function previewInvoiceFromState(state: DemoState, invoice: Invoice, patient: Patient, settings: AppSettings) {
  printInvoiceFromState(state, invoice, patient, settings, false);
}

export async function generateInvoicePrintFile(
  payload: InvoicePrintPayload,
  patientLastName: string
): Promise<{ fileRef: string; fileName: string; mimeType: string }> {
  const html = buildInvoicePrintHtml(payload, { showToolbar: true });
  const fileName = invoicePdfFileName(payload.invoiceNumber, patientLastName);
  const file = new File([html], fileName, { type: 'text/html;charset=utf-8' });
  const fileRef = await saveDemoFile(file);
  return { fileRef, fileName, mimeType: 'text/html;charset=utf-8' };
}

export async function generateInvoicePdfFile(
  state: DemoState,
  invoice: Invoice,
  patient: Patient,
  settings: AppSettings
): Promise<{ fileRef: string; fileName: string; mimeType: string }> {
  const payload = resolveInvoicePrintPayload(state, invoice, patient, settings);
  const lastName = patient.fullName.trim().split(/\s+/).pop() ?? 'Paciente';
  return generateInvoicePrintFile(payload, lastName);
}

export function invoiceFiscalWarnings(settings: AppSettings, state: DemoState, invoice: Invoice, patient: Patient) {
  const payload = resolveInvoicePrintPayload(state, invoice, patient, settings);
  const warnings: string[] = [];
  if (payload.fiscalIncomplete) {
    warnings.push('Completa los datos fiscales de la clínica antes de emitir facturas.');
  }
  if (payload.licensePending && payload.professionalName !== 'Profesional no asignado') {
    warnings.push('El nº de colegiado del profesional está pendiente.');
  }
  return warnings;
}

export async function downloadInvoiceFromState(
  state: DemoState,
  invoice: Invoice,
  patient: Patient,
  settings: AppSettings
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const html = buildInvoicePrintHtmlFromState(state, invoice, patient, settings);
  openInvoicePrintView(html, true);
  return true;
}
