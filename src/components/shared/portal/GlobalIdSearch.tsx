import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useDemoStore } from '@/hooks/useDemoStore';
import { findPatientIdByQuery } from '@/lib/patientSearch';
import { IdBadge } from '@/components/ui/IdBadge';
import { Input } from '@/components/ui';

type Hit = { id: string; kind: 'paciente' | 'cita' | 'informe' | 'documento' | 'factura' | 'pago'; href: string; label: string };

export function GlobalIdSearch() {
  const { state } = useDemoStore();
  const [q, setQ] = useState('');

  const hits = useMemo((): Hit[] => {
    const s = q.trim().toUpperCase();
    if (s.length < 3) return [];
    const out: Hit[] = [];

    for (const p of state.patients) {
      if (p.id.includes(s) || p.dni?.toUpperCase().includes(s)) {
        out.push({ id: p.id, kind: 'paciente', href: `/admin/pacientes/${p.id}`, label: p.fullName });
      }
    }
    for (const a of state.appointments) {
      if (a.id.includes(s)) out.push({ id: a.id, kind: 'cita', href: '/admin/citas', label: `Cita · ${a.id}` });
    }
    for (const r of state.clinicalReports) {
      if (r.id.includes(s)) out.push({ id: r.id, kind: 'informe', href: '/admin/informes', label: r.title });
    }
    for (const d of state.patientDocuments) {
      if (d.id.includes(s)) out.push({ id: d.id, kind: 'documento', href: '/admin/documentos', label: d.title });
    }
    for (const i of state.invoices) {
      if (i.id.includes(s)) out.push({ id: i.id, kind: 'factura', href: '/admin/facturas', label: i.concept });
    }
    for (const p of state.payments) {
      if (p.id.includes(s)) out.push({ id: p.id, kind: 'pago', href: '/admin/pagos', label: `Pago ${p.id}` });
    }

    const patientId = findPatientIdByQuery(state, q);
    if (patientId && !out.some((h) => h.id === patientId)) {
      const p = state.patients.find((x) => x.id === patientId);
      if (p) out.unshift({ id: p.id, kind: 'paciente', href: `/admin/pacientes/${p.id}`, label: p.fullName });
    }

    return out.slice(0, 8);
  }, [state, q]);

  return (
    <div className="global-id-search">
      <Search className="global-id-search__icon" aria-hidden />
      <Input
        className="global-id-search__input !pl-9"
        placeholder="Buscar PAT-, CIT-, INF-, FAC-, PAG-, DOC-…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Buscar por ID en administración"
      />
      {hits.length ? (
        <ul className="global-id-search__results">
          {hits.map((h) => (
            <li key={`${h.kind}-${h.id}`}>
              <a href={h.href} className="global-id-search__hit" onClick={() => setQ('')}>
                <IdBadge id={h.id} kind={h.kind} />
                <span className="truncate text-sm font-semibold">{h.label}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
