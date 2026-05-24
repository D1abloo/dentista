import { isActiveStatus } from '@/lib/appointments';
import { effectiveStatus } from '@/lib/invoiceAdmin';
import { money, todayIso } from '@/lib/format';
import { patientName } from '@/lib/selectors';
import type { DemoState } from '@/types/demo';

export type ClinicalOpsArea = 'citas' | 'facturas' | 'informes' | 'documentos';

export type ClinicalOpsKpis = {
  citasHoy: number;
  citasPendientes: number;
  facturasPendientes: number;
  facturasImporte: string;
  informesMes: number;
  informesPortal: number;
  documentosRecientes: number;
  documentosPaciente: number;
};

export type ClinicalOpsActivity = {
  id: string;
  area: ClinicalOpsArea;
  title: string;
  meta: string;
  href: string;
  at: string;
};

export function parseClinicalOpsArea(raw: string | null): ClinicalOpsArea | null {
  if (raw === 'citas' || raw === 'facturas' || raw === 'informes' || raw === 'documentos') return raw;
  return null;
}

export function buildClinicalOpsKpis(state: DemoState, tenantId: string): ClinicalOpsKpis {
  const today = todayIso();
  const monthPrefix = today.slice(0, 7);

  const appts = state.appointments.filter((a) => a.tenantId === tenantId);
  const citasHoy = appts.filter((a) => a.date === today && isActiveStatus(a.status)).length;
  const citasPendientes = appts.filter((a) => a.status === 'pendiente').length;

  const invoices = state.invoices.filter((i) => i.tenantId === tenantId);
  const pending = invoices.filter((i) => {
    const st = effectiveStatus(i, today);
    return st === 'pendiente' || st === 'vencida';
  });
  const facturasImporte = money(pending.reduce((s, i) => s + i.amount, 0));

  const reports = state.clinicalReports.filter((r) => r.tenantId === tenantId);
  const informesMes = reports.filter((r) => r.createdAt.startsWith(monthPrefix)).length;
  const informesPortal = reports.filter((r) => r.visibleToPatient).length;

  const docs = state.patientDocuments.filter((d) => d.tenantId === tenantId);
  const cutoff = Date.now() - 30 * 86400000;
  const documentosRecientes = docs.filter((d) => new Date(d.createdAt).getTime() >= cutoff).length;
  const documentosPaciente = docs.filter((d) => d.visibility === 'paciente').length;

  return {
    citasHoy,
    citasPendientes,
    facturasPendientes: pending.length,
    facturasImporte,
    informesMes,
    informesPortal,
    documentosRecientes,
    documentosPaciente
  };
}

export function buildClinicalOpsActivity(
  state: DemoState,
  tenantId: string,
  limit = 8
): ClinicalOpsActivity[] {
  const items: ClinicalOpsActivity[] = [];

  for (const a of state.appointments.filter((x) => x.tenantId === tenantId).slice(0, 20)) {
    items.push({
      id: `appt-${a.id}`,
      area: 'citas',
      title: `Cita · ${patientName(state, a.patientId)}`,
      meta: `${a.date} ${a.time}`,
      href: '/admin/operaciones?area=citas',
      at: `${a.date}T${a.time}`
    });
  }

  for (const inv of state.invoices.filter((x) => x.tenantId === tenantId).slice(0, 12)) {
    items.push({
      id: `inv-${inv.id}`,
      area: 'facturas',
      title: `Factura · ${patientName(state, inv.patientId)}`,
      meta: money(inv.amount),
      href: '/admin/operaciones?area=facturas',
      at: inv.issuedAt
    });
  }

  for (const r of state.clinicalReports.filter((x) => x.tenantId === tenantId).slice(0, 12)) {
    items.push({
      id: `rep-${r.id}`,
      area: 'informes',
      title: r.title,
      meta: patientName(state, r.patientId),
      href: '/admin/operaciones?area=informes',
      at: r.createdAt
    });
  }

  for (const d of state.patientDocuments.filter((x) => x.tenantId === tenantId).slice(0, 12)) {
    items.push({
      id: `doc-${d.id}`,
      area: 'documentos',
      title: d.title,
      meta: patientName(state, d.patientId),
      href: '/admin/operaciones?area=documentos',
      at: d.createdAt
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
