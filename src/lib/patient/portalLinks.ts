export function invoiceDetailHref(invoiceId: string) {
  return `/paciente/facturas?factura=${encodeURIComponent(invoiceId)}`;
}

export function reportDetailHref(reportId: string) {
  return `/paciente/informes?focus=${encodeURIComponent(reportId)}`;
}

export function documentDetailHref(documentId: string) {
  return `/paciente/documentos?documento=${encodeURIComponent(documentId)}`;
}

export function appointmentDetailHref(appointmentId: string) {
  return `/paciente/citas?focus=${encodeURIComponent(appointmentId)}`;
}

export function messageContextHref(opts: {
  contexto?: string;
  appointmentId?: string;
  invoiceId?: string;
  documentId?: string;
  reportId?: string;
  consentId?: string;
  subject?: string;
}) {
  const p = new URLSearchParams();
  if (opts.contexto) p.set('contexto', opts.contexto);
  if (opts.appointmentId) p.set('cita', opts.appointmentId);
  if (opts.invoiceId) p.set('factura', opts.invoiceId);
  if (opts.documentId) p.set('documento', opts.documentId);
  if (opts.reportId) p.set('informe', opts.reportId);
  if (opts.consentId) p.set('consentimiento', opts.consentId);
  if (opts.subject) p.set('asunto', opts.subject);
  const q = p.toString();
  return q ? `/paciente/mensajes?${q}` : '/paciente/mensajes';
}
