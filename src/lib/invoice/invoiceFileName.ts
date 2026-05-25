/** Nombre de archivo para factura descargable (HTML imprimible → PDF del navegador). */
export function invoicePdfFileName(invoiceNumber: string, patientLastName: string): string {
  const safeNum = invoiceNumber.replace(/[^\w-]/g, '-');
  const safeName = patientLastName.replace(/\s+/g, '-').replace(/[^\wáéíóúñÁÉÍÓÚÑ-]/gi, '') || 'Paciente';
  return `Factura-${safeNum}-${safeName}-AgendaClinic.html`;
}
