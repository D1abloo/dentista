import type { AppSettings, DemoState, Invoice, Patient } from '@/types/demo';
import { generateTextSummaryPdf as generateTextSummaryPdfLegacy } from '@/lib/invoice/invoiceSummaryPdf';
import {
  downloadInvoiceFromState,
  generateInvoicePdfFile as generateInvoicePrintBundle,
  invoiceFiscalWarnings,
  previewInvoiceFromState,
  printInvoiceFromState
} from '@/lib/invoice/invoicePdf';

export async function generateInvoicePdfFile(
  invoice: Invoice,
  patient: Patient,
  settings: AppSettings,
  state: DemoState
): Promise<{ fileRef: string; fileName: string; mimeType: string }> {
  return generateInvoicePrintBundle(state, invoice, patient, settings);
}

export {
  downloadInvoiceFromState,
  invoiceFiscalWarnings,
  previewInvoiceFromState,
  printInvoiceFromState
};

export async function generateInvoicesSummaryPdf(
  _invoices: Invoice[],
  lines: string[]
): Promise<{ fileRef: string; fileName: string }> {
  return generateTextSummaryPdfLegacy('informe-facturas', lines);
}

export async function generateTextSummaryPdf(namePrefix: string, lines: string[]) {
  return generateTextSummaryPdfLegacy(namePrefix, lines);
}
