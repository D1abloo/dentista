import type { ClinicalReport, DemoState, Invoice, PatientDocument, Payment } from '@/types/demo';
import { getStoredTenantId } from '@/lib/demoSessionStorage';
import { forTenant } from '@/lib/tenant';

export function getPatientById(state: DemoState, patientId: string) {
  return state.patients.find((p) => p.id === patientId);
}

export function patientName(state: DemoState, patientId: string) {
  return getPatientById(state, patientId)?.fullName ?? 'Paciente desconocido';
}

export function recordsForPatient(state: DemoState, patientId: string, tenantId = getStoredTenantId()) {
  const inTenant = <T extends { patientId: string; tenantId: string }>(items: T[]) =>
    forTenant(
      items.filter((x) => x.patientId === patientId),
      tenantId
    );
  return {
    appointments: inTenant(state.appointments),
    reports: inTenant(state.clinicalReports),
    invoices: inTenant(state.invoices),
    payments: inTenant(state.payments),
    documents: inTenant(state.patientDocuments),
    messages: inTenant(state.messages),
    notes: inTenant(state.adminNotes)
  };
}

export function visibleReportsForPatient(state: DemoState, patientId: string): ClinicalReport[] {
  return state.clinicalReports.filter((r) => r.patientId === patientId && r.visibleToPatient);
}

export function visibleDocumentsForPatient(state: DemoState, patientId: string): PatientDocument[] {
  return state.patientDocuments.filter((d) => d.patientId === patientId && d.visibility === 'paciente');
}

export function visibleInvoicesForPatient(state: DemoState, patientId: string): Invoice[] {
  return state.invoices.filter(
    (i) => i.patientId === patientId && i.portalVisible !== false && i.status !== 'cancelada'
  );
}

export function pendingInvoicesForPatient(state: DemoState, patientId: string): Invoice[] {
  return state.invoices.filter((i) => i.patientId === patientId && (i.status === 'pendiente' || i.status === 'vencida'));
}

export type ActivityItem = {
  id: string;
  at: string;
  label: string;
  patientId: string;
  patientName: string;
  kind: 'cita' | 'informe' | 'factura' | 'pago' | 'documento';
};

export function recentPatientActivity(state: DemoState, limit = 8, tenantId = getStoredTenantId()) {
  const items: ActivityItem[] = [];
  const invoices = forTenant(state.invoices, tenantId);
  const reports = forTenant(state.clinicalReports, tenantId);
  const payments = forTenant(state.payments, tenantId);
  const documents = forTenant(state.patientDocuments, tenantId);

  for (const i of invoices) {
    items.push({
      id: i.id,
      at: i.issuedAt,
      patientId: i.patientId,
      patientName: patientName(state, i.patientId),
      kind: 'factura',
      label: `Factura ${i.id} · ${patientName(state, i.patientId)}`
    });
  }
  for (const r of reports) {
    items.push({
      id: r.id,
      at: r.createdAt,
      patientId: r.patientId,
      patientName: patientName(state, r.patientId),
      kind: 'informe',
      label: `Informe ${r.id} · ${patientName(state, r.patientId)}`
    });
  }
  for (const p of payments) {
    items.push({
      id: p.id,
      at: p.paidAt ?? p.createdAt,
      patientId: p.patientId,
      patientName: patientName(state, p.patientId),
      kind: 'pago',
      label: `Pago ${p.id} · ${patientName(state, p.patientId)}`
    });
  }
  for (const d of documents) {
    if (d.visibility === 'paciente') {
      items.push({
        id: d.id,
        at: d.createdAt,
        patientId: d.patientId,
        patientName: patientName(state, d.patientId),
        kind: 'documento',
        label: `Documento ${d.id} · ${patientName(state, d.patientId)}`
      });
    }
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export function patientPortalNews(state: DemoState, patientId: string, limit = 5): ActivityItem[] {
  const items: ActivityItem[] = [];
  const reports = visibleReportsForPatient(state, patientId);
  const invoices = pendingInvoicesForPatient(state, patientId);
  const docs = visibleDocumentsForPatient(state, patientId);
  const pays = state.payments.filter((p) => p.patientId === patientId);

  if (reports[0]) {
    items.push({
      id: reports[0].id,
      at: reports[0].createdAt,
      patientId,
      patientName: patientName(state, patientId),
      kind: 'informe',
      label: `Nuevo informe: ${reports[0].title}`
    });
  }
  if (invoices[0]) {
    items.push({
      id: invoices[0].id,
      at: invoices[0].issuedAt,
      patientId,
      patientName: patientName(state, patientId),
      kind: 'factura',
      label: `Factura pendiente: ${invoices[0].id}`
    });
  }
  if (pays[0]) {
    items.push({
      id: pays[0].id,
      at: pays[0].paidAt ?? pays[0].createdAt,
      patientId,
      patientName: patientName(state, patientId),
      kind: 'pago',
      label: `Pago registrado: ${pays[0].id}`
    });
  }
  if (docs[0]) {
    items.push({
      id: docs[0].id,
      at: docs[0].createdAt,
      patientId,
      patientName: patientName(state, patientId),
      kind: 'documento',
      label: `Documento: ${docs[0].title}`
    });
  }
  return items.slice(0, limit);
}
