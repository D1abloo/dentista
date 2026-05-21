import type { DemoState, Invoice } from '@/types/demo';
import { patientMatchesQuery, normalizeSearch } from '@/lib/patientSearch';
import { patientName } from '@/lib/selectors';
import { patientsForTenant } from '@/lib/tenant';

export type AdminSearchKind = 'all' | 'pacientes' | 'facturas' | 'citas' | 'informes' | 'documentos' | 'pagos';

export type AdminSearchHit = {
  id: string;
  kind: 'paciente' | 'cita' | 'informe' | 'documento' | 'factura' | 'pago';
  href: string;
  label: string;
  meta?: string;
};

function invoiceMatchesQuery(state: DemoState, inv: Invoice, q: string, scopePatientIds: Set<string>) {
  const nq = normalizeSearch(q);
  if (!nq) return true;
  if (inv.id.toLowerCase().includes(nq) || inv.concept.toLowerCase().includes(nq)) return true;
  const p = state.patients.find((x) => x.id === inv.patientId);
  if (!p || !scopePatientIds.has(p.id)) return false;
  return patientMatchesQuery(p, q);
}

export function runAdminSearch(
  state: DemoState,
  opts: {
    q: string;
    kind: AdminSearchKind;
    tenantId: string;
    scopePatientIds: string[];
    appointments: { id: string; patientId: string; date: string; time: string }[];
    invoices: Invoice[];
    invoiceIds: Set<string>;
  }
): AdminSearchHit[] {
  const query = opts.q.trim();
  if (query.length < 2) return [];

  const scopePatientIds = new Set(opts.scopePatientIds);
  const tenantIds = new Set([opts.tenantId]);
  const out: AdminSearchHit[] = [];
  const kinds =
    opts.kind === 'all'
      ? (['pacientes', 'facturas', 'citas', 'informes', 'documentos', 'pagos'] as const)
      : ([opts.kind] as const);

  for (const k of kinds) {
    if (k === 'pacientes') {
      for (const p of state.patients) {
        if (!scopePatientIds.has(p.id)) continue;
        if (!patientMatchesQuery(p, query)) continue;
        const meta = [p.nhc ? `NHC ${p.nhc}` : null, p.dni ? `DNI ${p.dni}` : null, p.email]
          .filter(Boolean)
          .join(' · ');
        out.push({
          id: p.id,
          kind: 'paciente',
          href: `/admin/pacientes/${p.id}`,
          label: p.fullName,
          meta
        });
      }
    }

    if (k === 'citas') {
      for (const a of opts.appointments) {
        const name = patientName(state, a.patientId);
        const p = state.patients.find((x) => x.id === a.patientId);
        const match =
          a.id.toLowerCase().includes(normalizeSearch(query)) ||
          a.date.includes(query) ||
          name.toLowerCase().includes(normalizeSearch(query)) ||
          (p && patientMatchesQuery(p, query));
        if (!match) continue;
        out.push({
          id: a.id,
          kind: 'cita',
          href: '/admin/citas',
          label: `${name} · ${a.date} ${a.time}`,
          meta: p?.nhc ? `NHC ${p.nhc}` : a.id
        });
      }
    }

    if (k === 'facturas') {
      for (const inv of opts.invoices) {
        if (!invoiceMatchesQuery(state, inv, query, scopePatientIds)) continue;
        const p = state.patients.find((x) => x.id === inv.patientId);
        out.push({
          id: inv.id,
          kind: 'factura',
          href: '/admin/facturas',
          label: inv.concept,
          meta: p ? `${p.fullName}${p.nhc ? ` · NHC ${p.nhc}` : ''}` : inv.id
        });
      }
    }

    if (k === 'informes') {
      for (const r of state.clinicalReports) {
        if (!tenantIds.has(r.tenantId)) continue;
        const p = state.patients.find((x) => x.id === r.patientId);
        const match =
          r.id.toLowerCase().includes(normalizeSearch(query)) ||
          r.title.toLowerCase().includes(normalizeSearch(query)) ||
          (p && scopePatientIds.has(p.id) && patientMatchesQuery(p, query));
        if (!match) continue;
        out.push({
          id: r.id,
          kind: 'informe',
          href: '/admin/informes',
          label: r.title,
          meta: p?.nhc ? `NHC ${p.nhc}` : undefined
        });
      }
    }

    if (k === 'documentos') {
      for (const d of state.patientDocuments) {
        if (!tenantIds.has(d.tenantId)) continue;
        const p = state.patients.find((x) => x.id === d.patientId);
        const match =
          d.id.toLowerCase().includes(normalizeSearch(query)) ||
          d.title.toLowerCase().includes(normalizeSearch(query)) ||
          (p && scopePatientIds.has(p.id) && patientMatchesQuery(p, query));
        if (!match) continue;
        out.push({
          id: d.id,
          kind: 'documento',
          href: '/admin/documentos',
          label: d.title,
          meta: p?.nhc ? `NHC ${p.nhc}` : undefined
        });
      }
    }

    if (k === 'pagos') {
      for (const pay of state.payments) {
        if (!pay.invoiceId || !opts.invoiceIds.has(pay.invoiceId)) continue;
        const inv = opts.invoices.find((i) => i.id === pay.invoiceId);
        const match =
          pay.id.toLowerCase().includes(normalizeSearch(query)) ||
          (inv && invoiceMatchesQuery(state, inv, query, scopePatientIds));
        if (!match) continue;
        out.push({
          id: pay.id,
          kind: 'pago',
          href: '/admin/pagos',
          label: `Pago ${pay.id}`,
          meta: inv?.concept
        });
      }
    }
  }

  return out.slice(0, 12);
}

export function scopePatientIdsForTenant(state: DemoState, tenantId: string) {
  return patientsForTenant(state, tenantId);
}
