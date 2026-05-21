/** Etiquetas de eventos PdP — seguro para importar en componentes cliente. */

const EVENT_LABELS: Record<string, string> = {
  token_created: 'Token creado',
  token_revoked: 'Token revocado',
  portal_open: 'Apertura del portal',
  nav_click: 'Navegación',
  view_report: 'Consulta informe',
  view_document: 'Consulta documento',
  view_invoice: 'Consulta factura',
  view_consent: 'Consulta consentimiento',
  other: 'Otra acción'
};

export function portalAuditEventLabel(eventType: string) {
  return EVENT_LABELS[eventType] ?? eventType;
}
