import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useDemoStore } from '@/hooks/useDemoStore';
import { useTenant } from '@/hooks/useTenant';
import { findPatientIdByQuery } from '@/lib/patientSearch';
import { patientsForTenant } from '@/lib/tenant';
import { IdBadge } from '@/components/ui/IdBadge';
import { Input } from '@/components/ui';

type Hit = { id: string; kind: 'paciente' | 'cita' | 'informe' | 'documento' | 'factura' | 'pago'; href: string; label: string };

export function GlobalIdSearch() {
  const { state } = useDemoStore();
  const scope = useTenant();
  const [q, setQ] = useState('');

  const hits = useMemo((): Hit[] => {
    const s = q.trim().toUpperCase();
    if (s.length < 3) return [];
    const out: Hit[] = [];
    const tenantIds = new Set([scope.tenantId]);
    const scopePatientIds = new Set(patientsForTenant(state, scope.tenantId));
    const scopeInvoiceIds = new Set(scope.invoices.map((i) => i.id));

    for (const p of state.patients) {
      if (!scopePatientIds.has(p.id)) continue;
      if (p.id.includes(s) || p.dni?.toUpperCase().includes(s)) {
        out.push({ id: p.id, kind: 'paciente', href: `/admin/pacientes/${p.id}`, label: p.fullName });
      }
    }
    for (const a of scope.appointments) {
      if (a.id.includes(s)) out.push({ id: a.id, kind: 'cita', href: '/admin/citas', label: `Cita · ${a.id}` });
    }
    for (const r of state.clinicalReports) {
      if (!tenantIds.has(r.tenantId)) continue;
      if (r.id.includes(s)) out.push({ id: r.id, kind: 'informe', href: '/admin/informes', label: r.title });
    }
    for (const d of state.patientDocuments) {
      if (!tenantIds.has(d.tenantId)) continue;
      if (d.id.includes(s)) out.push({ id: d.id, kind: 'documento', href: '/admin/documentos', label: d.title });
    }
    for (const i of scope.invoices) {
      if (i.id.includes(s)) out.push({ id: i.id, kind: 'factura', href: '/admin/facturas', label: i.concept });
    }
    for (const p of state.payments) {
      if (!p.invoiceId || !scopeInvoiceIds.has(p.invoiceId)) continue;
      if (p.id.includes(s)) out.push({ id: p.id, kind: 'pago', href: '/admin/pagos', label: `Pago ${p.id}` });
    }

    const patientId = findPatientIdByQuery(state, q);
    if (patientId && !out.some((h) => h.id === patientId)) {
      const p = state.patients.find((x) => x.id === patientId);
      if (p) out.unshift({ id: p.id, kind: 'paciente', href: `/admin/pacientes/${p.id}`, label: p.fullName });
    }

    return out.slice(0, 8);
  }, [state, scope, q]);

  return (
    <div className="id-search">
      <Search className="id-search__icon" aria-hidden />
      <Input
        className="id-search__input"
        placeholder="PAT-, CIT-, INF-…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Buscar por ID"
      />
      {hits.length ? (
        <ul className="id-search__drop">
          {hits.map((h) => (
            <li key={`${h.kind}-${h.id}`}>
              <a href={h.href} className="id-search__hit" onClick={() => setQ('')}>
                <IdBadge id={h.id} kind={h.kind} />
                <span className="truncate">{h.label}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
